/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PlaceResult {
  photoUrl: string | null;
  placeId: string | null;
}

const getApiKey = (): string | null => {
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  return key && key.trim() !== "" ? key : null;
};

const placesReady = (): boolean =>
  !!(window as any).google?.maps?.places;

// Load the Google Maps JS SDK once, reusing an in-flight <script> if present.
export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (placesReady()) {
      resolve();
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      reject(new Error("No API key"));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (placesReady()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Timeout waiting for Google Maps script to load"));
      }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(() => {
        if (placesReady()) {
          resolve();
        } else {
          reject(new Error("Google Maps API loaded but Places service not available"));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
};

// REST fallback (via CORS proxy) when the JS SDK is unavailable.
const fetchViaRestAPI = async (locationName: string, apiKey: string): Promise<PlaceResult> => {
  try {
    const searchQuery = encodeURIComponent(`${locationName} Malaysia`);
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`
    )}`;

    const searchResponse = await fetch(proxyUrl);
    if (!searchResponse.ok) return { photoUrl: null, placeId: null };

    const searchData = await searchResponse.json();
    const place = searchData.results?.[0];
    if (!place) return { photoUrl: null, placeId: null };

    const placeId = place.place_id ?? null;
    const photoReference = place.photos?.[0]?.photo_reference;
    const photoUrl = photoReference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=200&photo_reference=${photoReference}&key=${apiKey}`
      : null;

    return { photoUrl, placeId };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[googlePlaces] Error fetching via REST API:", error);
    }
    return { photoUrl: null, placeId: null };
  }
};

// Resolve a location name to its first photo + place ID.
// Tries the JS Places SDK first, falls back to the REST proxy.
export const fetchPlace = async (locationName: string): Promise<PlaceResult> => {
  const apiKey = getApiKey();
  if (!apiKey) return { photoUrl: null, placeId: null };

  try {
    await loadGoogleMapsScript();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[googlePlaces] Script load failed, trying REST API:", error);
    }
    return fetchViaRestAPI(locationName, apiKey);
  }

  return new Promise((resolve) => {
    try {
      const google = (window as any).google;
      if (!placesReady()) {
        fetchViaRestAPI(locationName, apiKey).then(resolve);
        return;
      }

      // PlacesService needs a map instance; use a throwaway hidden div.
      const mapDiv = document.createElement("div");
      mapDiv.style.display = "none";
      document.body.appendChild(mapDiv);
      const map = new google.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 1 });
      const service = new google.maps.places.PlacesService(map);

      service.textSearch(
        { query: `${locationName} Malaysia`, fields: ["place_id", "photos"] },
        (results: any[], status: string) => {
          if (document.body.contains(mapDiv)) document.body.removeChild(mapDiv);

          if (status === google.maps.places.PlacesServiceStatus.OK && results?.length > 0) {
            const place = results[0];
            const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 200 }) ?? null;
            resolve({ photoUrl, placeId: place.place_id ?? null });
          } else {
            fetchViaRestAPI(locationName, apiKey).then(resolve);
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`[googlePlaces] Error using Places API for ${locationName}:`, error);
      }
      fetchViaRestAPI(locationName, apiKey).then(resolve);
    }
  });
};

// Build a Google Maps share link, preferring a place ID when known.
export const getLocationShareUrl = (locationName: string, placeId?: string): string => {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  }
  const searchQuery = encodeURIComponent(`${locationName} Malaysia`);
  return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
};
