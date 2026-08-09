/**
 * The scope rule for shared tables, as pure functions.
 *
 * A linked pair reads and writes one journey; a solo account reads and writes
 * its own rows. Both the RLS policies (sql/2026-08-09-shared-journey.sql) and
 * every query in `supabaseSync.ts` have to agree on exactly one predicate:
 *
 *   linked  ->  couple_id = <profiles.couple_id>
 *   solo    ->  user_id = auth.uid() AND couple_id IS NULL
 *
 * Drifting from it doesn't error — it silently returns nothing, which is why
 * these live in one place rather than being spelled out per call site.
 *
 * These are deliberately split out of `supabaseSync.ts`: that module statically
 * imports `./supabaseClient`, which reads `import.meta.env` at module scope and
 * throws outside Vite. Keeping the decision logic in a client-free file lets
 * `coupleScope.check.ts` exercise the real functions under plain `node` instead
 * of a copy of them — a check that re-implements its subject verifies nothing.
 *
 * The `couple_id IS NULL` half of the solo predicate is the fresh-start rule:
 * after linking, a user's old solo rows stay in the table but stop surfacing.
 */

/** Which rows a shared-table call may read or write. */
export type Scope = { coupleId: string; userId: string } | { coupleId: null; userId: string };

/** Minimal shape of the query builder these helpers touch, so they stay
 *  testable without dragging in the Supabase types. */
export interface ScopableQuery<Q> {
  eq(column: string, value: unknown): Q;
  is(column: string, value: unknown): Q;
}

/** Apply the scope's predicate to a query. Mirrors the RLS policy exactly. */
export const applyScope = <Q extends ScopableQuery<Q>>(query: Q, scope: Scope): Q =>
  scope.coupleId
    ? query.eq("couple_id", scope.coupleId)
    : query.eq("user_id", scope.userId).is("couple_id", null);

/** Columns to stamp on an insert/upsert: `couple_id` when linked, so the row is
 *  visible to both halves; null when solo, exactly as today. */
export const scopeColumns = (scope: Scope): { user_id: string; couple_id: string | null } => ({
  user_id: scope.userId,
  couple_id: scope.coupleId,
});

/**
 * onConflict column list for a scoped upsert. The solo target is byte-for-byte
 * what the code sent before couples existed (`user_id,<cols>`), so unlinked
 * behaviour is unchanged. The linked target (`couple_id,<cols>`) makes both
 * partners' upserts of the same logical row collide into one shared row instead
 * of forking a row per writer.
 *
 * Each linked target needs a matching unique index — `unique (couple_id,
 * <cols>)` — alongside the existing solo one. Those live in
 * sql/2026-08-09-shared-journey.sql; if one is missing, the upsert fails loudly
 * with "no unique or exclusion constraint matching ON CONFLICT" rather than
 * quietly duplicating the row.
 *
 * Those indexes must not be partial. PostgREST sends the conflict target as a
 * bare column list, and Postgres only infers a partial index when the statement
 * repeats the index predicate — so `where couple_id is not null` on the index
 * produces that same 42P10 error on every linked write.
 */
export const scopeConflict = (scope: Scope, ...cols: string[]): string =>
  [scope.coupleId ? "couple_id" : "user_id", ...cols].join(",");
