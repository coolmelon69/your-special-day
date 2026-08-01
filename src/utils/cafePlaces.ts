/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Google Places lookups for the cafés page.
 *
 * Deliberately separate from `googlePlaces.ts`: that module still runs the
 * legacy `PlacesService` and routes the API key through a third-party CORS
 * proxy. Only its script loader is reused here — everything else below is the
 * current Places API, called straight from the browser SDK.
 *
 * Nothing fetched here is written to the database except the place ID. Google's
 * caching policy exempts place IDs and nothing else, so photos are resolved at
 * render time and held in memory only.
 */
import { loadGoogleMapsScript } from "./googlePlaces.ts";

/** Search results rank toward this region. Swap this line to move cities. */
export const SEARCH_REGION = "my";

const MAX_RESULTS = 5;
const THUMB_MAX_WIDTH = 160;
const PHOTO_MAX_WIDTH = 800;

export interface PlaceAttribution {
  name: string;
  uri: string | null;
}

export interface PlacePhoto {
  uri: string;
  /** Non-empty when Google requires the contributor to be credited. */
  attributions: PlaceAttribution[];
}

export interface CafePlaceMatch {
  placeId: string;
  name: string;
  address: string | null;
  photo: PlacePhoto | null;
}

/** The whole feature hides itself when this is missing. */
export const hasPlacesKey = (): boolean => {
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  return typeof key === "string" && key.trim() !== "";
};

export const mapsUrlForPlace = (placeId: string): string =>
  `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;

const stripPostcode = (segment: string): string =>
  segment
    // UK-style outward + inward code, e.g. "W1F 0PU"
    .replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s+\d[A-Z]{2}\b/gi, "")
    // Plain numeric postcodes, e.g. "47800"
    .replace(/\b\d{4,6}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Reduce a full postal address to the one line the row has room for.
 *
 * Google returns street-first, country-last. Dropping the country leaves the
 * state or region in final position, so the segment before it is the town or
 * neighbourhood — "…, 47800 Petaling Jaya, Selangor, Malaysia" gives
 * "Petaling Jaya", and "…, Soho, London W1F 0PU, UK" gives "Soho".
 *
 * A heuristic, not a parser. It prefills `area`; you can always overwrite it.
 */
export const localityFromAddress = (address: string | null): string | null => {
  if (!address) return null;
  const parts = address.split(",").map(stripPostcode).filter(Boolean);
  if (parts.length === 0) return null;
  const withoutCountry = parts.length > 1 ? parts.slice(0, -1) : parts;
  return withoutCountry[withoutCountry.length - 2] ?? withoutCountry[withoutCountry.length - 1];
};

const toPhoto = (photo: any, maxWidth: number): PlacePhoto | null => {
  const uri = photo?.getURI?.({ maxWidth });
  if (!uri) return null;
  return {
    uri,
    attributions: (photo.authorAttributions ?? [])
      .map((author: any) => ({ name: author?.displayName ?? "", uri: author?.uri ?? null }))
      .filter((author: PlaceAttribution) => author.name !== ""),
  };
};

/** Resolves `google.maps.places`, or throws with something worth reading. */
const placesLibrary = async (): Promise<any> => {
  await loadGoogleMapsScript();
  const places = (window as any).google?.maps?.places;
  if (!places?.Place) {
    throw new Error("Google Places did not load — check the API key restrictions");
  }
  return places;
};

/** Top matches for a typed name, biased toward SEARCH_REGION. */
export const searchCafePlaces = async (query: string): Promise<CafePlaceMatch[]> => {
  const textQuery = query.trim();
  if (!textQuery || !hasPlacesKey()) return [];

  const places = await placesLibrary();
  const { places: results } = await places.Place.searchByText({
    textQuery,
    fields: ["id", "displayName", "formattedAddress", "photos"],
    region: SEARCH_REGION,
    maxResultCount: MAX_RESULTS,
    language: "en",
  });

  return (results ?? [])
    .filter((result: any) => result?.id)
    .map((result: any) => ({
      placeId: result.id as string,
      name: (result.displayName as string) ?? "",
      address: (result.formattedAddress as string) ?? null,
      photo: toPhoto(result.photos?.[0], THUMB_MAX_WIDTH),
    }));
};

/** One photo for an already-linked place. Null whenever Google has none. */
export const fetchPlacePhoto = async (placeId: string): Promise<PlacePhoto | null> => {
  if (!placeId || !hasPlacesKey()) return null;

  const places = await placesLibrary();
  const place = new places.Place({ id: placeId });
  await place.fetchFields({ fields: ["photos"] });
  return toPhoto(place.photos?.[0], PHOTO_MAX_WIDTH);
};
