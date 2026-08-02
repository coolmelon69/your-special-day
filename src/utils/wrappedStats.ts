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

/** The checkpoint with the most photos, or null when there are no photos. */
export const topMoment = (stamps: StampLike[], photos: PhotoLike[]): TopMoment | null => {
  const counts = new Map<string, number>();
  for (const p of photos) {
    counts.set(p.checkpointId, (counts.get(p.checkpointId) ?? 0) + 1);
  }

  let best: TopMoment | null = null;
  for (const stamp of stamps) {
    const count = counts.get(checkpointKey(stamp)) ?? 0;
    if (count > 0 && (best === null || count > best.photoCount)) {
      best = { title: stamp.title, photoCount: count };
    }
  }
  return best;
};

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
    couponsRedeemed: redeemedCount,
    receiptItems,
  };
};
