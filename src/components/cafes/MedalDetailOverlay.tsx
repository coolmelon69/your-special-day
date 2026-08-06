import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Camera,
  Heart,
  Lock,
  Map,
  PenLine,
  Sparkles,
  Star,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AchievementTierProgress } from "@/utils/cafeAchievements";
import Medal3D from "@/components/cafes/Medal3D";
import { TIER_LABEL } from "@/components/cafes/PinBadge";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Compass,
  Map,
  Star,
  PenLine,
  Camera,
  Heart,
  Sparkles,
};

/** Tier suffixes are how a track's three rungs are labelled; the track's own
 *  name is the title with that suffix taken off. */
export const trackName = (title: string): string => title.replace(/ (I|II|III)$/, "");

export interface MedalDetailOverlayProps {
  /** The full flat list, in page order, so swiping walks the whole collection. */
  achievements: AchievementTierProgress[];
  /** Index into `achievements` of the medal that was tapped, or null when closed. */
  openIndex: number | null;
  onClose: () => void;
}

const MedalDetailOverlay = ({ achievements, openIndex, onClose }: MedalDetailOverlayProps) => {
  const isOpen = openIndex !== null;
  const [emblaRef, embla] = useEmblaCarousel({
    startIndex: openIndex ?? 0,
    align: "center",
    loop: false,
    // A drag that starts on the medal belongs to the medal. Without this the
    // same gesture spins the badge and scrolls the carousel out from under it.
    watchDrag: (_, event) =>
      !(event.target as HTMLElement | null)?.closest?.("[data-medal]"),
  });
  const [current, setCurrent] = useState(openIndex ?? 0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!embla) return;
    const sync = () => setCurrent(embla.selectedScrollSnap());
    embla.on("select", sync);
    sync();
    return () => {
      embla.off("select", sync);
    };
  }, [embla]);

  // The carousel outlives any single opening, so jump it to the tapped medal
  // each time rather than relying on embla's one-shot `startIndex`.
  useEffect(() => {
    if (openIndex === null || !embla) return;
    embla.scrollTo(openIndex, true);
    setCurrent(openIndex);
  }, [openIndex, embla]);

  // Keyboard: arrows walk the collection, Escape leaves it.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") embla?.scrollPrev();
      if (event.key === "ArrowRight") embla?.scrollNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, embla, onClose]);

  // Lock the page behind the overlay so a swipe moves medals, not the grid.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  const active = achievements[current];

  // Rendered on <body>: a fullscreen fixed layer must not inherit a containing
  // block from the page's own transformed wrappers.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={active ? `${active.title} — ${TIER_LABEL[active.tier]} badge` : "Badge"}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          // No drag-to-dismiss here: a dragging parent captures the pointer and
          // would starve both the carousel swipe and the medal's own spin.
          // Escape, the backdrop, and the close button carry dismissal instead.
          className="fixed inset-0 z-50 flex flex-col bg-background/85 backdrop-blur-xl outline-none"
        >
          {/* Backdrop click target — sits behind the content, above the blur. */}
          <button
            type="button"
            aria-label="Close badge"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
            tabIndex={-1}
          />

          <div className="relative flex items-center justify-between px-5 pt-6 sm:px-8">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {current + 1} / {achievements.length}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-[10px] border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
              Close
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous badge"
              disabled={current === 0}
              className="absolute left-2 z-10 hidden rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40 md:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>

            <div className="w-full overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y">
                {achievements.map((achievement, index) => (
                  <MedalSlide
                    key={achievement.id}
                    achievement={achievement}
                    isCurrent={index === current}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next badge"
              disabled={current === achievements.length - 1}
              className="absolute right-2 z-10 hidden rounded-full border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40 md:inline-flex"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <p className="relative pb-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {active && !active.unlocked
              ? "Swipe for the rest"
              : "Drag the medal · swipe for the rest"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const MedalSlide = ({
  achievement,
  isCurrent,
}: {
  achievement: AchievementTierProgress;
  isCurrent: boolean;
}) => {
  const Icon = ICONS[achievement.icon] ?? Star;
  const locked = !achievement.unlocked;
  const pct =
    achievement.threshold === 0
      ? 0
      : Math.min(100, Math.round((achievement.current / achievement.threshold) * 100));

  return (
    <div className="min-w-0 flex-[0_0_100%] px-6">
      <div
        className={cn(
          "mx-auto flex max-w-sm flex-col items-center text-center transition-opacity duration-300",
          !isCurrent && "opacity-40"
        )}
      >
        <motion.div
          layoutId={`medal-${achievement.id}`}
          className="mb-10"
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <Medal3D
            tier={achievement.tier}
            iconKey={achievement.icon}
            Icon={Icon}
            locked={locked}
            // In the detail view every locked pin shows its casting waterline —
            // seeing how close you are is the whole reason to open it.
            isActive
            pct={pct}
            size={216}
            back={{
              track: trackName(achievement.title),
              line: locked ? `${achievement.threshold} to earn` : "Earned",
            }}
          />
        </motion.div>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {TIER_LABEL[achievement.tier]} · {trackName(achievement.title)}
        </p>
        <h2
          className={cn(
            "mt-3 font-serif text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl",
            locked && "text-muted-foreground"
          )}
        >
          {achievement.title}
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
          {achievement.description}
        </p>

        {locked ? (
          <div className="mt-7 w-full max-w-[15rem]">
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              <Lock className="h-4 w-4" aria-hidden />
              {achievement.current} / {achievement.threshold} to unlock
            </p>
            <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-7 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rose">
            <Trophy className="h-4 w-4" aria-hidden />
            Unlocked
          </p>
        )}
      </div>
    </div>
  );
};

export default MedalDetailOverlay;
