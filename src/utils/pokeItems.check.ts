/**
 * Self-check for checkpoint item mapping + PokéAPI fetch caching. No test framework:
 *   node src/utils/pokeItems.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import {
  CHECKPOINT_ITEM_MAP,
  ITEM_POOL,
  getItemSlugForCheckpoint,
  fetchItemDetails,
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
