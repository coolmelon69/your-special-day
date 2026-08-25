/**
 * Self-check for the coupon and stamp off switches. No test framework:
 *   npx tsx src/utils/couponStampVisibility.check.ts
 *
 * Hiding here is client-side truth by design (see the migration's header), so
 * there is no database half to keep in step — which makes the client half the
 * whole guarantee, and the drift that matters is an admin toggle that writes
 * `hidden` while some reader downstream never filters on it. Every assertion
 * below pairs a write with the read that has to honour it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("sql/2026-08-25-coupon-stamp-visibility.sql", "utf8");
const types = readFileSync("src/types/admin.ts", "utf8");
const sync = readFileSync("src/utils/supabaseSync.ts", "utf8");
const context = readFileSync("src/contexts/AdventureContext.tsx", "utf8");
const couponsManager = readFileSync("src/components/admin/CouponsManager.tsx", "utf8");
const stampsManager = readFileSync("src/components/admin/StampsManager.tsx", "utf8");

// --- the column exists on both tables, and seeds false ------------------------

for (const table of ["custom_coupons", "custom_stamps"]) {
  assert.match(
    migration,
    new RegExp(`alter table ${table}\\s+add column if not exists hidden boolean not null default false`),
    `${table}.hidden must seed false, so running the migration changes nothing on its own`,
  );
}

assert.match(types, /hidden\?: boolean/g, "both CustomStamp and CustomCoupon need the field");
assert.equal(
  (types.match(/hidden\?: boolean/g) ?? []).length,
  2,
  "exactly two types carry hidden — CustomStamp and CustomCoupon",
);

// --- the flag survives a round trip through Supabase --------------------------

// Writing it: an admin toggling on one device and seeing it undone on the next
// is worse than the switch not existing.
assert.match(sync, /is_past: stamp\.isPast,\s*\n\s*hidden: stamp\.hidden \?\? false,/, "syncCustomStamps must write hidden");
assert.match(sync, /category: coupon\.category \|\| null,\s*\n\s*hidden: coupon\.hidden \?\? false,/, "syncCustomCoupons must write hidden");

// Reading it back: four load paths (plain + Result, stamps + coupons), and a
// reader that forgets the column silently un-hides everything it loads.
assert.equal(
  (sync.match(/hidden: record\.hidden \?\? false,/g) ?? []).length,
  4,
  "all four load mappings must read hidden back — plain and Result, stamps and coupons",
);

// --- nothing hidden reaches her side of the app ------------------------------

// One filter per place custom stamps enter the context: the initial load, the
// logged-out/local path, the cloud reload, and the reset.
assert.equal(
  (context.match(/\.filter\(\(stamp\) => !stamp\.hidden\)/g) ?? []).length,
  4,
  "every custom-stamp load in AdventureContext must drop hidden rows before merging",
);
assert.match(
  context,
  /customCoupons = customCoupons\.filter\(\(coupon\) => !coupon\.hidden\)/,
  "hidden coupons must leave her book entirely, including already-unlocked ones",
);

// --- the admin panel can still see and reverse what it hid -------------------

// The old behaviour filtered hidden defaults out of the admin list too, which
// made hiding a one-way door. The list is built from every default now, and the
// dimming is what tells them apart.
assert.match(
  couponsManager,
  /buildOrderedCouponList\(DEFAULT_COUPONS, coupons, couponOrder\)/,
  "the coupon admin list must include hidden defaults, or they cannot be shown again",
);
assert.match(
  stampsManager,
  /buildOrderedStampList\(initialItinerary, stamps, stampOrder\)/,
  "the stamp admin list must include hidden defaults, or they cannot be shown again",
);

for (const [name, source] of [
  ["CouponsManager", couponsManager],
  ["StampsManager", stampsManager],
] as const) {
  assert.match(source, /const handleToggleVisibility = async/, `${name} needs the single toggle entry point`);
  assert.match(source, /isHidden \? <EyeOff/, `${name}'s toggle must show which state it is in`);
  // Toggling a default has to be reversible in both directions — the old
  // handler only ever appended to the disabled list.
  assert.match(
    source,
    /currentDisabled\.(includes|filter)/,
    `${name} must remove from the disabled list as well as add to it`,
  );
}

console.log("coupon + stamp visibility: ok");
