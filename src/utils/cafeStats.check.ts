/**
 * Self-check for computeCafeStats.
 *   node src/utils/cafeStats.check.ts
 */
import assert from "node:assert/strict";
import { computeCafeStats } from "./cafeStats.ts";
import type { CafeCategory, CafePlace } from "../types/cafes.ts";

const category = (over: Partial<CafeCategory> & { id: string }): CafeCategory => ({
  name: over.id,
  slug: over.id,
  icon: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

const place = (over: Partial<CafePlace> & { id: string; category_id: string }): CafePlace => ({
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

// zero places
{
  const stats = computeCafeStats([], []);
  assert.equal(stats.visitedCount, 0);
  assert.equal(stats.totalCount, 0);
  assert.equal(stats.completionPct, 0);
  assert.equal(stats.avgRatingHim, null);
  assert.equal(stats.avgRatingHer, null);
  assert.equal(stats.topCategory, null);
}

// no visited places (all wishlist)
{
  const cats = [category({ id: "a" })];
  const places = [place({ id: "p1", category_id: "a", status: "wishlist" })];
  const stats = computeCafeStats(cats, places);
  assert.equal(stats.visitedCount, 0);
  assert.equal(stats.totalCount, 1);
  assert.equal(stats.completionPct, 0);
  assert.equal(stats.topCategory, null, "no visited places means no top category");
}

// normal case
{
  const cats = [category({ id: "a", name: "Fish & Chips", icon: "🐟" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited", rating_him: 4, rating_her: 5 }),
    place({ id: "p2", category_id: "a", status: "visited", rating_him: 2, rating_her: null }),
    place({ id: "p3", category_id: "a", status: "wishlist" }),
  ];
  const stats = computeCafeStats(cats, places);
  assert.equal(stats.visitedCount, 2);
  assert.equal(stats.totalCount, 3);
  assert.equal(stats.completionPct, 67, "rounds 2/3 to 67%");
  assert.equal(stats.avgRatingHim, 3, "mean of 4 and 2");
  assert.equal(stats.avgRatingHer, 5, "null rating excluded, not treated as 0");
  assert.deepEqual(stats.topCategory, { name: "Fish & Chips", icon: "🐟" });
}

// tie on top category breaks by sort_order
{
  const cats = [
    category({ id: "b", name: "Beta", sort_order: 2 }),
    category({ id: "a", name: "Alpha", sort_order: 1 }),
  ];
  const places = [
    place({ id: "p1", category_id: "b", status: "visited" }),
    place({ id: "p2", category_id: "a", status: "visited" }),
  ];
  const stats = computeCafeStats(cats, places);
  assert.equal(stats.topCategory?.name, "Alpha", "lower sort_order wins the tie");
}

// null ratings across all visited places
{
  const cats = [category({ id: "a" })];
  const places = [place({ id: "p1", category_id: "a", status: "visited" })];
  const stats = computeCafeStats(cats, places);
  assert.equal(stats.avgRatingHim, null);
  assert.equal(stats.avgRatingHer, null);
}

console.log("cafeStats: all checks passed");
