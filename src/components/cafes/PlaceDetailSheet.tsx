import { ExternalLink, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Pill } from "@/components/editorial";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGooglePlacePhoto } from "@/hooks/useGooglePlacePhoto";
import { mapsUrlForPlace } from "@/utils/cafePlaces";
import type { RankedPlace } from "@/utils/cafeRanking";
import { MAX_RATING, PRICE_SYMBOL, RATER_A_LABEL, RATER_B_LABEL, type CafePlace } from "@/types/cafes";

const formatVisited = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

const metaLine = (place: CafePlace) =>
  [
    place.area?.toUpperCase(),
    place.price_band ? PRICE_SYMBOL.repeat(place.price_band) : null,
    formatVisited(place.visited_on),
  ]
    .filter(Boolean)
    .join(" · ");

const ScoreLine = ({ label, value, tone }: { label: string; value: number | null; tone: "person" | "average" }) => (
  <div className="flex items-center gap-3">
    <span
      className={
        tone === "average"
          ? "w-10 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-rose"
          : "w-10 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
      }
    >
      {tone === "average" ? "avg" : label}
    </span>
    <span
      className={
        tone === "average"
          ? "relative h-[3px] flex-1 overflow-hidden rounded-full bg-rose/15"
          : "relative h-[3px] flex-1 overflow-hidden rounded-full bg-border"
      }
    >
      {value !== null && (
        <span
          className={
            tone === "average"
              ? "absolute inset-y-0 left-0 rounded-full bg-rose"
              : "absolute inset-y-0 left-0 rounded-full bg-primary/70"
          }
          style={{ width: `${(value / MAX_RATING) * 100}%` }}
        />
      )}
    </span>
    <span
      className={
        tone === "average"
          ? "w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-rose"
          : "w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground"
      }
    >
      {value === null ? "—" : value.toFixed(1)}
    </span>
  </div>
);

interface PlaceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ranked: RankedPlace | null;
  onEdit: (place: CafePlace) => void;
}

const PlaceDetailSheet = ({ open, onOpenChange, ranked, onEdit }: PlaceDetailSheetProps) => {
  const isMobile = useIsMobile();
  const place = ranked?.place ?? null;
  const googlePhoto = useGooglePlacePhoto(place?.gmaps_place_id);
  if (!place) return null;

  const photoSrc = place.photo_url ?? googlePhoto.data?.uri ?? null;
  const credits = place.photo_url ? [] : (googlePhoto.data?.attributions ?? []);
  const meta = metaLine(place);

  const body = (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-6 pt-1 md:px-6">
      {photoSrc && (
        <figure>
          <img
            src={photoSrc}
            alt={place.name}
            className="aspect-[4/3] w-full rounded-lg border border-border object-cover"
          />
          {credits.length > 0 && (
            <figcaption className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {credits.map((credit) => credit.name).join(", ")}
            </figcaption>
          )}
        </figure>
      )}

      {(meta || place.gmaps_place_id) && (
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
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

      {place.status === "visited" && (
        <div className="space-y-1.5">
          <ScoreLine label={RATER_A_LABEL} value={place.rating_him} tone="person" />
          <ScoreLine label={RATER_B_LABEL} value={place.rating_her} tone="person" />
          <ScoreLine label="avg" value={ranked.average} tone="average" />
        </div>
      )}

      {(place.note || place.would_return) && (
        <div className="space-y-3">
          {place.would_return && (
            <Pill variant="done" icon={<RotateCcw />}>
              would return
            </Pill>
          )}
          {place.note && <p className="font-serif text-base italic text-muted-foreground">“{place.note}”</p>}
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={() => onEdit(place)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="shrink-0 px-5 pb-2 text-left">
            <DrawerTitle className="font-serif text-2xl">{place.name}</DrawerTitle>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 px-6 pb-2 pt-6">
          <DialogTitle className="font-serif text-2xl">{place.name}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};

export default PlaceDetailSheet;
