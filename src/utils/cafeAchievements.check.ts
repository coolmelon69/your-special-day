/**
 * Self-check for computeAchievements.
 *   node src/utils/cafeAchievements.check.ts
 */
import assert from "node:assert/strict";
import { computeAchievements } from "./cafeAchievements.ts";
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

// zero places: 21 entries, all locked, all current=0
{
  const result = computeAchievements([], []);
  assert.equal(result.length, 21, "7 tracks x 3 tiers");
  assert.ok(result.every((a) => !a.unlocked));
  assert.ok(result.every((a) => a.current === 0));
}

// Explorer: bronze threshold is 3 visited places
{
  const cats = [category({ id: "a" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited" }),
    place({ id: "p2", category_id: "a", status: "visited" }),
    place({ id: "p3", category_id: "a", status: "wishlist" }), // not visited, shouldn't count
  ];
  const result = computeAchievements(cats, places);
  const explorerBronze = result.find((a) => a.id === "explorer-bronze")!;
  assert.equal(explorerBronze.current, 2, "wishlist places don't count");
  assert.equal(explorerBronze.threshold, 3);
  assert.equal(explorerBronze.unlocked, false, "2 < 3, not yet unlocked");
}

// Explorer: exactly at threshold unlocks
{
  const cats = [category({ id: "a" })];
  const places = [1, 2, 3].map((n) =>
    place({ id: `p${n}`, category_id: "a", status: "visited" })
  );
  const result = computeAchievements(cats, places);
  const explorerBronze = result.find((a) => a.id === "explorer-bronze")!;
  assert.equal(explorerBronze.current, 3);
  assert.equal(explorerBronze.unlocked, true, "exactly at threshold unlocks");
}

// Cartographer: category only counts as "cleared" once ALL its places are visited
{
  const cats = [category({ id: "a" }), category({ id: "b" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited" }),
    place({ id: "p2", category_id: "a", status: "wishlist" }), // a not fully cleared
    place({ id: "p3", category_id: "b", status: "visited" }), // b fully cleared (only place)
  ];
  const result = computeAchievements(cats, places);
  const cartographerBronze = result.find((a) => a.id === "cartographer-bronze")!;
  assert.equal(cartographerBronze.current, 1, "only category b is fully cleared");
  assert.equal(cartographerBronze.unlocked, true, "threshold is 1");
}

// Cartographer gold: "all categories cleared" scales threshold to category count
{
  const cats = [category({ id: "a" }), category({ id: "b" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited" }),
    place({ id: "p2", category_id: "b", status: "visited" }),
  ];
  const result = computeAchievements(cats, places);
  const cartographerGold = result.find((a) => a.id === "cartographer-gold")!;
  assert.equal(cartographerGold.threshold, 2, "gold threshold = total category count");
  assert.equal(cartographerGold.unlocked, true);
}

// Cartographer gold: zero categories never unlocks (avoid div-by-zero / vacuous truth)
{
  const result = computeAchievements([], []);
  const cartographerGold = result.find((a) => a.id === "cartographer-gold")!;
  assert.equal(cartographerGold.threshold, 0);
  assert.equal(cartographerGold.unlocked, false, "no categories means nothing to clear");
}

// Critics' Circle: rating_him and rating_her each count separately, only on visited places
{
  const cats = [category({ id: "a" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited", rating_him: 4, rating_her: 5 }),
    place({ id: "p2", category_id: "a", status: "visited", rating_him: 3, rating_her: null }),
    place({ id: "p3", category_id: "a", status: "wishlist", rating_him: 5, rating_her: 5 }), // excluded
  ];
  const result = computeAchievements(cats, places);
  const critics = result.find((a) => a.id === "critics-circle-bronze")!;
  assert.equal(critics.current, 3, "4/5 count as 2, 3 counts as 1, wishlist excluded");
}

// Storytellers: only non-empty notes count (whitespace-only doesn't)
{
  const cats = [category({ id: "a" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited", note: "lovely spot" }),
    place({ id: "p2", category_id: "a", status: "visited", note: "   " }),
    place({ id: "p3", category_id: "a", status: "visited", note: null }),
  ];
  const result = computeAchievements(cats, places);
  const storytellers = result.find((a) => a.id === "storytellers-bronze")!;
  assert.equal(storytellers.current, 1, "whitespace-only and null notes don't count");
}

// Shutterbugs: photo_url present
{
  const cats = [category({ id: "a" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited", photo_url: "https://x/1.jpg" }),
    place({ id: "p2", category_id: "a", status: "visited", photo_url: null }),
  ];
  const result = computeAchievements(cats, places);
  const shutterbugs = result.find((a) => a.id === "shutterbugs-bronze")!;
  assert.equal(shutterbugs.current, 1);
}

// Keepers: would_return === true (not just truthy/non-null)
{
  const cats = [category({ id: "a" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited", would_return: true }),
    place({ id: "p2", category_id: "a", status: "visited", would_return: false }),
    place({ id: "p3", category_id: "a", status: "visited", would_return: null }),
  ];
  const result = computeAchievements(cats, places);
  const keepers = result.find((a) => a.id === "keepers-bronze")!;
  assert.equal(keepers.current, 1, "only would_return === true counts");
}

// Perfect Dates: both ratings >= 4.5; boundary is inclusive
{
  const cats = [category({ id: "a" })];
  const places = [
    place({ id: "p1", category_id: "a", status: "visited", rating_him: 4.5, rating_her: 4.5 }), // exactly at boundary, counts
    place({ id: "p2", category_id: "a", status: "visited", rating_him: 4.5, rating_her: 4 }), // one below, doesn't count
    place({ id: "p3", category_id: "a", status: "visited", rating_him: 5, rating_her: null }), // missing rating, doesn't count
  ];
  const result = computeAchievements(cats, places);
  const perfectDates = result.find((a) => a.id === "perfect-dates-bronze")!;
  assert.equal(perfectDates.current, 1, "only p1 has both ratings >= 4.5");
}

// tiers within a track are ordered bronze -> silver -> gold and thresholds increase
{
  const result = computeAchievements([], []);
  const explorerTiers = result.filter((a) => a.trackId === "explorer");
  assert.deepEqual(
    explorerTiers.map((a) => a.tier),
    ["bronze", "silver", "gold"]
  );
  assert.ok(explorerTiers[0].threshold < explorerTiers[1].threshold);
  assert.ok(explorerTiers[1].threshold < explorerTiers[2].threshold);
}

console.log("cafeAchievements: all checks passed");
