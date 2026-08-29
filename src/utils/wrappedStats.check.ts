/**
 * Self-check for the pure /wrapped statistics helpers. No test framework:
 *   node src/utils/wrappedStats.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import {
  haversineKm,
  checkpointKey,
  collectedStamps,
  routeDistanceKm,
  normalizeRoute,
  longestGapMinutes,
  favouriteFilter,
  topMoment,
  galleryPhotos,
  GALLERY_PHOTO_LIMIT,
  TOP_MOMENT_PHOTO_LIMIT,
  formatDuration,
  computeWrappedStats,
} from "./wrappedStats.ts";
import type { PhotoLike, StampLike } from "../types/wrapped.ts";

/** Minimal stamp factory — only the fields the math reads. */
const stamp = (over: Partial<StampLike> & { title: string }): StampLike => ({
  time: "9:00 AM",
  checkedAt: null,
  ...over,
});

const photo = (over: Partial<PhotoLike> & { checkpointId: string }): PhotoLike => ({
  timestamp: 0,
  ...over,
});

// haversineKm — one degree of longitude at the equator is about 111 km
assert.equal(
  Math.round(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })),
  111,
  "one degree of longitude at the equator",
);
assert.equal(
  Math.round(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })),
  111,
  "one degree of latitude",
);
assert.equal(
  haversineKm({ latitude: 3.1, longitude: 101.4 }, { latitude: 3.1, longitude: 101.4 }),
  0,
  "identical points are zero apart",
);

// checkpointKey — must match how TimelineSection builds it
assert.equal(
  checkpointKey({ time: "9:00 AM", title: "Breakfast Quest" }),
  "9:00 AM-Breakfast Quest",
  "key matches TimelineSection's `${time}-${title}` format",
);

// collectedStamps — filters unchecked, sorts by checkedAt ascending
const mixed: StampLike[] = [
  stamp({ title: "Third", checkedAt: "2026-08-02T15:00:00Z" }),
  stamp({ title: "Unchecked" }),
  stamp({ title: "First", checkedAt: "2026-08-02T09:00:00Z" }),
  stamp({ title: "Second", checkedAt: "2026-08-02T11:00:00Z" }),
];
assert.deepEqual(
  collectedStamps(mixed).map((s) => s.title),
  ["First", "Second", "Third"],
  "unordered checkedAt values still sort ascending, unchecked dropped",
);
assert.equal(collectedStamps([]).length, 0, "empty input is empty output");

// routeDistanceKm
assert.equal(routeDistanceKm([]), 0, "no coords is zero distance");
assert.equal(routeDistanceKm([{ latitude: 0, longitude: 0 }]), 0, "one coord is zero distance");
assert.equal(
  Math.round(
    routeDistanceKm([
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 0, longitude: 2 },
    ]),
  ),
  222,
  "distance sums each leg",
);

// normalizeRoute
assert.deepEqual(normalizeRoute([]), [], "no coords is no points");
const square = normalizeRoute(
  [
    { latitude: 0, longitude: 0 },
    { latitude: 1, longitude: 1 },
  ],
  100,
  10,
);
assert.deepEqual(square[0], { x: 10, y: 90 }, "min corner sits at the padded bottom-left");
assert.deepEqual(square[1], { x: 90, y: 10 }, "max corner sits at the padded top-right, north up");
const degenerate = normalizeRoute(
  [
    { latitude: 3.1, longitude: 101.4 },
    { latitude: 3.1, longitude: 101.4 },
  ],
  100,
  10,
);
assert.deepEqual(degenerate[0], { x: 50, y: 50 }, "zero-area bounding box centers instead of dividing by zero");

// longestGapMinutes
assert.equal(longestGapMinutes([]), 0, "no stamps is no gap");
assert.equal(
  longestGapMinutes([
    stamp({ title: "a", checkedAt: "2026-08-02T09:00:00Z" }),
    stamp({ title: "b", checkedAt: "2026-08-02T09:30:00Z" }),
    stamp({ title: "c", checkedAt: "2026-08-02T12:00:00Z" }),
  ]),
  150,
  "longest gap is the largest delta, not the last one",
);

// favouriteFilter
assert.equal(favouriteFilter([]), null, "no photos means no favourite");
assert.equal(
  favouriteFilter([photo({ checkpointId: "a" }), photo({ checkpointId: "b" })]),
  null,
  "photos without filters mean no favourite",
);
assert.equal(
  favouriteFilter([
    photo({ checkpointId: "a", filter: "warm" }),
    photo({ checkpointId: "b", filter: "cool" }),
    photo({ checkpointId: "c", filter: "warm" }),
  ]),
  "warm",
  "most frequent filter wins",
);

