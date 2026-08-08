/**
 * Self-check for checkpoint item mapping + PokéAPI fetch caching. No test framework:
 *   node src/utils/pokeItems.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import {
  CHECKPOINT_ITEM_MAP,
  ITEM_POOL,
  RARE_POOL,
  RARE_CHANCE,
  COINS_BY_RARITY,
  getItemSlugForCheckpoint,
  fetchItemDetails,
  rollDrop,
} from "./pokeItems.ts";

// Known checkpoint title maps to its curated slug
assert.equal(
  getItemSlugForCheckpoint("Breakfast Quest", 0),
  CHECKPOINT_ITEM_MAP["Breakfast Quest"],
  "mapped title returns its curated slug regardless of index",
);

// Unmapped (custom/admin) title falls back deterministically via index modulo
const unmappedFirst = getItemSlugForCheckpoint("Custom Admin Stop", 2);
const unmappedSecond = getItemSlugForCheckpoint("Custom Admin Stop", 2);
assert.equal(unmappedFirst, ITEM_POOL[2 % ITEM_POOL.length], "fallback uses index modulo pool length");
assert.equal(unmappedFirst, unmappedSecond, "same input always produces same output");

// --- rollDrop ---------------------------------------------------------------

// The finale is rare no matter how the dice land. This is the guarantee that
// stops a 38% chance of a day with no rare at all.
for (const roll of [0, 0.5, 0.99]) {
  const finale = rollDrop("Starlight Banquet", 5, true, () => roll);
  assert.equal(finale.rarity, "rare", `finale is rare even at roll ${roll}`);
  assert.ok(RARE_POOL.includes(finale.slug), "finale slug comes from the rare pool");
  assert.equal(finale.coins, COINS_BY_RARITY.rare, "finale pays the rare coin value");
}

// Below the threshold is rare, at or above it is common — the boundary itself
// must not be rare, or the odds are quietly higher than RARE_CHANCE.
assert.equal(rollDrop("Breakfast Quest", 0, false, () => RARE_CHANCE - 0.001).rarity, "rare", "just under the threshold is rare");
assert.equal(rollDrop("Breakfast Quest", 0, false, () => RARE_CHANCE).rarity, "common", "exactly at the threshold is common");

// A common keeps the curated slug for its checkpoint and pays the common rate
const common = rollDrop("Breakfast Quest", 0, false, () => 0.9);
assert.equal(common.slug, CHECKPOINT_ITEM_MAP["Breakfast Quest"], "common keeps the curated slug");
assert.equal(common.coins, COINS_BY_RARITY.common, "common pays the common coin value");

// Same inputs, same output — the reveal can be re-rendered without re-rolling
assert.deepEqual(
  rollDrop("Feast Time", 2, false, () => 0.42),
  rollDrop("Feast Time", 2, false, () => 0.42),
  "same roll produces the same drop",
);

// Non-finale rare odds land near RARE_CHANCE over a large sample
let rares = 0;
const SAMPLES = 20000;
for (let i = 0; i < SAMPLES; i++) {
  if (rollDrop("Feast Time", 2, false, () => i / SAMPLES).rarity === "rare") rares++;
}
const observed = rares / SAMPLES;
assert.ok(
  Math.abs(observed - RARE_CHANCE) < 0.01,
  `non-finale rare rate ${observed} should sit near ${RARE_CHANCE}`,
);

// Every rare the roller can produce is a slug the rest of the app knows about
const producedRares = new Set<string>();
for (let i = 0; i < 1000; i++) {
  producedRares.add(rollDrop("Feast Time", 2, true, () => i / 1000).slug);
}
for (const slug of producedRares) {
  assert.ok(RARE_POOL.includes(slug), `${slug} must be in RARE_POOL`);
}

// fetchItemDetails caches — second call for the same slug does not call fetch again
const originalFetch = globalThis.fetch;
let callCount = 0;
globalThis.fetch = (async () => {
  callCount++;
  return new Response(
    JSON.stringify({
      name: "oran-berry",
      sprites: { default: "https://example.com/oran-berry.png" },
      flavor_text_entries: [{ language: { name: "en" }, text: "A berry to be eaten if HP is low." }],
    }),
    { status: 200 },
  );
}) as typeof fetch;

const first = await fetchItemDetails("oran-berry");
const second = await fetchItemDetails("oran-berry");
assert.equal(callCount, 1, "second call for the same slug must hit the cache, not fetch again");
assert.deepEqual(first, second, "cached result matches original");
assert.equal(first.name, "oran-berry");
assert.equal(first.spriteUrl, "https://example.com/oran-berry.png");
assert.equal(first.flavorText, "A berry to be eaten if HP is low.");

// Network failure falls back to name-only, no crash, not cached
globalThis.fetch = (async () => {
  throw new Error("network down");
}) as typeof fetch;
const failed = await fetchItemDetails("sitrus-berry");
assert.deepEqual(failed, { name: "sitrus-berry", spriteUrl: null, flavorText: null }, "failure falls back to slug as name");

globalThis.fetch = originalFetch;

console.log("pokeItems.check.ts: all assertions passed");
