/**
 * Self-check for the shared-table scope rule.
 *
 * Run with:  node src/utils/coupleScope.check.ts
 *
 * Imports the real helpers from `coupleScope.ts` — not copies. An earlier
 * version of this file re-implemented them verbatim because `supabaseSync.ts`
 * can't be imported outside Vite, which meant it would have passed happily
 * while the shipped code drifted underneath it. The pure logic now lives in a
 * client-free module for exactly this reason.
 *
 * What matters here is that the client predicate matches the RLS policy in
 * sql/2026-08-09-shared-journey.sql. A mismatch doesn't throw — the query just
 * returns nothing, which in this app looks like her journey being empty.
 */
// Explicit .ts extension so this runs under plain `node` — the same convention
// couples.ts uses for its lazy client import.
import { applyScope, scopeColumns, scopeConflict, type Scope } from "./coupleScope.ts";

let failures = 0;

const assert = (label: string, condition: boolean) => {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${label}`);
  }
};

/** Records what a query builder was asked to filter on, so the predicate the
 *  helpers actually produce can be inspected rather than trusted. */
const fakeQuery = () => {
  const calls: string[] = [];
  const query = {
    calls,
    eq(column: string, value: unknown) {
      calls.push(`eq:${column}=${String(value)}`);
      return query;
    },
    is(column: string, value: unknown) {
      calls.push(`is:${column}=${String(value)}`);
      return query;
    },
  };
  return query;
};

const solo: Scope = { coupleId: null, userId: "user-1" };
const linked: Scope = { coupleId: "couple-9", userId: "user-1" };

// --- solo: user_id = me AND couple_id IS NULL --------------------------------
// The `is null` half is the fresh-start rule. Without it, a linked user's old
// solo rows would surface again alongside the shared ones.
{
  const q = fakeQuery();
  applyScope(q, solo);
  assert("solo filters on user_id", q.calls.includes("eq:user_id=user-1"));
  assert("solo filters couple_id is null", q.calls.includes("is:couple_id=null"));
  assert("solo applies exactly two filters", q.calls.length === 2);
}

// --- linked: couple_id = <id>, and NOT user_id ------------------------------
// Filtering on user_id as well would hide whichever rows the partner wrote.
{
  const q = fakeQuery();
  applyScope(q, linked);
  assert("linked filters on couple_id", q.calls.includes("eq:couple_id=couple-9"));
  assert(
    "linked does not filter on user_id",
    !q.calls.some((call) => call.startsWith("eq:user_id")),
  );
  assert("linked applies exactly one filter", q.calls.length === 1);
}

// --- scopeColumns stamps couple_id only when linked -------------------------
{
  assert("solo write leaves couple_id null", scopeColumns(solo).couple_id === null);
  assert("solo write keeps user_id", scopeColumns(solo).user_id === "user-1");
  assert("linked write stamps couple_id", scopeColumns(linked).couple_id === "couple-9");
  assert("linked write still records the author", scopeColumns(linked).user_id === "user-1");
}

// --- scopeConflict targets the right unique index ---------------------------
// The solo target must stay byte-identical to what shipped before couples
// existed, or every unlinked upsert starts duplicating rows.
{
  assert("solo conflict target unchanged", scopeConflict(solo, "stamp_key") === "user_id,stamp_key");
  assert("linked conflict target", scopeConflict(linked, "stamp_key") === "couple_id,stamp_key");
  assert("conflict target with no extra columns", scopeConflict(linked) === "couple_id");
  assert(
    "conflict target with several columns",
    scopeConflict(linked, "a", "b") === "couple_id,a,b",
  );
}

if (failures) {
  console.error(`coupleScope.check.ts: ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("coupleScope.check.ts: all assertions passed");
