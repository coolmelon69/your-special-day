import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSavePlace } from "@/hooks/useCafes";
import { uploadPhotoToStorage } from "@/utils/photoUpload";
import { slugify } from "@/utils/cafeRanking";
import { localityFromAddress, type CafePlaceMatch } from "@/utils/cafePlaces";
import StarRating from "./StarRating";
import PlaceLinkField from "./PlaceLinkField";
import {
  PRICE_SYMBOL,
  RATER_A_LABEL,
  RATER_B_LABEL,
  type CafePlace,
  type NewCafePlace,
  type PlaceStatus,
  type PriceBand,
} from "@/types/cafes";

interface PlaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  /** Present when editing; absent when adding. */
  place?: CafePlace;
  /** Status the form opens with when adding. Defaults to wishlist. */
  initialStatus?: PlaceStatus;
}

interface FormState {
  name: string;
  status: PlaceStatus;
  area: string;
  price_band: PriceBand | null;
  visited_on: string;
  note: string;
  photo_url: string | null;
  would_return: boolean | null;
  rating_him: number | null;
  rating_her: number | null;
  gmaps_place_id: string | null;
}

const emptyForm = (status: PlaceStatus): FormState => ({
  name: "",
  status,
  area: "",
  price_band: null,
  visited_on: "",
  note: "",
  photo_url: null,
  would_return: null,
  rating_him: null,
  rating_her: null,
  gmaps_place_id: null,
});

const fromPlace = (place: CafePlace): FormState => ({
  name: place.name,
  status: place.status,
  area: place.area ?? "",
  price_band: place.price_band,
  visited_on: place.visited_on ?? "",
  note: place.note ?? "",
  photo_url: place.photo_url,
  would_return: place.would_return,
  rating_him: place.rating_him,
  rating_her: place.rating_her,
  gmaps_place_id: place.gmaps_place_id,
});

