import type {
  Coord,
  PhotoLike,
  Point,
  ReceiptItem,
  StampLike,
  TopMoment,
  WrappedStats,
} from "../types/wrapped.ts";
import { MOCK_STATS } from "../components/wrapped/copy.ts";

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two coordinates, in kilometres. */
export const haversineKm = (a: Coord, b: Coord): number => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/**
 * The photo-to-checkpoint key. Must stay in step with TimelineSection.tsx,
 * which builds it as `${selectedEvent.time}-${selectedEvent.title}`.
 */
export const checkpointKey = (stamp: Pick<StampLike, "time" | "title">): string =>
  `${stamp.time}-${stamp.title}`;

/** Stamps that have been checked in, oldest first. */
export const collectedStamps = (items: StampLike[]): StampLike[] =>
  items
    .filter((item) => Boolean(item.checkedAt))
    .sort((a, b) => Date.parse(a.checkedAt as string) - Date.parse(b.checkedAt as string));

/** Total distance along an ordered path. */
export const routeDistanceKm = (coords: Coord[]): number => {
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineKm(coords[i - 1], coords[i]);
  }
  return total;
};

/**
 * Project coordinates into a square SVG viewBox, north up.
 *
 * Latitude and longitude are scaled independently, so the shape is distorted
 * relative to a real map. That is deliberate: this is an abstract route
 * drawing, not a map, and independent scaling fills the frame.
 */
export const normalizeRoute = (coords: Coord[], size = 100, pad = 10): Point[] => {
  if (coords.length === 0) return [];

  const latitudes = coords.map((c) => c.latitude);
  const longitudes = coords.map((c) => c.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const inner = size - pad * 2;

  // A zero span means every point is identical on that axis; center it rather
  // than dividing by zero.
  const scale = (value: number, min: number, span: number) =>
    span === 0 ? size / 2 : pad + ((value - min) / span) * inner;

  return coords.map((c) => ({
    x: scale(c.longitude, minLon, maxLon - minLon),
    y: size - scale(c.latitude, minLat, maxLat - minLat),
  }));
};

/** Largest interval between consecutive check-ins, in whole minutes. */
export const longestGapMinutes = (stamps: StampLike[]): number => {
  let longest = 0;
  for (let i = 1; i < stamps.length; i += 1) {
    const gap = Date.parse(stamps[i].checkedAt as string) - Date.parse(stamps[i - 1].checkedAt as string);
    if (gap > longest) longest = gap;
  }
  return Math.round(longest / 60000);
};

/** The most-used filter name. Ties go to whichever was seen first. */
export const favouriteFilter = (photos: PhotoLike[]): string | null => {
  const counts = new Map<string, number>();
  for (const p of photos) {
    if (!p.filter) continue;
    counts.set(p.filter, (counts.get(p.filter) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
};

/** At most six photos land on the Top Moment slide before the pile stops reading. */
export const TOP_MOMENT_PHOTO_LIMIT = 6;

/**
 * The gallery caps here rather than rendering the whole roll: photos are
 * stored as full-size data URLs, and thirty of them is already several
 * megabytes decoded.
 */
export const GALLERY_PHOTO_LIMIT = 30;

/** Photo URLs in the order they were taken, skipping any photo without one. */
const photoUrls = (photos: PhotoLike[]): string[] =>
  [...photos]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((p) => p.storageUrl ?? p.src)
    .filter((src): src is string => Boolean(src));

/**
 * Thins `list` to `limit` items, keeping the first and the last. Sampling
 * across the day beats taking the first thirty, which would end the gallery
 * at lunchtime.
 */
const sampleEvenly = <T>(list: T[], limit: number): T[] => {
  if (list.length <= limit) return list;
  if (limit <= 1) return list.slice(0, limit);
  return Array.from(
    { length: limit },
    (_, i) => list[Math.round((i * (list.length - 1)) / (limit - 1))],
  );
};

/** The checkpoint with the most photos, or null when there are no photos. */
export const topMoment = (stamps: StampLike[], photos: PhotoLike[]): TopMoment | null => {
  const byCheckpoint = new Map<string, PhotoLike[]>();
  for (const p of photos) {
    const shots = byCheckpoint.get(p.checkpointId);
    if (shots) shots.push(p);
    else byCheckpoint.set(p.checkpointId, [p]);
  }

  let best: TopMoment | null = null;
  for (const stamp of stamps) {
    const shots = byCheckpoint.get(checkpointKey(stamp)) ?? [];
    if (shots.length > 0 && (best === null || shots.length > best.photoCount)) {
      best = {
        title: stamp.title,
        photoCount: shots.length,
        srcs: sampleEvenly(photoUrls(shots), TOP_MOMENT_PHOTO_LIMIT),
      };
    }
  }
  return best;
};

/** Every photo of the day, oldest first, thinned to at most `limit`. */
export const galleryPhotos = (photos: PhotoLike[], limit = GALLERY_PHOTO_LIMIT): string[] =>
  sampleEvenly(photoUrls(photos), limit);

/** Epoch milliseconds as a local wall clock, e.g. "9:04 AM". */
export const formatClock = (ms: number): string =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** Minutes as "11h 20m", "45m", or "1h". */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

/**
 * Everything the slides display, from the raw context data.
 *
 * Falls back to MOCK_STATS only when nothing at all has been collected.
 * Partial data stays real: stamps with no photos report zero photos, not
 * mock photos.
 */
export const computeWrappedStats = (
  items: StampLike[],
  photos: PhotoLike[],
  redeemedCount: number,
): WrappedStats => {
  const collected = collectedStamps(items);

  if (collected.length === 0) {
    return { ...MOCK_STATS, isMock: true };
  }

  const route = collected
    .map((s) => s.location)
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map(({ latitude, longitude }) => ({ latitude, longitude }));

  const firstStampAt = Date.parse(collected[0].checkedAt as string);
  const lastStampAt = Date.parse(collected[collected.length - 1].checkedAt as string);

  const stickersPlaced = photos.reduce((sum, p) => sum + (p.stickers?.length ?? 0), 0);

  const receiptItems: ReceiptItem[] = collected.map((s) => ({
    time: s.time,
    title: s.title,
  }));

  return {
    isMock: false,
    stampsCollected: collected.length,
    stampsTotal: items.length,
    firstStampAt,
    lastStampAt,
    spanMinutes: Math.round((lastStampAt - firstStampAt) / 60000),
    longestGapMinutes: longestGapMinutes(collected),
    distanceKm: routeDistanceKm(route),
    route,
    photosTaken: photos.length,
    stickersPlaced,
    favouriteFilter: favouriteFilter(photos),
    topMoment: topMoment(collected, photos),
    galleryPhotos: galleryPhotos(photos),
    couponsRedeemed: redeemedCount,
    receiptItems,
  };
};
