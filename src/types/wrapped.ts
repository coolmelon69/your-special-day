/**
 * Structural types for the /wrapped statistics math.
 *
 * Deliberately decoupled from ItineraryItem and Photo in TimelineSection.tsx:
 * that file is JSX, and wrappedStats.check.ts runs under plain node, which
 * strips types but cannot parse JSX. ItineraryItem and Photo satisfy these
 * shapes structurally, so no cast is needed at the call site.
 */

export interface Coord {
  latitude: number;
  longitude: number;
}

/** A point in the normalized SVG viewBox. */
export interface Point {
  x: number;
  y: number;
}

export interface StampLike {
  time: string;
  title: string;
  checkedAt?: string | null;
  location?: Coord & { radius: number };
}

export interface PhotoLike {
  checkpointId: string;
  timestamp: number;
  filter?: string;
  stickers?: unknown[];
}

export interface TopMoment {
  title: string;
  photoCount: number;
}

export interface ReceiptItem {
  time: string;
  title: string;
}

export interface WrappedStats {
  /** True only when nothing at all has been collected. */
  isMock: boolean;
  stampsCollected: number;
  stampsTotal: number;
  /** Epoch ms, or null when nothing is collected. */
  firstStampAt: number | null;
  lastStampAt: number | null;
  spanMinutes: number;
  longestGapMinutes: number;
  distanceKm: number;
  route: Coord[];
  photosTaken: number;
  stickersPlaced: number;
  favouriteFilter: string | null;
  topMoment: TopMoment | null;
  couponsRedeemed: number;
  receiptItems: ReceiptItem[];
}
