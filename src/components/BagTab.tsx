import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Gift, Package, PauseCircle, Sparkles, X } from "lucide-react";
import { qtyOf, type OwnedItem } from "@/utils/profile";
import { loadItemShop, type ItemShopConfig } from "@/utils/itemShopConfig";
import { fetchItemDetails, type ItemDetails } from "@/utils/pokeItems";
import { actionFor, loadSpicyRevealed, saveSpicyRevealed } from "@/utils/itemActions";
import type { Team } from "@/utils/trainerCard";
import ItemUsedFanfare from "./ItemUsedFanfare";
import { cn } from "@/lib/utils";

interface BagTabProps {
  items: OwnedItem[];
  team: Team;
  /** Cash in a coupon. Keyed by `OwnedItem.source`. Single-use server-side. */
  redeem: (source: string) => Promise<boolean>;
}

/** `source` is `"{time}-{title}"` for checkpoint drops (see `TimelineSection`/`StampsPage`'s
 *  `claimDrop` calls) and `"shop:{slug}"` for shop buys. Time never carries a hyphen, so the
 *  first `-` is the split point. */
const titleFromSource = (source: string): string => {
  if (source.startsWith("shop:")) return "the shop";
  const dash = source.indexOf("-");
  return dash === -1 ? source : source.slice(dash + 1);
};

/** The sheet composes itself around the sprite once the sprite has landed: the
 *  travel reads first, the reading matter arrives under it. */
const SHEET_GROUP = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};

const SHEET_ITEM: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};

/** The sprite opts out of the group's fade — its entrance is the flight itself,
 *  and a variant would override the layout animation's opacity. */
const SHEET_SPRITE = { hidden: { opacity: 1 }, show: { opacity: 1 } };

/** One spring for both ends of the trip, so out and back feel like one gesture. */
const SPRITE_TRAVEL = { type: "spring", stiffness: 240, damping: 28 } as const;

/** How long the armed "tap again to spend it" stays armed. Long enough to think,
 *  short enough that a coupon opened again later never starts half-spent. */
const CONFIRM_TIMEOUT_MS = 5000;

