/**
 * Self-check for the coin economy. No test framework:
 *   node src/utils/economy.check.ts
 *
 * Two jobs, and the first is the one worth having.
 *
 * 1. THE FLOOR CLEARS THE BASKET. The point of the payouts is a promise: a
 *    seven-stop journey should buy two trainer-card cosmetics, a sticker pack
 *    and three items off each of the three shelves. That promise is made of
 *    numbers in four different files, and nothing stops someone repricing Full
 *    Art or adding a shelf and quietly breaking it. So it is asserted against
 *    the WORST possible run — no rare drops at all except the guaranteed
 *    finale — because a promise that only holds on average isn't one.
 *
 * 2. NO DRIFT WITH THE DATABASE. The client displays coin values; `record_drop`
 *    and `coin_rewards` are what actually pay them. Same reasoning as
 *    shop.check.ts: a drifted number should fail here rather than pay the wrong
 *    amount in production.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COINS_BY_RARITY, RARE_CHANCE } from "./pokeItems.ts";
import { SHOP_CATALOGUE } from "./shop.ts";
import { ITEM_SHOP_POOL, SHELF_ORDER, itemsOnShelf } from "./itemShop.ts";
import { DEFAULT_REWARDS, REWARD_KINDS, levelReason, photoReason } from "./coinRewardKeys.ts";

/** The journey this economy is sized for. */
const CHECKPOINTS = 7;

/** Cheapest `n` prices in a list, summed. */
const cheapest = (prices: number[], n: number): number =>
  [...prices].sort((a, b) => a - b).slice(0, n).reduce((sum, p) => sum + p, 0);

// ─── 1. the floor clears the basket ───

// Worst case: every non-finale checkpoint rolls common, the finale is rare by
// construction (see `rollDrop`).
const floor = (CHECKPOINTS - 1) * COINS_BY_RARITY.common + COINS_BY_RARITY.rare;

const cardPrices = SHOP_CATALOGUE.filter((s) => s.category === "card").map((s) => s.price);
const stickerPrices = SHOP_CATALOGUE.filter((s) => s.category === "sticker").map((s) => s.price);

assert.ok(cardPrices.length >= 2, "the basket wants two card cosmetics; the catalogue has fewer");
assert.ok(stickerPrices.length >= 1, "the basket wants a sticker pack; the catalogue has none");

let basket = cheapest(cardPrices, 2) + cheapest(stickerPrices, 1);

for (const tier of SHELF_ORDER) {
  const shelf = itemsOnShelf(tier);
  assert.ok(shelf.length >= 3, `shelf "${tier}" has fewer than the three items the basket wants`);
  basket += cheapest(shelf.map((i) => i.price), 3);
}

assert.ok(
  floor >= basket,
  `a ${CHECKPOINTS}-checkpoint journey banks at least ${floor} coins but the target basket ` +
    `costs ${basket}. Raise COINS_BY_RARITY (and record_drop with it), or lower a price.`,
);

// The other end: the tripwire for a payout raised until the shelf stops
// meaning anything. Measured on the EXPECTED run, not the luckiest one — at a
// 15% rare chance the all-rare run is a one-in-tens-of-thousands event, and
// sizing the economy so that it too must stay scarce would cost every ordinary
// journey coins to defend against a day that never comes.
const expected =
  (CHECKPOINTS - 1) *
    (RARE_CHANCE * COINS_BY_RARITY.rare + (1 - RARE_CHANCE) * COINS_BY_RARITY.common) +
  COINS_BY_RARITY.rare;
const everyCosmetic = SHOP_CATALOGUE.reduce((sum, s) => sum + s.price, 0);
assert.ok(
  expected < everyCosmetic,
  `a typical ${CHECKPOINTS}-checkpoint run banks ${expected}, which buys every cosmetic ` +
    `(${everyCosmetic}). Scarcity is the shop's whole design — lower the payouts.`,
);

// ─── 2. reason keys ───

// Both halves non-empty, or `award_coins` refuses to pay — see the migration.
for (const reason of [levelReason(3), photoReason("breakfast-quest")]) {
  const [kind, ...rest] = reason.split(":");
  assert.ok(kind, `"${reason}" has no kind`);
  assert.ok(rest.join(":"), `"${reason}" has no detail, so award_coins would never pay it`);
  assert.ok(
    (REWARD_KINDS as string[]).includes(kind),
    `"${reason}" names kind "${kind}", which has no row in coin_rewards`,
  );
}

// ─── 3. no drift with the database ───

const itemsShopSql = readFileSync(
  new URL("../../sql/2026-08-08-items-shop.sql", import.meta.url),
  "utf8",
);

// Scope to record_drop's body — buy_sku below it has a `case` of its own, and
// matching the whole file would fold the shop's prices in with the payouts.
const dropStart = itemsShopSql.indexOf("function record_drop");
assert.ok(dropStart !== -1, "record_drop is missing from the migration");
const dropBody = itemsShopSql.slice(dropStart, itemsShopSql.indexOf("function buy_sku"));

const payout = dropBody.match(/when\s+'rare'\s+then\s+(\d+)\s+else\s+(\d+)\s+end/);
assert.ok(payout, "could not read record_drop's payout — has the `case` been rewritten?");
assert.equal(
  Number(payout[1]),
  COINS_BY_RARITY.rare,
  "rare payout drifted between pokeItems.ts and record_drop",
);
assert.equal(
  Number(payout[2]),
  COINS_BY_RARITY.common,
  "common payout drifted between pokeItems.ts and record_drop",
);

const rewardsSql = readFileSync(
  new URL("../../sql/2026-08-29-coin-rewards.sql", import.meta.url),
  "utf8",
);

const seeded = new Map<string, number>();
for (const [, key, amount] of rewardsSql.matchAll(/^\s*\('(\w+)',\s*(\d+)\)/gm)) {
  seeded.set(key, Number(amount));
}

assert.equal(
  seeded.size,
  REWARD_KINDS.length,
  "coin_rewards seeds a different number of kinds than coinRewards.ts knows about",
);
for (const kind of REWARD_KINDS) {
  assert.equal(
    seeded.get(kind),
    DEFAULT_REWARDS[kind],
    `"${kind}" default drifted between coinRewards.ts and the coin_rewards seed`,
  );
}

// Every item on the shelf is priced — `itemsOnShelf` silently drops anything
// that isn't, which would make the basket above cheaper than it really is.
assert.equal(
  SHELF_ORDER.flatMap((tier) => itemsOnShelf(tier)).length,
  ITEM_SHOP_POOL.length,
  "an item in ITEM_SHOP_POOL lands on no shelf",
);

console.log(
  `economy.check.ts: all assertions passed ` +
    `(floor ${floor} vs basket ${basket}, ${floor - basket} to spare)`,
);
