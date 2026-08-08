/**
 * Self-check for the item shelf. No test framework:
 *   node src/utils/itemShop.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ITEM_SHOP_POOL,
  DAILY_STOCK_SIZE,
  stockForDate,
  itemPriceOf,
  itemSourceFor,
} from "./itemShop.ts";

// Pool shape — a duplicate slug would make `itemPriceOf` silently pick the first
assert.equal(
  new Set(ITEM_SHOP_POOL.map((i) => i.slug)).size,
  ITEM_SHOP_POOL.length,
  "item slugs are unique",
);
for (const item of ITEM_SHOP_POOL) {
  assert.ok(Number.isInteger(item.price) && item.price > 0, `${item.slug} needs a positive whole price`);
  assert.match(item.slug, /^[a-z0-9-]+$/, `${item.slug} must be a PokéAPI slug`);
}

// Today's shelf: right size, no repeats, all real items
const today = stockForDate(new Date("2026-08-08T12:00:00"));
assert.equal(today.length, DAILY_STOCK_SIZE, "shelf holds the daily stock size");
assert.equal(new Set(today.map((i) => i.slug)).size, today.length, "no duplicates on the shelf");
for (const item of today) {
  assert.ok(ITEM_SHOP_POOL.includes(item), `${item.slug} is a real pool entry`);
}

// Deterministic within a day — a refresh must not reroll the shop
assert.deepEqual(
  stockForDate(new Date("2026-08-08T00:01:00")).map((i) => i.slug),
  stockForDate(new Date("2026-08-08T23:59:00")).map((i) => i.slug),
  "the shelf is the same all day",
);

// ...and it actually turns over
assert.notDeepEqual(
  stockForDate(new Date("2026-08-08T12:00:00")).map((i) => i.slug),
  stockForDate(new Date("2026-08-09T12:00:00")).map((i) => i.slug),
  "tomorrow's shelf differs from today's",
);

// Every item comes round eventually — nothing is unbuyable forever
const seen = new Set<string>();
for (let day = 0; day < ITEM_SHOP_POOL.length; day++) {
  const date = new Date("2026-08-08T12:00:00");
  date.setDate(date.getDate() + day);
  for (const item of stockForDate(date)) seen.add(item.slug);
}
assert.equal(seen.size, ITEM_SHOP_POOL.length, "one pool cycle shows every item at least once");

assert.equal(itemPriceOf("great-ball"), 8);
assert.equal(itemPriceOf("not-an-item"), null, "unknown slug has no price");
assert.equal(itemSourceFor("great-ball"), "shop:great-ball", "source key matches buy_item's");

// Prices are duplicated into buy_item because the client must never send one.
// Duplication is fine; drift is not.
const migration = readFileSync(new URL("../../sql/2026-08-08-item-shop-stock.sql", import.meta.url), "utf8");
const sqlPrices = new Map<string, number>();
for (const [, slug, price] of migration.matchAll(/when\s+'([a-z0-9-]+)'\s+then\s+(\d+)/g)) {
  sqlPrices.set(slug, Number(price));
}

assert.equal(sqlPrices.size, ITEM_SHOP_POOL.length, "buy_item prices every pool item, and no others");
for (const item of ITEM_SHOP_POOL) {
  assert.equal(sqlPrices.get(item.slug), item.price, `${item.slug} price drifted between itemShop.ts and buy_item`);
}

// buy_item must write 'common' — a bought rare would be bought XP.
assert.match(migration, /'rarity',\s*'common'/, "bought items are always common, so they never add XP");

console.log("itemShop.check.ts: all assertions passed");
