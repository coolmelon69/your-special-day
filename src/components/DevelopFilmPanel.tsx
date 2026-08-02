import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { sprites, type ItineraryItem, type Photo } from "@/components/TimelineSection";
import { checkpointKey } from "@/utils/memoryBookGenerator";
import { sparkleBurst } from "@/utils/particles";

interface DevelopFilmPanelProps {
  /** Photos that are still latent — either never developed, or filed under a stop that no longer exists. */
  photos: Photo[];
  itinerary: ItineraryItem[];
  /** photoId → checkpointKey, for the frames the user filed. */
  onDevelop: (assignments: Record<string, string>) => Promise<void>;
}

const formatCaptured = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Evidence photo for a stop, falling back to its pixel sprite (same treatment as the stamp grid).
const StopFace = ({ item }: { item: ItineraryItem }) => {
  const [failed, setFailed] = useState(false);
  const Sprite = sprites[item.sprite];

  if (item.imageUrl && !failed) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="grid h-full w-full place-items-center p-3">
      <span className="w-10 h-10">
        {Sprite ? <Sprite isActive={item.isActive} isPast={item.isPast} /> : null}
      </span>
    </span>
  );
};

const DevelopFilmPanel = ({ photos, itinerary, onDevelop }: DevelopFilmPanelProps) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(photos[0]?.id ?? null);
  const [isDeveloping, setIsDeveloping] = useState(false);
  const developButtonRef = useRef<HTMLButtonElement>(null);

  // Keep the active frame pointed at a photo that still exists after a reload.
  useEffect(() => {
    setActiveId((current) =>
      current && photos.some((p) => p.id === current) ? current : photos[0]?.id ?? null
    );
  }, [photos]);

  const filedCount = useMemo(
    () => photos.filter((p) => assignments[p.id]).length,
    [photos, assignments]
  );
  const unfiledCount = photos.length - filedCount;

  const stopUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(assignments).forEach((key) => {
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [assignments]);

  const titleByKey = useMemo(() => {
    const map: Record<string, string> = {};
    itinerary.forEach((item) => {
      map[checkpointKey(item)] = item.title;
    });
    return map;
  }, [itinerary]);

  const fileFrame = (item: ItineraryItem) => {
    if (!activeId) return;
    const key = checkpointKey(item);
    const next = { ...assignments, [activeId]: key };
    setAssignments(next);

    // Move to the next frame still waiting for a stop, so a whole roll files in one pass.
    const remaining = photos.filter((p) => !next[p.id]);
    if (remaining.length > 0) {
      const after = photos.findIndex((p) => p.id === activeId);
      const forward = remaining.find((p) => photos.indexOf(p) > after);
      setActiveId((forward ?? remaining[0]).id);
    }
  };

  const handleDevelop = async () => {
    if (filedCount === 0 || isDeveloping) return;
    setIsDeveloping(true);
    try {
      const filed: Record<string, string> = {};
      photos.forEach((p) => {
        if (assignments[p.id]) filed[p.id] = assignments[p.id];
      });
      await onDevelop(filed);

      const rect = developButtonRef.current?.getBoundingClientRect();
      if (rect) {
        sparkleBurst({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          particleCount: 22,
        });
      }
      setAssignments({});
    } finally {
      setIsDeveloping(false);
    }
  };

  if (itinerary.length === 0) {
    return (
      <div className="mb-14 border-y border-border bg-accent/40 -mx-6 px-6 py-10 no-print">
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          {photos.length} {photos.length === 1 ? "frame" : "frames"} waiting, no stops to file them under
          <span className="dot-accent">.</span>
        </h2>
        <p className="mt-2 max-w-[52ch] font-sans font-light text-muted-foreground">
          Add stops to the itinerary first — a photo needs somewhere to belong before it can go in the book.
        </p>
      </div>
    );
  }

  return (
    <section
      className="mb-14 border-y border-border bg-accent/40 -mx-6 px-6 py-10 md:py-12 no-print"
      aria-label="Develop film"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
            {photos.length} {photos.length === 1 ? "frame" : "frames"} still{" "}
            <em className="italic text-rose">latent</em>
            <span className="dot-accent">.</span>
          </h2>
          <p className="mt-2 max-w-[52ch] font-sans font-light text-muted-foreground">
            Pick a frame, then the stop it was taken at. Developing files them into the book under that stop.
          </p>
        </div>
        <p className="font-mono-caption text-muted-foreground">
          {filedCount} / {photos.length} filed
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_1.15fr] lg:gap-12">
        {/* The roll */}
        <div>
          <p className="font-mono-caption mb-3 text-muted-foreground">the roll</p>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
            {photos.map((photo) => {
              const assignedKey = assignments[photo.id];
              const isActive = activeId === photo.id;

              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveId(photo.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex min-w-[248px] shrink-0 snap-start items-center gap-4 rounded-xl border bg-card p-3 text-left transition-all lg:w-full lg:min-w-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? "border-primary shadow-romantic"
                      : assignedKey
                      ? "border-rose/40"
                      : "border-border hover:border-foreground/40"
                  )}
                >
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <img
                      src={photo.storageUrl || photo.src}
                      alt=""
                      className={cn(
                        "h-full w-full object-cover transition-[filter] duration-700 ease-out",
                        assignedKey ? "blur-0 saturate-100" : "blur-[3px] saturate-50"
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-mono-caption block text-muted-foreground">
                      {formatCaptured(photo.timestamp)}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block truncate font-serif text-lg",
                        assignedKey ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {assignedKey ? titleByKey[assignedKey] : "Unfiled"}
                    </span>
                  </span>
                  {assignedKey ? (
                    <Check className="w-4 h-4 shrink-0 text-rose" />
                  ) : isActive ? (
                    <span className="font-mono-caption shrink-0 text-primary">pick →</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* The stops */}
        <div>
          <p className="font-mono-caption mb-3 text-muted-foreground">
            the stops · tap to file the selected frame
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {itinerary.map((item) => {
              const key = checkpointKey(item);
              const isChosen = activeId ? assignments[activeId] === key : false;
              const used = stopUsage[key] ?? 0;

              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => fileFrame(item)}
                  disabled={!activeId}
                  whileHover={activeId ? { y: -3 } : undefined}
                  whileTap={activeId ? { scale: 0.97 } : undefined}
                  className={cn(
                    "relative rounded-xl border bg-card p-2 text-center transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isChosen ? "border-rose shadow-romantic" : "border-border hover:border-foreground/40",
                    !activeId && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "block aspect-square overflow-hidden rounded-lg border",
                      isChosen ? "border-rose/30 bg-rose/10" : "border-border bg-foreground/5"
                    )}
                  >
                    <StopFace item={item} />
                  </span>
                  <span className="font-mono-caption mt-2 block text-muted-foreground">{item.time}</span>
                  <span className="mt-0.5 block truncate font-serif text-sm text-foreground">
                    {item.title}
                  </span>
                  {used > 0 && (
                    <span className="absolute -right-2 -top-2 rounded-full bg-rose px-1.5 py-0.5 font-mono text-[10px] leading-none text-white">
                      {used}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <p className="max-w-[52ch] font-sans text-sm font-light text-muted-foreground">
          {filedCount === 0
            ? "Nothing filed yet — choose a stop for a frame to start."
            : unfiledCount > 0
            ? `${unfiledCount} ${unfiledCount === 1 ? "frame stays" : "frames stay"} on the roll for now. You can come back for them.`
            : "Every frame has a stop. Ready when you are."}
        </p>
        <button
          ref={developButtonRef}
          type="button"
          onClick={handleDevelop}
          disabled={filedCount === 0 || isDeveloping}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-5 py-3 font-sans font-medium text-primary-foreground transition-all hover:brightness-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            (filedCount === 0 || isDeveloping) && "cursor-not-allowed opacity-60"
          )}
        >
          {isDeveloping ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Developing…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Develop {filedCount > 0 ? filedCount : ""}{" "}
              {filedCount === 1 ? "frame" : "frames"}
            </>
          )}
        </button>
      </div>
    </section>
  );
};

export default DevelopFilmPanel;
