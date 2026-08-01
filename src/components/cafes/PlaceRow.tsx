import { useState } from "react";
import { ExternalLink, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/editorial";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePlace } from "@/hooks/useCafes";
import { useGooglePlacePhoto } from "@/hooks/useGooglePlacePhoto";
import { mapsUrlForPlace } from "@/utils/cafePlaces";
import type { RankedPlace } from "@/utils/cafeRanking";
import {
  MAX_RATING,
  PRICE_SYMBOL,
  RATER_A_LABEL,
  RATER_B_LABEL,
  type CafePlace,
} from "@/types/cafes";

/**
 * A score drawn as a rule that fills to its value. Two of these stacked let you
 * read the disagreement between two people in one glance — which a pair of star
 * rows cannot do.
 */
const ScoreSpine = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "person" | "average";
}) => (
  <div className="flex items-center gap-3">
    <span
      className={cn(
        "w-10 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]",
        tone === "average" ? "text-rose" : "text-muted-foreground"
      )}
    >
      {tone === "average" ? "avg" : label}
    </span>
    <span
      className={cn(
        "relative h-[3px] flex-1 overflow-hidden rounded-full",
        tone === "average" ? "bg-rose/15" : "bg-border"
      )}
    >
      {value !== null && (
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            tone === "average" ? "bg-rose" : "bg-primary/70"
          )}
          style={{ width: `${(value / MAX_RATING) * 100}%` }}
        />
      )}
    </span>
    <span
      className={cn(
        "w-8 shrink-0 text-right font-mono text-[11px] tabular-nums",
        tone === "average" ? "text-rose" : "text-muted-foreground"
      )}
    >
      {value === null ? "—" : value.toFixed(1)}
    </span>
  </div>
);

const formatVisited = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    .toUpperCase();
};

const metaLine = (place: CafePlace) =>
  [
    place.area?.toUpperCase(),
    place.price_band ? PRICE_SYMBOL.repeat(place.price_band) : null,
    formatVisited(place.visited_on),
  ]
    .filter(Boolean)
    .join(" · ");

interface PlaceRowProps {
  ranked: RankedPlace;
  /** The current Nº1 gets the rose treatment. */
  isTop: boolean;
  onEdit: (place: CafePlace) => void;
}

const PlaceRow = ({ ranked, isTop, onEdit }: PlaceRowProps) => {
  const { place, average, rank } = ranked;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deletePlace = useDeletePlace();
  const meta = metaLine(place);
  const googlePhoto = useGooglePlacePhoto(place.gmaps_place_id);
  // Your own upload always wins. Google only fills the gap.
  const photoSrc = place.photo_url ?? googlePhoto.data?.uri ?? null;
  const credits = place.photo_url ? [] : (googlePhoto.data?.attributions ?? []);

  return (
    <article
      className={cn(
        "group grid grid-cols-[3rem_1fr] gap-x-4 gap-y-3 rounded-lg border bg-card p-4 transition-gentle md:grid-cols-[4.5rem_1fr_9rem] md:p-6",
        isTop ? "border-rose/40 shadow-romantic" : "border-border"
      )}
    >
      {/* rank rail */}
      <div className="flex flex-col items-start">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Nº
        </span>
        <span
          className={cn(
            "font-serif text-4xl font-bold leading-none tracking-tight md:text-6xl",
            isTop ? "text-rose" : "text-primary"
          )}
        >
          {String(rank).padStart(2, "0")}
        </span>
      </div>

      {/* body */}
      <div className="min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-xl font-bold leading-tight md:text-2xl">
              {place.name}
            </h3>
            {(meta || place.gmaps_place_id) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {meta}
              {place.gmaps_place_id && (
                <a
                  href={mapsUrlForPlace(place.gmaps_place_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  Maps
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </p>
            )}
          </div>

          <div className="flex shrink-0 gap-1 opacity-0 transition-gentle focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(place)}
              aria-label={`Edit ${place.name}`}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              aria-label={`Delete ${place.name}`}
              className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <ScoreSpine label={RATER_A_LABEL} value={place.rating_him} tone="person" />
          <ScoreSpine label={RATER_B_LABEL} value={place.rating_her} tone="person" />
          <ScoreSpine label="avg" value={average} tone="average" />
        </div>

        {(place.note || place.would_return) && (
          <div className="flex flex-wrap items-center gap-3">
            {place.would_return && (
              <Pill variant="done" icon={<RotateCcw />}>
                would return
              </Pill>
            )}
            {place.note && (
              <p className="min-w-0 flex-1 font-serif text-sm italic text-muted-foreground">
                “{place.note}”
              </p>
            )}
          </div>
        )}
      </div>

      {/* photo */}
      {photoSrc && (
        <figure className="col-span-2 md:col-span-1 md:row-span-1">
          <img
            src={photoSrc}
            alt={place.name}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-md border border-border object-cover md:aspect-[3/4]"
          />
          {/* Google requires the contributor to be credited when it names one. */}
          {credits.length > 0 && (
            <figcaption className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {credits.map((credit) => credit.name).join(", ")}
            </figcaption>
          )}
        </figure>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete {place.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it and its ratings from the list. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePlace.mutate(place, {
                  onSuccess: () => toast.success(`${place.name} removed`),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

interface WishlistRowProps {
  place: CafePlace;
  onEdit: (place: CafePlace) => void;
  onMarkVisited: (place: CafePlace) => void;
}

export const WishlistRow = ({ place, onEdit, onMarkVisited }: WishlistRowProps) => (
  <article className="flex items-center gap-4 rounded-lg border border-dashed border-border bg-card/60 p-4 opacity-60 transition-gentle hover:opacity-100">
    <button
      type="button"
      onClick={() => onMarkVisited(place)}
      aria-label={`Mark ${place.name} as visited`}
      className="h-5 w-5 shrink-0 rounded-[4px] border border-muted-foreground/50 transition-gentle hover:border-rose hover:bg-rose/10"
    />
    <div className="min-w-0 flex-1">
      <h3 className="truncate font-serif text-lg font-semibold leading-tight">{place.name}</h3>
      {place.note && (
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {place.note}
        </p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onEdit(place)}
      aria-label={`Edit ${place.name}`}
      className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-primary"
    >
      <Pencil className="h-4 w-4" />
    </button>
  </article>
);

export default PlaceRow;