const PlaceSheet = ({
  open,
  onOpenChange,
  categoryId,
  place,
  initialStatus = "wishlist",
}: PlaceSheetProps) => {
  const isMobile = useIsMobile();
  const savePlace = useSavePlace();
  const [form, setForm] = useState<FormState>(() =>
    place ? fromPlace(place) : emptyForm(initialStatus)
  );
  const [isUploading, setIsUploading] = useState(false);

  // Re-seed whenever the sheet opens so a stale draft never leaks between rows.
  useEffect(() => {
    if (open) setForm(place ? fromPlace(place) : emptyForm(initialStatus));
  }, [open, place, initialStatus]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // Linking only fills blanks. Anything you typed yourself survives.
  const handleLink = (match: CafePlaceMatch) =>
    setForm((current) => ({
      ...current,
      gmaps_place_id: match.placeId,
      name: current.name.trim() || match.name,
      area: current.area.trim() || localityFromAddress(match.address) || "",
    }));

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const dataURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read that file"));
        reader.readAsDataURL(file);
      });
      const photoId = `${slugify(form.name) || "place"}-${Date.now()}`;
      const url = await uploadPhotoToStorage(dataURL, "cafes", photoId);
      if (!url) {
        toast.error("Photo upload failed — you may need to sign in first");
        return;
      }
      set("photo_url", url);
      toast.success("Photo added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Give the place a name first");
      return;
    }

    const payload: NewCafePlace = {
      ...(place ? { id: place.id } : {}),
      category_id: categoryId,
      name,
      status: form.status,
      area: form.area.trim() || null,
      price_band: form.price_band,
      visited_on: form.status === "visited" ? form.visited_on || null : null,
      note: form.note.trim() || null,
      photo_url: form.photo_url,
      would_return: form.status === "visited" ? form.would_return : null,
      rating_him: form.status === "visited" ? form.rating_him : null,
      rating_her: form.status === "visited" ? form.rating_her : null,
      gmaps_place_id: form.gmaps_place_id,
    };

    savePlace.mutate(payload, {
      onSuccess: () => {
        toast.success(place ? "Updated" : "Added to the list");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const title = place ? "Edit place" : form.status === "visited" ? "Add a place you've been" : "Add to the wishlist";

  /**
   * The shell is a three-band column: title, scrolling fields, pinned actions.
   *
   * Only the middle band scrolls. Letting the whole panel scroll instead pushes
   * Save off the bottom on short viewports, and the rounded fixed drawer repaints
   * its scrolled region badly, so the form appears to vanish mid-field.
   */
  const body = (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-6 pt-1 md:px-6">
      <div className="space-y-2">
        <Label htmlFor="cafe-name" className="font-mono text-[10px] uppercase tracking-[0.18em]">
          Name
        </Label>
        <Input
          id="cafe-name"
          value={form.name}
          onChange={(event) => set("name", event.target.value)}
          placeholder="The Codfather"
          autoFocus
        />
      </div>

      <PlaceLinkField
        placeId={form.gmaps_place_id}
        nameHint={form.name}
        onLink={handleLink}
        onUnlink={() => set("gmaps_place_id", null)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cafe-area" className="font-mono text-[10px] uppercase tracking-[0.18em]">
            Area
          </Label>
          <Input
            id="cafe-area"
            value={form.area}
            onChange={(event) => set("area", event.target.value)}
            placeholder="Soho"
          />
        </div>
        <div className="space-y-2">
          <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Price
          </span>
          <div className="flex gap-2">
            {([1, 2, 3] as PriceBand[]).map((band) => (
              <button
                key={band}
                type="button"
                aria-pressed={form.price_band === band}
                onClick={() => set("price_band", form.price_band === band ? null : band)}
                className={
                  form.price_band === band
                    ? "flex-1 rounded-md border border-primary bg-primary/10 py-2 font-mono text-xs text-primary"
                    : "flex-1 rounded-md border border-border py-2 font-mono text-xs text-muted-foreground hover:border-primary/40"
                }
              >
                {PRICE_SYMBOL.repeat(band)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Status
        </span>
        <div className="flex gap-2">
          {(["wishlist", "visited"] as PlaceStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={form.status === status}
              onClick={() => set("status", status)}
              className={
                form.status === status
                  ? "flex-1 rounded-md border border-rose bg-rose/10 py-2 font-mono text-[11px] uppercase tracking-wide text-rose"
                  : "flex-1 rounded-md border border-border py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:border-primary/40"
              }
            >
              {status === "wishlist" ? "want to go" : "been there"}
            </button>
          ))}
        </div>
      </div>

      {form.status === "visited" && (
        <div className="space-y-4 rounded-lg border border-border bg-accent/40 p-4">
          <StarRating
            label={RATER_A_LABEL}
            value={form.rating_him}
            onChange={(value) => set("rating_him", value)}
          />
          <StarRating
            label={RATER_B_LABEL}
            value={form.rating_her}
            onChange={(value) => set("rating_her", value)}
          />

          <div className="space-y-2">
            <Label htmlFor="cafe-date" className="font-mono text-[10px] uppercase tracking-[0.18em]">
              When
            </Label>
            <Input
              id="cafe-date"
              type="date"
              value={form.visited_on}
              onChange={(event) => set("visited_on", event.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.would_return === true}
              onChange={(event) => set("would_return", event.target.checked ? true : false)}
              className="h-4 w-4 accent-[hsl(var(--rose))]"
            />
            Would go back
          </label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cafe-note" className="font-mono text-[10px] uppercase tracking-[0.18em]">
          Note
        </Label>
        <Textarea
          id="cafe-note"
          value={form.note}
          onChange={(event) => set("note", event.target.value)}
          placeholder="batter was unreal"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Photo
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/*
            The native file input is hidden and driven by its label. Left visible
            it renders as bare text — no border, no fill — which reads as an
            empty field rather than a button.
          */}
          <label
            htmlFor="cafe-photo"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-gentle hover:border-primary/40 hover:text-primary"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {isUploading ? "Uploading…" : form.photo_url ? "Replace photo" : "Choose photo"}
          </label>
          <input
            id="cafe-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Clear it so picking the same file twice still fires a change.
              event.target.value = "";
              handlePhoto(file);
            }}
          />
          {form.photo_url && (
            <button
              type="button"
              onClick={() => set("photo_url", null)}
              className="inline-flex items-center gap-2 rounded-md px-2 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
        {form.photo_url && (
          <img
            src={form.photo_url}
            alt=""
            className="h-24 w-24 rounded-md border border-border object-cover"
          />
        )}
      </div>

      </div>

      {/* The drawer sits on the bottom edge, so keep the buttons off the home indicator. */}
      <div className="flex shrink-0 gap-3 border-t border-border bg-background px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-6">
        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={savePlace.isPending || isUploading}>
          {savePlace.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="shrink-0 px-5 pb-2 text-left">
            <DrawerTitle className="font-serif text-2xl">{title}</DrawerTitle>
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
          <DialogTitle className="font-serif text-2xl">{title}</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};

export default PlaceSheet;
