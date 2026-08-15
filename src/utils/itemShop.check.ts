/**
 * Self-check for the item shelf. No test framework:
 *   node src/utils/itemShop.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ITEM_SHOP_POOL,
  SHELF_ORDER,
  TIER_MIN_LEVEL,
  catalogue,
  itemPriceOf,
  itemSourceFor,
  itemsOnShelf,
  pagesOf,
  tierOf,
  PAGE_SIZES,
} from "./itemShop.ts";
import { ITEM_ACTIONS } from "./itemActions.ts";
import { ITEM_POOL, RARE_POOL } from "./pokeItems.ts";

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

// The three shelves partition the catalogue: every item on exactly one, none lost.
const shelved = SHELF_ORDER.flatMap((tier) => itemsOnShelf(tier));
assert.equal(shelved.length, ITEM_SHOP_POOL.length, "every item sits on exactly one shelf");
assert.equal(
  new Set(shelved.map((i) => i.slug)).size,
  ITEM_SHOP_POOL.length,
  "no item appears on two shelves",
);
for (const tier of SHELF_ORDER) {
  const shelf = itemsOnShelf(tier);
  assert.ok(shelf.length > 0, `the ${tier} shelf can't be empty — the header reads its price range`);
  for (const item of shelf) {
    assert.equal(tierOf(item.price), tier, `${item.slug} is on the wrong shelf`);
  }
  // Cheapest first, so the header's "5-8 coins" range reads off the ends.
  assert.deepEqual(
    shelf.map((i) => i.price),
    [...shelf.map((i) => i.price)].sort((a, b) => a - b),
    `the ${tier} shelf is sorted by price`,
  );
}

// Gates rise with price. A cheaper shelf locked behind a higher level than a
// dearer one would strand a new trainer with coins and nothing to spend them on.
const gates = SHELF_ORDER.map((tier) => TIER_MIN_LEVEL[tier]);
assert.deepEqual(gates, [...gates].sort((a, b) => a - b), "shelf gates rise with price");
assert.equal(TIER_MIN_LEVEL[SHELF_ORDER[0]], 1, "the cheapest shelf is open from level 1");

// Pagination for the shop window, at both grid shapes. This is the assertion
// that actually keeps the grid full: the window renders a static 3×3 on a phone
// and 4×3 above it, so a page short of its size shows holes — the one thing it
// must never do. Add a 37th item and this fails here rather than in the browser.
const sorted = catalogue();
assert.deepEqual(
  sorted.map((i) => i.price),
  [...sorted.map((i) => i.price)].sort((a, b) => a - b),
  "the catalogue is cheapest first — pages are cut straight out of it",
);

for (const [shape, perPage] of Object.entries(PAGE_SIZES)) {
  assert.equal(
    ITEM_SHOP_POOL.length % perPage,
    0,
    `${ITEM_SHOP_POOL.length} items can't fill ${perPage}-card pages — the ${shape} grid would show holes`,
  );
  const paged = pagesOf(perPage);
  assert.deepEqual(
    paged.flat().map((i) => i.slug),
    sorted.map((i) => i.slug),
    `${shape} paging preserves the catalogue, in price order`,
  );
  for (const [index, items] of paged.entries()) {
    assert.equal(items.length, perPage, `${shape} page ${index} is not exactly full`);
  }
}

assert.equal(itemPriceOf("great-ball"), 8);
assert.equal(itemPriceOf("not-an-item"), null, "unknown slug has no price");
assert.equal(itemSourceFor("great-ball"), "shop:great-ball", "source key matches buy_item's");

// Prices live in the `item_shop` table since 2026-08-16-item-shop-config.sql,
// which `buy_item` reads and the admin panel edits. The pool above is what seeds
// that table, and also what the client falls back to on a database that hasn't
// run the migration — so the seed and the pool have to agree, or the shop quotes
// one price before the migration and a different one after it.
const migration = readFileSync(
  new URL("../../sql/2026-08-16-item-shop-config.sql", import.meta.url),
  "utf8",
);
const seed = migration.slice(
  migration.indexOf("insert into item_shop"),
  migration.indexOf("on conflict (slug)"),
);
const sqlPrices = new Map<string, number>();
for (const [, slug, price] of seed.matchAll(/\('([a-z0-9-]+)',\s*(\d+)\)/g)) {
  sqlPrices.set(slug, Number(price));
}

assert.equal(sqlPrices.size, ITEM_SHOP_POOL.length, "the seed carries every pool item, and no others");
for (const item of ITEM_SHOP_POOL) {
  assert.equal(
    sqlPrices.get(item.slug),
    item.price,
    `${item.slug} price drifted between itemShop.ts and the item_shop seed`,
  );
}

// The client must never be able to send a price. That is the whole reason this
// is a table `buy_item` reads rather than a field in the admin-settings blob.
assert.match(
  migration,
  /select price, stock into v_price, v_stock/,
  "buy_item reads the price out of item_shop itself",
);
// ...and it has to hold that row while it does, or two tabs racing for the last
// one in stock both read the same count and the shelf goes negative.
assert.match(migration, /for update/, "buy_item locks the shelf row it is selling from");

// Only the owner prices the shelf, and nobody adds rows to it: the client can
// only render the 36 items above, so a 37th row would be an item that can't be
// drawn but can be bought.
assert.match(
  migration,
  /create policy item_shop_write[\s\S]*?can_admin_shop\(\)/,
  "the write policy is guarded by can_admin_shop()",
);
assert.doesNotMatch(
  migration,
  /create policy[^\n]*for insert/,
  "no insert policy — the shelf is exactly the seed",
);

// buy_item must write 'common' — a bought rare would be bought XP.
assert.match(migration, /'rarity',\s*'common'/, "bought items are always common, so they never add XP");

// Quantity comes from the client, so the ceiling has to be enforced server-side.
assert.match(migration, /raise exception 'bad quantity/, "buy_item bounds the quantity it is handed");

// Every buyable item must be worth something in real life. A shelf item with no
// coupon is a card with a blank sell line — the one thing you can't ship.
for (const item of ITEM_SHOP_POOL) {
  const entry = ITEM_ACTIONS[item.slug];
  assert.ok(entry, `${item.slug} has no real-life action in itemActions.ts`);
  assert.ok(entry.action.trim().length > 10, `${item.slug}'s action is too short to mean anything`);
}

// ...and so must everything the journey can drop, since it lands in the same bag.
for (const slug of [...ITEM_POOL, ...RARE_POOL]) {
  assert.ok(ITEM_ACTIONS[slug], `${slug} drops from a checkpoint but has no action`);
}

console.log("itemShop.check.ts: all assertions passed");
