/**
 * Self-check for the pure ranking helpers. No test framework needed:
 *   node src/utils/cafeRanking.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import {
  averageScore,
  splitByStatus,
  rankPlaces,
  slugify,
  uniqueSlug,
} from "./cafeRanking.ts";
import type { CafePlace } from "../types/cafes.ts";

/** Minimal place factory — only the fields the ranking cares about vary. */
const place = (over: Partial<CafePlace> & { id: string }): CafePlace => ({
  category_id: "cat",
  name: over.id,
  status: "visited",
  area: null,
  price_band: null,
  visited_on: null,
  note: null,
  photo_url: null,
  would_return: null,
  rating_him: null,
  rating_her: null,
  gmaps_place_id: null,
  gmaps_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
});

// averageScore
assert.equal(averageScore({ rating_him: 4, rating_her: 5 }), 4.5, "mean of two");
assert.equal(averageScore({ rating_him: 4, rating_her: null }), 4, "one rating still averages");
assert.equal(averageScore({ rating_him: null, rating_her: 3.5 }), 3.5, "other side alone");
assert.equal(averageScore({ rating_him: null, rating_her: null }), null, "no ratings is null");

// splitByStatus
{
  const { visited, wishlist } = splitByStatus([
    place({ id: "a", status: "visited" }),
    place({ id: "b", status: "wishlist" }),
    place({ id: "c", status: "visited" }),
  ]);
  assert.deepEqual(visited.map((p) => p.id), ["a", "c"], "visited only");
  assert.deepEqual(wishlist.map((p) => p.id), ["b"], "wishlist only");
}

// rankPlaces — wishlist never ranks
{
  const ranked = rankPlaces([
    place({ id: "wish", status: "wishlist", rating_him: 5, rating_her: 5 }),
    place({ id: "seen", rating_him: 3, rating_her: 3 }),
  ]);
  assert.deepEqual(ranked.map((r) => r.place.id), ["seen"], "wishlist excluded from ranking");
  assert.equal(ranked[0].rank, 1, "ranks are 1-based");
}

// rankPlaces — descending by average
{
  const ranked = rankPlaces([
    place({ id: "mid", rating_him: 4, rating_her: 4 }),
    place({ id: "top", rating_him: 5, rating_her: 4.5 }),
    place({ id: "low", rating_him: 2, rating_her: 1 }),
  ]);
  assert.deepEqual(ranked.map((r) => r.place.id), ["top", "mid", "low"], "sorted high to low");
  assert.deepEqual(ranked.map((r) => r.rank), [1, 2, 3], "ranks follow order");
}

// rankPlaces — unrated visited places sort last
{
  const ranked = rankPlaces([
    place({ id: "unrated" }),
    place({ id: "rated", rating_him: 1, rating_her: 1 }),
  ]);
  assert.deepEqual(ranked.map((r) => r.place.id), ["rated", "unrated"], "unrated goes last");
  assert.equal(ranked[1].average, null, "unrated average stays null");
}

// rankPlaces — equal averages break by earliest visited_on
{
  const ranked = rankPlaces([
    place({ id: "later", rating_him: 4, rating_her: 4, visited_on: "2026-06-12" }),
    place({ id: "earlier", rating_him: 4, rating_her: 4, visited_on: "2026-05-04" }),
  ]);
  assert.deepEqual(ranked.map((r) => r.place.id), ["earlier", "later"], "earliest visit wins a tie");
}

// rankPlaces — a null visited_on loses the tiebreak to any real date
{
  const ranked = rankPlaces([
    place({ id: "nodate", rating_him: 4, rating_her: 4 }),
    place({ id: "dated", rating_him: 4, rating_her: 4, visited_on: "2026-06-12" }),
  ]);
  assert.deepEqual(ranked.map((r) => r.place.id), ["dated", "nodate"], "dated beats undated on a tie");
}

// rankPlaces — fully tied places fall back to name, so order is deterministic
{
  const ranked = rankPlaces([
    place({ id: "b", name: "Beta", rating_him: 4, rating_her: 4 }),
    place({ id: "a", name: "Alpha", rating_him: 4, rating_her: 4 }),
  ]);
  assert.deepEqual(ranked.map((r) => r.place.id), ["a", "b"], "name breaks a total tie");
}

// rankPlaces — does not mutate its input
{
  const input = [
    place({ id: "low", rating_him: 1, rating_her: 1 }),
    place({ id: "high", rating_him: 5, rating_her: 5 }),
  ];
  rankPlaces(input);
  assert.deepEqual(input.map((p) => p.id), ["low", "high"], "input array untouched");
}

// slugify
assert.equal(slugify("Fish & Chips"), "fish-chips", "ampersand and spaces collapse");
assert.equal(slugify("  Nasi Lemak  "), "nasi-lemak", "trims");
assert.equal(slugify("Matcha!!!"), "matcha", "no trailing dash");
assert.equal(slugify("Café"), "caf", "non-ascii is dropped");

// uniqueSlug
assert.equal(uniqueSlug("Matcha", []), "matcha", "free slug used as is");
assert.equal(uniqueSlug("Matcha", ["matcha"]), "matcha-2", "first collision suffixes 2");
assert.equal(uniqueSlug("Matcha", ["matcha", "matcha-2"]), "matcha-3", "keeps counting");
assert.equal(uniqueSlug("!!!", []), "category", "empty slug falls back");

console.log("cafeRanking: all checks passed");
