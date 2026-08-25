/**
 * Self-check for the shop's off switches. No test framework:
 *   node src/utils/shopVisibility.check.ts
 *
 * Hiding is enforced in two places on purpose — the client stops rendering the
 * item, and the database refuses it — and the dangerous failure is the client
 * half drifting on alone, because then the shop merely *looks* shut. Every
 * assertion below is one half of a pair that has to stay in step.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("sql/2026-08-25-shop-visibility.sql", "utf8");
const shopTab = readFileSync("src/components/ShopTab.tsx", "utf8");
const bagTab = readFileSync("src/components/BagTab.tsx", "utf8");
const config = readFileSync("src/utils/itemShopConfig.ts", "utf8");

// --- the column and the row both exist ---------------------------------------

assert.match(
  migration,
  /alter table item_shop\s+add column if not exists hidden boolean not null default false/,
  "item_shop.hidden must seed false, so running the migration changes nothing on its own",
);
assert.match(
  migration,
  /insert into shop_settings \(id\) values \('shop'\) on conflict do nothing/,
  "shop_settings needs its single row seeded, or the switch has nothing to update",
);

// --- the writes are actually permitted ---------------------------------------

assert.match(
  migration,
  /grant update \([^)]*\bhidden\b[^)]*\) on item_shop to authenticated/,
  "hidden must be in item_shop's column grant or the admin switch silently no-ops",
);
assert.match(
  migration,
  /grant update \([^)]*\bopen\b[^)]*\) on shop_settings to authenticated/,
  "open must be in shop_settings' column grant",
);
assert.match(
  migration,
  /create policy shop_settings_write on shop_settings[\s\S]*?can_admin_shop\(\)/,
  "only the pair owner may shut the shop",
);

// --- buying is refused server-side, not only hidden client-side --------------

const buyItem = migration.slice(migration.indexOf("create or replace function buy_item"));
assert.match(
  buyItem,
  /select open from shop_settings where id = 'shop'/,
  "buy_item must read the whole-shop switch itself — a missing nav tab is not a locked door",
);
assert.match(
  buyItem,
  /select price, stock, hidden into v_price, v_stock, v_hidden/,
  "buy_item must read hidden in the same locked row it reads the price from",
);
assert.match(buyItem, /if v_hidden then\s+return false;/, "buy_item must refuse a hidden item");

// --- redeeming is refused too, which is the harsher half of the decision -----

const redeemItem = migration.slice(migration.indexOf("create or replace function redeem_item"));
assert.match(
  redeemItem,
  /select 1 from item_shop\s+where 'shop:' \|\| slug = p_source\s+and hidden/,
  "redeem_item must refuse a pulled item, matching the source key buy_item writes",
);

// --- the client's half ------------------------------------------------------

assert.match(
  shopTab,
  /ITEM_SHOP_POOL\.filter\(\(item\) => !shopConfig\[item\.slug\]\?\.hidden\)/,
  "the shop must drop hidden items from the pool, not merely grey them out",
);
assert.ok(
  shopTab.includes("shelvesBare"),
  "an empty shelf needs words — every item hidden must not render a grid-shaped hole",
);
assert.ok(
  bagTab.includes("activePulled"),
  "the bag must say why a pulled coupon has no Redeem button rather than failing on tap",
);

// --- reads fail open --------------------------------------------------------

const loadShopOpen = config.slice(config.indexOf("export const loadShopOpen"));
assert.equal(
  /return false;/.test(loadShopOpen),
  false,
  "loadShopOpen must never answer false on a failure — a read that didn't land must not shut the shop",
);

console.log("shopVisibility.check.ts: all assertions passed");
