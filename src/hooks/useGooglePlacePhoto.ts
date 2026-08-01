import { useQuery } from "@tanstack/react-query";
import { fetchPlacePhoto, hasPlacesKey, type PlacePhoto } from "@/utils/cafePlaces";

/**
 * The photo for a linked place, resolved once per browser session.
 *
 * `staleTime: Infinity` means one Google call per place per tab — a leaderboard
 * scroll costs nothing after first paint. Nothing is persisted to storage: place
 * IDs may be kept indefinitely, photo content may not, so the cache lives and
 * dies with the tab.
 *
 * `retry: false` because the interesting failures here (no key, restricted key,
 * API not enabled) do not get better on a second attempt.
 */
export const useGooglePlacePhoto = (placeId: string | null | undefined) =>
  useQuery({
    queryKey: ["gmaps", "photo", placeId],
    queryFn: (): Promise<PlacePhoto | null> => fetchPlacePhoto(placeId as string),
    enabled: Boolean(placeId) && hasPlacesKey(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
