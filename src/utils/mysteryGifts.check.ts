/**
 * Self-check for the Mystery Gift server contract. No test framework:
 *   node src/utils/mysteryGifts.check.ts
 *
 * `mysteryGifts.ts` itself cannot run here — it imports `@/utils/supabaseClient`,
 * which needs Vite's `import.meta.env`. What it does is call five SQL functions,
 * so what is checked is the contract between the two: that the TypeScript and
 * `sql/2026-08-23-mystery-gifts.sql` still agree on names, arguments, and the
 * rules the client is trusting the server to enforce.
 *
 * The burn — one code, one claim, ever — is the whole feature. If the
 * `claimed_by is null` guard ever leaves that UPDATE, a photographed card
 * becomes infinitely redeemable and nothing else in the codebase would notice.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CODE_LENGTH } from "./mysteryGiftCode.ts";

const sql = readFileSync("sql/2026-08-23-mystery-gifts.sql", "utf8");
const ts = readFileSync("src/utils/mysteryGifts.ts", "utf8");

const fn = (name: string): string => {
  const body = sql.split(`function ${name}(`)[1];
  assert.ok(body, `${name} is missing from the SQL`);
  return body.split("$$;")[0];
};

// ---- every RPC the client calls exists ----

const rpcs = [...ts.matchAll(/supabase\.rpc\("([a-z_]+)"/g)].map((m) => m[1]);
assert.equal(rpcs.length, 5, "every RPC in mysteryGifts.ts is accounted for here");
for (const name of rpcs) {
  assert.ok(sql.includes(`function ${name}(`), `${name} is called but not defined in SQL`);
  assert.ok(
    sql.includes(`grant execute on function ${name}(`),
    `${name} is defined but never granted to authenticated — every call would fail`,
  );
}

// ---- the burn ----

const claim = fn("claim_mystery_gift");
assert.ok(
  /update mystery_gifts[\s\S]*?where code = v_code\s*and claimed_by is null/.test(claim),
  "claim_mystery_gift burns the code in one UPDATE guarded by claimed_by is null",
);
// A read-then-write would reintroduce the race the single UPDATE exists to avoid.
assert.ok(
  claim.indexOf("update mystery_gifts") < claim.indexOf("select exists"),
  "nothing reads the row before the UPDATE claims it",
);
assert.ok(claim.includes("security definer"), "claim runs as owner — RLS denies the table itself");
assert.ok(claim.includes("set search_path = public"), "search_path is pinned");

// RLS with no policy is the only thing keeping unclaimed CODES off the wire.
assert.ok(sql.includes("alter table mystery_gifts enable row level security"), "RLS is on");
assert.ok(!/create policy/i.test(sql), "no policy exists — a permissive one would leak unclaimed codes");

// A claimed code is spent; returning it would let the card be reprinted.
assert.ok(
  !fn("my_claimed_mystery_gifts").includes("g.code"),
  "my_claimed_mystery_gifts never returns the code",
);

// ---- length agreement ----

// The client rejects short codes before calling; the server rejects them again.
// If CODE_LENGTH grows and the SQL does not, every new card is rejected.
for (const name of ["claim_mystery_gift", "create_mystery_gift"]) {
  assert.ok(
    fn(name).includes(`length(v_code) < ${CODE_LENGTH}`),
    `${name} enforces the same ${CODE_LENGTH}-character minimum as mysteryGiftCode.ts`,
  );
}

// ---- normalisation agreement ----

// Both sides strip non-alphanumerics and uppercase. A code stored one way and
// looked up the other never matches, and the card is already printed.
const normalizers = [...sql.matchAll(/upper\(regexp_replace\(coalesce\(p_[a-z]+, ''\), '\[\^A-Za-z0-9\]', '', 'g'\)\)/g)];
assert.equal(normalizers.length, 2, "claim and create both normalise the code the same way");
assert.ok(
  readFileSync("src/utils/mysteryGiftCode.ts", "utf8").includes("replace(/[^A-Za-z0-9]/g, \"\").toUpperCase()"),
  "normalizeGiftCode still matches the SQL regexp",
);

// ---- what may still be deleted ----

// Deleting a claimed gift would take a coupon back out of someone's list.
const del = fn("delete_mystery_gift");
assert.ok(del.includes("created_by = auth.uid()"), "only the author may delete");
assert.ok(del.includes("claimed_by is null"), "a claimed gift cannot be deleted");

// ---- the coupon a gift becomes ----

// Unlocked outright: it was paid for with a printed card, so a stamp gate or a
// price would strand it. `mysteryGifts.ts` builds this literal.
const coupon = ts.split("export const giftToCoupon")[1].split("});")[0];
assert.ok(coupon.includes("requiredStamps: 0"), "a gift coupon needs no stamps");
assert.ok(!coupon.includes("price"), "a gift coupon has no coin price");
assert.ok(coupon.includes('category: "mystery-gift"'), "gift coupons are distinguishable in the list");
assert.ok(coupon.includes("giftCouponId(gift.id)"), "the coupon id comes from the hash, not the raw uuid");

console.log("mysteryGifts.check.ts: all assertions passed");