const BagTab = ({ items, team, redeem }: BagTabProps) => {
  const [details, setDetails] = useState<Record<string, ItemDetails>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [spicyRevealed, setSpicyRevealed] = useState(loadSpicyRevealed);
  /** Two-tap redeem. Holds the `source` that is one tap away from being spent —
   *  redeeming is irreversible, and the first tap of a coupon is easy to make by
   *  accident on a card you only meant to read. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  /** The celebration outlives the item that caused it. A successful redeem makes
   *  the parent reload the profile, which drops the spent stack out of `items`
   *  and takes `active` with it — so the fanfare carries its own copy of what to
   *  show rather than reading off a row that is on its way out. */
  const [fanfare, setFanfare] = useState<{
    spriteUrl?: string | null;
    name: string;
    action: string;
  } | null>(null);
  /** Why the last redeem didn't happen. Cleared on every new attempt. */
  const [error, setError] = useState<string | null>(null);
  /** The shelf, only for its hidden flags: an item the admin has pulled can't be
   *  redeemed either (`redeem_item`, sql/2026-08-25-shop-visibility.sql), and a
   *  button that fails on tap is worse than one that says why beforehand. */
  const [shopConfig, setShopConfig] = useState<ItemShopConfig | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** The tile that opened the sheet, so closing hands focus back to where it
   *  came from instead of dropping it on the body. */
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const openedFrom = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();

  // Spent items leave. The row survives in the database — rare-drop XP is
  // counted off it — but a used-up coupon is not a thing in your bag.
  const sorted = [...items]
    .filter((item) => qtyOf(item) > 0)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

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

  // Which items are pulled from sale. One read at mount — an admin flipping a
  // switch mid-session is caught by the server on redeem either way.
  useEffect(() => {
    let cancelled = false;
    loadItemShop().then((config) => {
      if (!cancelled && config) setShopConfig(config);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock the page behind the sheet, focus it on open — same contract as `MedalDetailOverlay`.
  useEffect(() => {
    if (openIndex === null) return;
    const previous = document.body.style.overflow;
    // Same mutable map either way — held in a local so the cleanup isn't reading
    // a ref that React may have swapped underneath it.
    const tiles = tileRefs.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    setConfirming(null);
    setError(null);
    return () => {
      document.body.style.overflow = previous;
      // Back to the tile she opened, if it's still in the bag — a redeemed one
      // isn't, and then the page keeps focus rather than chasing a ghost.
      const source = openedFrom.current;
      if (source) tiles[source]?.focus();
    };
  }, [openIndex]);

  // An armed coupon disarms itself. "Tap again to spend it" left standing is a
  // one-tap accident waiting for whoever picks the phone up next.
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(null), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  const toggleSpicy = () => {
    setSpicyRevealed((on) => {
      saveSpicyRevealed(!on);
      return !on;
    });
  };

  if (!sorted.length) {
    return (
      <div className="rounded-[26px] border border-dashed border-border bg-card p-10 text-center">
        <Package className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-sans text-sm text-muted-foreground">
          Your bag fills as the day unfolds.
        </p>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          Everything in it can be cashed in for something real.
        </p>
      </div>
    );
  }

  const active = openIndex !== null ? sorted[openIndex] : null;
  const activeDetails = active ? details[active.slug] : null;
  const activeAction = active ? actionFor(active.slug) : null;
  /** Teasing coupons stay covered until the reveal toggle is on. */
  const activeHidden = !!activeAction?.spicy && !spicyRevealed;
  /** Pulled from the shop by the admin, which also freezes the promise on it.
   *  Not gone — the coupon comes back the moment the item is shown again. */
  const activePulled = !!active && !!shopConfig?.[active.slug]?.hidden;
  /** Copies, not rows — three berries in one stack are three things to spend. */
  const toSpend = sorted.reduce((n, item) => n + qtyOf(item), 0);
  const hasSpicy = sorted.some((item) => actionFor(item.slug)?.spicy);

  const handleRedeem = async () => {
    if (!active || pending || activePulled) return;
    if (confirming !== active.source) {
      setConfirming(active.source);
      setError(null);
      return;
    }
    setPending(true);
    setError(null);
    // Snapshot before the await: `active` is derived from `items`, which the
    // parent reloads the moment the redeem lands.
    const spent = {
      spriteUrl: activeDetails?.spriteUrl,
      name: activeDetails?.name ?? active.slug,
      action: activeAction?.action ?? "",
    };
    const ok = await redeem(active.source);
    setPending(false);
    setConfirming(null);
    // The parent reloads the profile on success, which re-sorts `items` under
    // this sheet — the fanfare covers the sheet while it plays, and dismissing
    // it closes the sheet rather than leaving the index on a moved row.
    if (ok) setFanfare(spent);
    else
      setError(
        "That didn't go through — it may already have been spent on another device. Your coupon is still here; try again in a moment.",
      );
  };

  return (
    <>
      <div className="mb-1 flex items-baseline gap-3">
        <h3 className="inline-flex items-center gap-2 font-serif text-xl leading-none text-foreground">
          <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
          Bag
        </h3>
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {toSpend} to spend
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-sans text-xs leading-relaxed text-muted-foreground">
          Every item is a coupon. Open one to see what it's worth in real life.
        </p>
        {hasSpicy && (
          <button
            type="button"
            onClick={toggleSpicy}
            aria-pressed={spicyRevealed}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors",
              spicyRevealed
                ? "border-rose/50 text-rose"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {spicyRevealed ? (
              <Eye className="h-4 w-4" aria-hidden />
            ) : (
              <EyeOff className="h-4 w-4" aria-hidden />
            )}
            Teasing
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {sorted.map((item, index) => {
          const d = details[item.slug];
          const isRare = item.rarity === "rare";
          const held = qtyOf(item);
          return (
            <motion.button
              // A spent stack leaves the bag, so `source` is unique among what's
              // left. `at` is belt and braces against a stale render mid-redeem.
              key={`${item.source}-${item.at ?? index}`}
              ref={(node) => {
                tileRefs.current[item.source] = node;
              }}
              type="button"
              onClick={() => {
                openedFrom.current = item.source;
                setOpenIndex(index);
              }}
              aria-label={`${d?.name.replace(/-/g, " ") ?? item.slug}, ${item.rarity}${held > 1 ? `, ${held} of them` : ""}`}
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl border bg-card p-3 outline-none ring-offset-4 ring-offset-background transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
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
                /* Paired with the sheet's sprite by `layoutId`: opening an item
                   flies this one to the centre of the screen, closing flies it
                   home. Only one of the pair is ever the lead. */
                <motion.img
                  layoutId={reduceMotion ? undefined : `bag-sprite-${item.source}`}
                  transition={SPRITE_TRAVEL}
                  src={d.spriteUrl}
                  alt=""
                  className="relative h-10 w-10"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div className="relative h-10 w-10 animate-pulse rounded-md bg-muted" aria-hidden />
              )}
              <p className="relative line-clamp-1 font-mono text-[10px] capitalize tracking-wide text-foreground">
                {d?.name.replace(/-/g, " ") ?? item.slug.replace(/-/g, " ")}
              </p>
              {/* Stack count. Rare drops never stack, so this and the sparkle
                  can't want the same corner. */}
              {held > 1 && (
                <span className="absolute right-1.5 top-1.5 rounded-full border border-rose/40 bg-card px-1.5 font-mono text-[10px] tabular-nums text-rose">
                  ×{held}
                </span>
              )}
              {isRare && (
                <Sparkles
                  className="absolute right-1.5 top-1.5 h-4 w-4"
                  style={{ color: team.accent }}
                  aria-hidden
                />
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
              /* The container itself never fades — the sprite flying in from its
                 tile has to stay solid the whole way across. Only the ground it
                 lands on does. Exit is held long enough for the return trip. */
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 flex select-none flex-col outline-none"
            >
              <motion.div
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 bg-background"
              />

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

              <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-4">
                <motion.div
                  className="mx-auto flex max-w-sm flex-col items-center text-center"
                  variants={SHEET_GROUP}
                  initial={reduceMotion ? false : "hidden"}
                  animate="show"
                >
                  {active.rarity === "rare" && (
                    <motion.p
                      variants={SHEET_ITEM}
                      className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rose"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden />
                      Rare
                    </motion.p>
                  )}
                  {activeDetails?.spriteUrl ? (
                    /* The same sprite element as the tile in the grid — Framer
                       matches them by `layoutId` and flies it across, so the
                       sheet reads as this item opening rather than a panel
                       appearing over it. */
                    <motion.img
                      layoutId={reduceMotion ? undefined : `bag-sprite-${active.source}`}
                      variants={SHEET_SPRITE}
                      transition={SPRITE_TRAVEL}
                      src={activeDetails.spriteUrl}
                      alt=""
                      className="mt-4 h-32 w-32"
                      style={{ imageRendering: "pixelated" }}
                    />
                  ) : (
                    <div className="mt-4 h-32 w-32 animate-pulse rounded-lg bg-muted" aria-hidden />
                  )}
                  <motion.h2
                    variants={SHEET_ITEM}
                    className="mt-4 font-serif text-3xl font-bold capitalize leading-[1.05] tracking-tight sm:text-4xl"
                  >
                    {(activeDetails?.name ?? active.slug).replace(/-/g, " ")}
                  </motion.h2>
                  {qtyOf(active) > 1 && (
                    <motion.p
                      variants={SHEET_ITEM}
                      className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rose"
                    >
                      <Package className="h-4 w-4" aria-hidden />
                      {qtyOf(active)} in your bag
                    </motion.p>
                  )}
                  {activeDetails?.flavorText && (
                    <motion.p
                      variants={SHEET_ITEM}
                      className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground"
                    >
                      {activeDetails.flavorText}
                    </motion.p>
                  )}

                  {/* The real-life half. Set apart from the PokéAPI text above it
                      because it's the part that costs somebody something. */}
                  {activeAction && (
                    <motion.div
                      variants={SHEET_ITEM}
                      className="mt-6 w-full rounded-2xl border border-rose/30 bg-rose-light/40 px-5 py-4"
                    >
                      <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-rose">
                        <Gift className="h-4 w-4" aria-hidden />
                        Redeem for
                      </p>
                      {activeHidden ? (
                        <button
                          type="button"
                          onClick={toggleSpicy}
                          className="mt-2 inline-flex items-center gap-2 font-sans text-sm italic text-muted-foreground underline decoration-dotted underline-offset-4"
                        >
                          <EyeOff className="h-4 w-4" aria-hidden />
                          Teasing — tap to reveal
                        </button>
                      ) : (
                        <p className="mt-2 font-serif text-lg leading-snug text-foreground">
                          {activeAction.action}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Pulled by the admin. The promise above stays readable — she
                      still owns this — but there is no button, because tapping
                      one that the server will refuse teaches nothing. */}
                  {activeAction && !activeHidden && activePulled && (
                    <motion.div variants={SHEET_ITEM} className="flex flex-col items-center">
                      <p className="mt-5 inline-flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left font-sans text-xs leading-relaxed text-muted-foreground">
                        <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        On hold — this one's been taken off the shop for now. It stays in your bag,
                        and you can spend it once it's back.
                      </p>
                    </motion.div>
                  )}

                  {activeAction && !activeHidden && !activePulled && (
                    <motion.div variants={SHEET_ITEM} className="flex flex-col items-center">
                      <motion.button
                        type="button"
                        onClick={handleRedeem}
                        disabled={pending}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                        className={cn(
                          "mt-5 inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-mono text-xs uppercase tracking-wide transition-colors disabled:opacity-60",
                          confirming === active.source
                            ? "border-rose bg-rose text-white"
                            : "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        <Gift className="h-4 w-4" aria-hidden />
                        {pending
                          ? "Redeeming…"
                          : confirming === active.source
                            ? "Tap again to spend it"
                            : "Redeem"}
                      </motion.button>
                      <p className="mt-2 font-sans text-xs text-muted-foreground">
                        {confirming === active.source
                          ? "This can't be undone."
                          : qtyOf(active) > 1
                            ? `Uses one up. ${qtyOf(active) - 1} would be left.`
                            : "Redeeming uses it up. It leaves your bag."}
                      </p>

                      {/* A redeem that fails used to say nothing at all — the
                          button simply disarmed itself and the coupon stayed
                          put, which looks identical to having spent it. */}
                      {error && (
                        <p
                          role="alert"
                          className="mt-3 inline-flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-left font-sans text-xs leading-relaxed text-destructive"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          {error}
                        </p>
                      )}
                    </motion.div>
                  )}

                  <motion.p
                    variants={SHEET_ITEM}
                    className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    From {titleFromSource(active.source)}
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <AnimatePresence>
        {fanfare && (
          <ItemUsedFanfare
            key="item-used"
            spriteUrl={fanfare.spriteUrl}
            name={fanfare.name}
            action={fanfare.action}
            team={team}
            onDone={() => {
              setFanfare(null);
              setOpenIndex(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default BagTab;
