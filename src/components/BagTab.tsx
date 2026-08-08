import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Package, Sparkles, X } from "lucide-react";
import type { OwnedItem } from "@/utils/profile";
import { fetchItemDetails, type ItemDetails } from "@/utils/pokeItems";
import type { Team } from "@/utils/trainerCard";
import { cn } from "@/lib/utils";

interface BagTabProps {
  items: OwnedItem[];
  team: Team;
}

/** `source` is `"{time}-{title}"` for checkpoint drops (see `TimelineSection`/`StampsPage`'s
 *  `claimDrop` calls) and `"shop:{slug}"` for shop buys. Time never carries a hyphen, so the
 *  first `-` is the split point. */
const titleFromSource = (source: string): string => {
  if (source.startsWith("shop:")) return "the shop";
  const dash = source.indexOf("-");
  return dash === -1 ? source : source.slice(dash + 1);
};

const BagTab = ({ items, team }: BagTabProps) => {
  const [details, setDetails] = useState<Record<string, ItemDetails>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const sorted = [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  // Fetch sprite/flavour text for every distinct slug in the bag once, cached in
  // `pokeItems.ts` already — this effect just keeps the component's own state in sync.
  useEffect(() => {
    const slugs = [...new Set(sorted.map((item) => item.slug))];
    const missing = slugs.filter((slug) => !details[slug]);
    if (!missing.length) return;

    let cancelled = false;
    Promise.all(missing.map((slug) => fetchItemDetails(slug).then((d) => [slug, d] as const))).then(
      (entries) => {
        if (cancelled) return;
        setDetails((prev) => {
          const next = { ...prev };
          for (const [slug, d] of entries) next[slug] = d;
          return next;
        });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Lock the page behind the sheet, focus it on open — same contract as `MedalDetailOverlay`.
  useEffect(() => {
    if (openIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [openIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  if (!sorted.length) {
    return (
      <div className="rounded-[26px] border border-dashed border-border bg-card p-10 text-center">
        <Package className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-sans text-sm text-muted-foreground">
          Your bag fills as the day unfolds.
        </p>
      </div>
    );
  }

  const active = openIndex !== null ? sorted[openIndex] : null;
  const activeDetails = active ? details[active.slug] : null;
  const rareCount = sorted.filter((item) => item.rarity === "rare").length;

  return (
    <>
      <div className="mb-4 flex items-baseline gap-3">
        <h3 className="inline-flex items-center gap-2 font-serif text-xl leading-none text-foreground">
          <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
          Bag
        </h3>
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "item" : "items"}
          {rareCount > 0 && <span className="text-rose"> · {rareCount} rare</span>}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {sorted.map((item, index) => {
          const d = details[item.slug];
          const isRare = item.rarity === "rare";
          return (
            <motion.button
              key={`${item.source}-${item.slug}`}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`${d?.name.replace(/-/g, " ") ?? item.slug}, ${item.rarity}`}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 outline-none ring-offset-4 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                isRare ? "border-transparent" : "border-border",
              )}
              style={
                isRare
                  ? {
                      boxShadow: `0 0 0 1.5px ${team.accent}, 0 4px 14px -6px rgba(${team.glow} / 0.5)`,
                    }
                  : undefined
              }
            >
              {isRare && (
                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-70",
                    !reduceMotion && "animate-pulse",
                  )}
                  aria-hidden
                />
              )}
              {d?.spriteUrl ? (
                <img
                  src={d.spriteUrl}
                  alt=""
                  className="relative h-10 w-10"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="relative h-10 w-10 rounded-md bg-muted" aria-hidden />
              )}
              <p className="relative line-clamp-1 font-mono text-[10px] capitalize tracking-wide text-foreground">
                {d?.name.replace(/-/g, " ") ?? item.slug.replace(/-/g, " ")}
              </p>
              {isRare && (
                <Sparkles className="absolute right-1.5 top-1.5 h-4 w-4" style={{ color: team.accent }} aria-hidden />
              )}
            </motion.button>
          );
        })}
      </div>

      {createPortal(
        <AnimatePresence>
          {active && (
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={activeDetails?.name ?? active.slug}
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex select-none flex-col bg-background outline-none"
            >
              <button
                type="button"
                aria-label="Close item"
                onClick={() => setOpenIndex(null)}
                className="absolute inset-0 cursor-default"
                tabIndex={-1}
              />

              <div className="relative flex items-center justify-end px-5 pt-6 sm:px-8">
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Close
                </button>
              </div>

              <div className="relative flex min-h-0 flex-1 items-center justify-center px-6">
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                  {active.rarity === "rare" && (
                    <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rose">
                      <Sparkles className="h-4 w-4" aria-hidden />
                      Rare
                    </p>
                  )}
                  {activeDetails?.spriteUrl ? (
                    <img
                      src={activeDetails.spriteUrl}
                      alt=""
                      className="mt-4 h-32 w-32"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <div className="mt-4 h-32 w-32 rounded-lg bg-muted" aria-hidden />
                  )}
                  <h2 className="mt-4 font-serif text-3xl font-bold capitalize leading-[1.05] tracking-tight sm:text-4xl">
                    {(activeDetails?.name ?? active.slug).replace(/-/g, " ")}
                  </h2>
                  {activeDetails?.flavorText && (
                    <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
                      {activeDetails.flavorText}
                    </p>
                  )}
                  <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    From {titleFromSource(active.source)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default BagTab;