// topMoment — matches on `${time}-${title}`, not on title alone
const stamps: StampLike[] = [
  stamp({ time: "9:00 AM", title: "Breakfast Quest", checkedAt: "2026-08-02T09:00:00Z" }),
  stamp({ time: "1:00 PM", title: "Lunch", checkedAt: "2026-08-02T13:00:00Z" }),
];
assert.equal(topMoment(stamps, []), null, "no photos means no top moment");
assert.deepEqual(
  topMoment(stamps, [
    photo({ checkpointId: "9:00 AM-Breakfast Quest" }),
    photo({ checkpointId: "1:00 PM-Lunch" }),
    photo({ checkpointId: "1:00 PM-Lunch" }),
  ]),
  { title: "Lunch", photoCount: 2, srcs: [] },
  "checkpoint with the most photos wins",
);
assert.deepEqual(
  topMoment(stamps, [
    photo({ checkpointId: "1:00 PM-Lunch", timestamp: 2, src: "blob:second" }),
    photo({ checkpointId: "1:00 PM-Lunch", timestamp: 1, src: "blob:first" }),
  ])?.srcs,
  ["blob:first", "blob:second"],
  "the winning checkpoint's photos come back oldest first",
);
assert.deepEqual(
  topMoment(stamps, [
    photo({
      checkpointId: "1:00 PM-Lunch",
      timestamp: 1,
      src: "blob:local",
      storageUrl: "https://cdn/x.jpg",
    }),
  ])?.srcs,
  ["https://cdn/x.jpg"],
  "the synced storage URL wins over the local blob",
);
assert.deepEqual(
  topMoment(stamps, [photo({ checkpointId: "1:00 PM-Lunch" })])?.srcs,
  [],
  "a photo with no URL contributes nothing to the stack",
);
{
  const heavy = Array.from({ length: 20 }, (_, i) =>
    photo({ checkpointId: "1:00 PM-Lunch", timestamp: i, src: `blob:${i}` }),
  );
  const best = topMoment(stamps, heavy);
  assert.equal(best?.photoCount, 20, "the count stays the true total");
  assert.equal(
    best?.srcs.length,
    TOP_MOMENT_PHOTO_LIMIT,
    "the stack never exceeds its limit",
  );
  assert.deepEqual(
    [best?.srcs[0], best?.srcs[best.srcs.length - 1]],
    ["blob:0", "blob:19"],
    "the stack spans the whole checkpoint, first shot to last",
  );
}

// galleryPhotos — chronological across every checkpoint, thinned to the cap
assert.deepEqual(galleryPhotos([]), [], "no photos means no gallery");
assert.deepEqual(
  galleryPhotos([
    photo({ checkpointId: "b", timestamp: 30, src: "blob:c" }),
    photo({ checkpointId: "a", timestamp: 10, src: "blob:a" }),
    photo({ checkpointId: "b", timestamp: 20, src: "blob:b" }),
  ]),
  ["blob:a", "blob:b", "blob:c"],
  "photos from every checkpoint mix into one chronological flow",
);
assert.deepEqual(
  galleryPhotos([
    photo({ checkpointId: "a", timestamp: 1, src: "blob:a" }),
    photo({ checkpointId: "a", timestamp: 2 }),
  ]),
  ["blob:a"],
  "photos without a URL are dropped",
);
{
  const roll = Array.from({ length: 42 }, (_, i) =>
    photo({ checkpointId: "a", timestamp: i, src: `blob:${i}` }),
  );
  const shown = galleryPhotos(roll);
  assert.equal(shown.length, GALLERY_PHOTO_LIMIT, "the roll is thinned to the cap");
  assert.deepEqual(
    [shown[0], shown[shown.length - 1]],
    ["blob:0", "blob:41"],
    "thinning keeps the first and last frame of the day",
  );
  assert.equal(new Set(shown).size, shown.length, "thinning never repeats a frame");
  const ordered = shown.every(
    (src, i) => i === 0 || Number(src.slice(5)) > Number(shown[i - 1].slice(5)),
  );
  assert.ok(ordered, "thinning preserves chronological order");
  assert.equal(
    galleryPhotos(roll.slice(0, 5)).length,
    5,
    "a short roll passes through untouched",
  );
}
assert.equal(
  topMoment(stamps, [photo({ checkpointId: "Breakfast Quest" })]),
  null,
  "a bare title does not match the composite key",
);

// formatDuration
assert.equal(formatDuration(0), "0m", "zero reads as minutes");
assert.equal(formatDuration(45), "45m", "under an hour is minutes only");
assert.equal(formatDuration(60), "1h", "a whole hour drops the minutes");
assert.equal(formatDuration(680), "11h 20m", "hours and minutes together");

// computeWrappedStats — empty falls back
const empty = computeWrappedStats([], [], 0);
assert.equal(empty.isMock, true, "nothing collected falls back to mock");
assert.ok(empty.stampsCollected > 0, "mock fallback shows non-zero stamps");
assert.ok(empty.receiptItems.length > 0, "mock fallback has receipt lines");

// computeWrappedStats — partial data does NOT fall back
const partial = computeWrappedStats(
  [
    stamp({ time: "9:00 AM", title: "Breakfast Quest", checkedAt: "2026-08-02T09:00:00Z", location: { latitude: 3.1, longitude: 101.4, radius: 100 } }),
    stamp({ time: "8:20 PM", title: "Dinner", checkedAt: "2026-08-02T20:20:00Z", location: { latitude: 3.2, longitude: 101.5, radius: 100 } }),
  ],
  [],
  0,
);
assert.equal(partial.isMock, false, "stamps present means real data");
assert.equal(partial.stampsCollected, 2, "counts collected stamps");
assert.equal(partial.photosTaken, 0, "absent photos read as zero, not as mock");
assert.equal(partial.spanMinutes, 680, "span is last minus first");
assert.ok(partial.distanceKm > 0, "distance computed from locations");
assert.equal(partial.receiptItems.length, 2, "one receipt line per collected stamp");

console.log("wrappedStats.check.ts — all assertions passed");
