/**
 * Self-check for the shop catalogue. No test framework:
 *   node src/utils/shop.check.ts
 *
 * The purchase itself is enforced by the `buy_sku` SQL function, not by this
 * file — see sql/2026-08-08-items-shop.sql. What is checked here is the half
 * that lives in TypeScript: the catalogue's shape, and that its prices still
 * match the ones the database will actually charge.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SHOP_CATALOGUE, skuById, priceOf, canAfford, isOwned } from "./shop.ts";

// Ids are unique — a duplicate would make `skuById` silently pick the first
assert.equal(
  new Set(SHOP_CATALOGUE.map((s) => s.id)).size,
  SHOP_CATALOGUE.length,
  "sku ids are unique",
);

// Every sku is buyable: a positive whole price and a name to show
for (const sku of SHOP_CATALOGUE) {
  assert.ok(Number.isInteger(sku.price) && sku.price > 0, `${sku.id} needs a positive whole price`);
  assert.ok(sku.name.trim(), `${sku.id} needs a name`);
  assert.ok(sku.blurb.trim(), `${sku.id} needs a blurb`);
}

// Lookups
assert.equal(priceOf("card.material.fullart"), 80, "full art is the priciest thing in the shop");
assert.equal(priceOf("card.material.holo"), 50, "holo is the second priciest");
assert.equal(
  Math.max(...SHOP_CATALOGUE.map((s) => s.price)),
  priceOf("card.material.fullart"),
  "nothing outprices the chase card",
);
assert.equal(priceOf("nope.not.real"), null, "unknown sku has no price");
assert.equal(skuById("nope.not.real"), undefined, "unknown sku is not found");

// Affordability — the display-side mirror of the SQL guard
assert.equal(canAfford(50, "card.material.holo"), true, "exact balance affords it");
assert.equal(canAfford(49, "card.material.holo"), false, "one short cannot afford it");
assert.equal(canAfford(9999, "nope.not.real"), false, "unknown sku is never affordable");

assert.equal(isOwned(["card.title"], "card.title"), true, "owned sku reads as owned");
assert.equal(isOwned([], "card.title"), false, "empty purchases owns nothing");

// The catalogue is duplicated in `buy_sku` because the client must never send
// a price. Duplication is fine; drift is not — a cheaper row here than in the
// database means a button that promises a price the charge won't honour.
// Read the LATEST migration that recreates buy_sku, not the first one — the
// price list is a `case` expression, so every new sku ships a whole new copy
// of the function and the older file stops describing what the database runs.
const migration = readFileSync(new URL("../../sql/2026-08-16-card-fullart.sql", import.meta.url), "utf8");

// Scope to buy_sku's body — record_drop has a `case` of its own, and matching
// the whole file would fold its coin values in with the shop's prices.
const buySkuStart = migration.indexOf("function buy_sku");
assert.ok(buySkuStart !== -1, "buy_sku function is missing from the migration");
const buySkuBody = migration.slice(buySkuStart);

const sqlPrices = new Map<string, number>();
for (const [, sku, price] of buySkuBody.matchAll(/when\s+'([\w.]+)'\s+then\s+(\d+)/g)) {
  sqlPrices.set(sku, Number(price));
}

assert.equal(sqlPrices.size, SHOP_CATALOGUE.length, "buy_sku prices every sku in the catalogue, and no others");
for (const sku of SHOP_CATALOGUE) {
  assert.equal(sqlPrices.get(sku.id), sku.price, `${sku.id} price drifted between shop.ts and buy_sku`);
}

console.log("shop.check.ts: all assertions passed");
