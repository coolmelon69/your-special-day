import { useState } from "react";
import { ExternalLink, Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGooglePlacePhoto } from "@/hooks/useGooglePlacePhoto";
import {
  hasPlacesKey,
  mapsUrlForPlace,
  searchCafePlaces,
  type CafePlaceMatch,
} from "@/utils/cafePlaces";

interface PlaceLinkFieldProps {
  placeId: string | null;
  /** Falls back to the name typed above, so the search box can stay empty. */
  nameHint: string;
  onLink: (match: CafePlaceMatch) => void;
  onUnlink: () => void;
}

const FieldLabel = () => (
  <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
    Google place
  </span>
);

/**
 * Optional link between a café entry and a Google place.
 *
 * Renders nothing at all when there is no API key — that absence is the feature
 * toggle. The link exists to give the row a photo without an upload; the place
 * ID is the only thing that reaches the database.
 */
const PlaceLinkField = ({ placeId, nameHint, onLink, onUnlink }: PlaceLinkFieldProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CafePlaceMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const linkedPhoto = useGooglePlacePhoto(placeId);

  if (!hasPlacesKey()) return null;

  const runSearch = async () => {
    const text = query.trim() || nameHint.trim();
    if (!text) {
      setError("Type a name to search for");
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const matches = await searchCafePlaces(text);
      setResults(matches);
      setHasSearched(true);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = (match: CafePlaceMatch) => {
    onLink(match);
    setResults([]);
    setHasSearched(false);
    setQuery("");
  };

  if (placeId) {
    return (
      <div className="space-y-2">
        <FieldLabel />
        <div className="flex items-center gap-3 rounded-md border border-border bg-accent/40 p-3">
          {linkedPhoto.data?.uri ? (
            <img
              src={linkedPhoto.data.uri}
              alt=""
              className="h-12 w-12 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-border/60">
              {linkedPhoto.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              Linked
            </p>
            <a
              href={mapsUrlForPlace(placeId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-sans text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
            >
              View on Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button
            type="button"
            onClick={onUnlink}
            aria-label="Unlink this Google place"
            className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {linkedPhoto.data && linkedPhoto.data.attributions.length === 0 && (
          <p className="font-sans text-xs text-muted-foreground">
            Photo comes from Google and is not stored.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FieldLabel />
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // The sheet is one big form; Enter here must search, not save.
            if (event.key === "Enter") {
              event.preventDefault();
              runSearch();
            }
          }}
          placeholder={nameHint.trim() || "Search Google for the place"}
        />
        <Button type="button" variant="outline" onClick={runSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2">Search</span>
        </Button>
      </div>

      {error && <p className="font-sans text-xs text-destructive">{error}</p>}

      {results.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {results.map((match) => (
            <li key={match.placeId}>
              <button
                type="button"
                onClick={() => handleLink(match)}
                className="flex w-full items-center gap-3 p-3 text-left transition-gentle hover:bg-accent"
              >
                {match.photo?.uri ? (
                  <img src={match.photo.uri} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-border/60">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-sm font-semibold">
                    {match.name}
                  </span>
                  {match.address && (
                    <span className="block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {match.address}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasSearched && results.length === 0 && !error && (
        <p className="font-sans text-xs text-muted-foreground">
          Nothing found. Add the town or street and try again.
        </p>
      )}
    </div>
  );
};

export default PlaceLinkField;
