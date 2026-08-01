/** Shared types + constants for the Cafés section. No logic lives here. */

export type PlaceStatus = "wishlist" | "visited";

export type PriceBand = 1 | 2 | 3;

export interface CafeCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface CafePlace {
  id: string;
  category_id: string;
  name: string;
  status: PlaceStatus;
  area: string | null;
  price_band: PriceBand | null;
  /** ISO date, yyyy-mm-dd */
  visited_on: string | null;
  note: string | null;
  photo_url: string | null;
  would_return: boolean | null;
  rating_him: number | null;
  rating_her: number | null;
  gmaps_place_id: string | null;
  gmaps_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * What the edit form hands back. `id` absent means insert.
 *
 * `gmaps_url` stays out: it is derivable from the place ID, so storing it would
 * only be a second copy that can drift. See `mapsUrlForPlace`.
 */
export type NewCafePlace = Omit<
  CafePlace,
  "id" | "created_at" | "updated_at" | "gmaps_url"
> & { id?: string };

/** Swap these two for real names when you have them. */
export const RATER_A_LABEL = "HIM";
export const RATER_B_LABEL = "HER";

export const PRICE_SYMBOL = "£";

export const MIN_RATING = 0.5;
export const MAX_RATING = 5;
export const RATING_STEP = 0.5;
