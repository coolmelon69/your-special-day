import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Image as ImageIcon,
  Lock,
  Package,
  PackageX,
  RotateCcw,
  Sparkles,
  Sticker as StickerIcon,
  Store,
} from "lucide-react";
import { SHOP_CATALOGUE, isOwned, skuById, type ShopCategory, type ShopSku } from "@/utils/shop";
import {
  ITEM_SHOP_POOL,
  PAGE_SIZES,
  SHELF_ORDER,
  TIER_MIN_LEVEL,
  itemSourceFor,
  pagesOf,
  tierOf,
  type ItemSku,
  type ShelfTier,
} from "@/utils/itemShop";
import { actionFor, loadSpicyRevealed } from "@/utils/itemActions";
import { loadItemShop, type ItemShopConfig } from "@/utils/itemShopConfig";
import { fetchItemDetails, type ItemDetails } from "@/utils/pokeItems";
import { qtyOf, type BuyItemResult, type OwnedItem } from "@/utils/profile";
import PokeCoin from "@/components/PokeCoin";
import CosmeticPreview from "@/components/ShopPreview";
import ShopDetailDialog, { type OriginRect } from "@/components/ShopDetailDialog";
import { cn } from "@/lib/utils";

/** The three price shelves, in the words the shop uses for them. */
const TIER_LABEL: Record<ShelfTier, string> = {
  pocket: "Pocket money",
  saving: "Worth saving for",
  prime: "The good stuff",
};

/** What to say when a purchase doesn't happen. Three failures, three different
 *  next moves — "check your balance" is wrong advice for two of them. */
const BUY_MESSAGE: Record<Exclude<BuyItemResult, "ok">, string> = {
  refused: "That didn't go through — check your balance, or the last one may have just sold out.",
  "unknown-item":
    "The shop knows this one but the database doesn't yet. Run the latest file in sql/ and try again.",
  error: "Couldn't reach the shop just now. Try again in a moment.",
};

/** Radial plinth the sprite stands on — the tint is the only rarity signal. */
const TIER_PLINTH: Record<ShelfTier, string> = {
  pocket: "radial-gradient(ellipse at 50% 68%, hsl(var(--muted)) 0%, transparent 68%)",
  saving: "radial-gradient(ellipse at 50% 68%, hsl(var(--primary-light)) 0%, transparent 68%)",
  prime: "radial-gradient(ellipse at 50% 68%, hsl(var(--rose-light)) 0%, transparent 68%)",
};

const TIER_PRICE: Record<ShelfTier, string> = {
  pocket: "text-muted-foreground",
  saving: "text-primary",
  prime: "text-rose",
};

interface ShopTabProps {
  coins: number;
  purchases: string[];
  purchase: (sku: string) => Promise<boolean>;
  /** The bag. Items stack, so this only decides what the tiles say they're
   *  holding — it never stops a purchase. */
  items: OwnedItem[];
  purchaseItem: (slug: string, qty?: number) => Promise<BuyItemResult>;
  /** 1-based trainer level from `computeTrainerStats`, which gates the shelves. */
  level: number;
  /** Current XP, for the "how far off am I" bar over a locked shelf. */
  xp: number;
  /** Every level tier, sorted by `minXp` — names the gate and sets its distance. */
  tiers: { name: string; minXp: number }[];
}

/** Category order, label and icon — coupons are deliberately absent, they're
 *  priced in admin and aren't part of the SQL catalogue this tab can sell. */
type SellableCategory = Exclude<ShopCategory, "coupon">;

const CATEGORY_LABELS: Record<SellableCategory, string> = {
  card: "Trainer Card",
  sticker: "Stickers",
  filter: "Photo Filters",
};

const CATEGORY_ICONS: Record<SellableCategory, typeof IdCard> = {
  card: IdCard,
  sticker: StickerIcon,
  filter: ImageIcon,
};

/** One line per section saying what the group is actually for — the names alone
 *  don't tell you where a filter shows up. */
const CATEGORY_NOTES: Record<SellableCategory, string> = {
  card: "Worn on your trainer card, next tab over.",
  sticker: "Waiting in the picker every time the camera opens.",
  filter: "Applied when you edit a photo.",
};

const CATEGORY_ORDER: SellableCategory[] = ["card", "sticker", "filter"];

const SELLABLE_CATALOGUE = SHOP_CATALOGUE.filter((sku) => sku.category !== "coupon");

/** What the detail dialog is currently showing. One dialog serves both shelves. */
type Selection =
  /** `origin` is where the tapped tile was, so the card can grow out of it. */
  | { kind: "item"; slug: string; origin: OriginRect }
  | { kind: "sku"; id: string };

/** Sprite on its tinted plinth, at whatever size the surface needs. Sprites are
 *  32px native, so both sizes here are exact multiples — no blur. Declared at
 *  module scope on purpose: nested inside ShopTab it would be a fresh component
 *  type on every render, remounting the image and re-flashing the sprite. */
const SpritePlinth = ({
  item,
  detail,
  size,
  spent,
}: {
  item: ItemSku;
  detail: ItemDetails | undefined;
  size: 64 | 96;
  /** Sold out. The colour drains out of the sprite — an empty shelf reads
   *  faster as a grey item than as a word underneath a bright one. */
  spent?: boolean;
}) => {
  const sprite = size === 96 ? 64 : 48;
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-xl"
      style={{
        height: size,
        width: size,
        backgroundImage: spent ? undefined : TIER_PLINTH[tierOf(item.price)],
      }}
    >
      {detail?.spriteUrl ? (
        <img
          src={detail.spriteUrl}
          alt=""
          className={cn(
            "transition-transform duration-300 ease-out group-hover:-translate-y-1",
            spent && "opacity-70 grayscale",
          )}
          style={{ height: sprite, width: sprite, imageRendering: "pixelated" }}
        />
      ) : (
        <div
          className="animate-pulse rounded-md bg-muted"
          style={{ height: sprite, width: sprite }}
          aria-hidden
        />
      )}
    </div>
  );
};

/**
 * True from Tailwind's `sm` up — the one breakpoint the shop grid changes shape
 * at, so the page size can follow it.
 *
 * ponytail: `matchMedia` rather than measuring the element. The grid has exactly
 * two shapes and both are driven by the same breakpoint Tailwind uses, so a
 * media query is the same source of truth the CSS is already reading. Upgrade
 * path if the window ever lives somewhere narrower than the viewport: a
 * ResizeObserver on the shelf surface.
 */
const WIDE_QUERY = "(min-width: 640px)";
const useWide = () =>
  useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(WIDE_QUERY);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );

const ShopTab = ({
  coins,
  purchases,
  purchase,
  items,
  purchaseItem,
  level,
  xp,
  tiers,
}: ShopTabProps) => {
  const reduceMotion = useReducedMotion();
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ItemDetails>>({});
  /** Slug or sku id whose purchase sweep is currently playing. */
  const [justBought, setJustBought] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  /** Open state is separate from *what* is open, and `selected` is deliberately
   *  not cleared on close: the card has to stay mounted long enough to fly back
   *  into the tile it came out of. The next tap overwrites it. */
  const [detailOpen, setDetailOpen] = useState(false);
  const show = (next: Selection) => {
    setSelected(next);
    setDetailOpen(true);
  };
  /** Read once at mount, never written here — the Bag tab owns the switch, the
   *  shop only obeys it. Flipping it there and coming back re-mounts this tab. */
  const [spicyRevealed] = useState(loadSpicyRevealed);
  const [page, setPage] = useState(0);
  /** Admin-set prices, stock and promise overrides. Null until the first load
   *  answers, and null forever on a database that hasn't run
   *  sql/2026-08-16-item-shop-config.sql — both fall back to the prices compiled
   *  into `itemShop.ts`, which is what the shop showed before it was editable. */
  const [shopConfig, setShopConfig] = useState<ItemShopConfig | null>(null);
  /** Which way the last turn went, so the outgoing page leaves the way the
   *  incoming one arrives. Stored rather than derived — by the time the exit
   *  animation runs, `page` is already the new one. */
  const [direction, setDirection] = useState(1);

  const wide = useWide();
  const perPage = wide ? PAGE_SIZES.wide : PAGE_SIZES.compact;

  /** The catalogue at today's prices, minus anything the admin has pulled.
   *  Hidden isn't sold out: a pulled item leaves no gap and says nothing, it
   *  simply isn't in the shop. Prices re-sort the shelves and move the gates. */
  const pool = useMemo(
    () =>
      shopConfig
        ? ITEM_SHOP_POOL.filter((item) => !shopConfig[item.slug]?.hidden).map((item) => ({
            ...item,
            price: shopConfig[item.slug]?.price ?? item.price,
          }))
        : ITEM_SHOP_POOL,
    [shopConfig],
  );
  const pages = useMemo(() => pagesOf(perPage, pool), [perPage, pool]);

  /** How many the shop has left to sell. `null` is unlimited, which is every
   *  item until an admin says otherwise. */
  const supplyOf = (slug: string): number | null => shopConfig?.[slug]?.stock ?? null;
  const isSoldOut = (slug: string) => supplyOf(slug) === 0;
  /** The admin's promise for this item, or the one written in `itemActions.ts`. */
  const promiseFor = (slug: string) => shopConfig?.[slug]?.action?.trim() || actionFor(slug)?.action || null;
  // Rotating the phone changes how many pages there are. Clamp rather than
  // remap: four pages become three, and landing on the last one is close enough
  // to where she was that hunting for the exact tile isn't worth the state.
  useEffect(() => {
    setPage((p) => Math.min(p, pages.length - 1));
  }, [pages.length]);

  const turn = (delta: number) => {
    const next = page + delta;
    if (next < 0 || next >= pages.length) return;
    setDirection(delta);
    setPage(next);
  };

  const allOwned = SELLABLE_CATALOGUE.every((sku) => isOwned(purchases, sku.id));

  /** How many of each source are sitting unspent in the bag. Buying more is
   *  always allowed — this only decides what the tile says she's holding. */
  const stock = new Map(items.map((i) => [i.source, qtyOf(i)] as const));
  const stockOf = (slug: string) => stock.get(itemSourceFor(slug)) ?? 0;

  // Sprites and names for the whole catalogue. One pass at mount: `fetchItemDetails`
  // caches by slug, and only unlocked shelves are rendered, but locked items still
  // need their name for the "unlocks at" copy.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ITEM_SHOP_POOL.map((item) => fetchItemDetails(item.slug).then((d) => [item.slug, d] as const)),
    ).then((entries) => {
      if (cancelled) return;
      setDetails(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Prices, stock and promise overrides. One read at mount, then again after
  // every item bought — a purchase takes one off the shelf, and the count on the
  // tile has to be the one the next buyer is actually racing for.
  useEffect(() => {
    let cancelled = false;
    loadItemShop().then((config) => {
      if (!cancelled && config) setShopConfig(config);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshShopConfig = () => {
    loadItemShop().then((config) => config && setShopConfig(config));
  };

  const celebrate = (id: string) => {
    setJustBought(id);
    window.setTimeout(() => setJustBought((s) => (s === id ? null : s)), 800);
  };

  const handleBuy = async (skuId: string) => {
    if (pendingSku) return;
    setPendingSku(skuId);
    setMessage(null);
    try {
      const bought = await purchase(skuId);
      if (!bought) {
        setMessage("That didn't go through — check your balance, or you may already own it.");
      } else {
        celebrate(skuId);
      }
    } finally {
      setPendingSku(null);
    }
  };

  const handleBuyItem = async (slug: string, qty: number) => {
    if (pendingSku) return;
    setPendingSku(slug);
    setMessage(null);
    try {
      const result = await purchaseItem(slug, qty);
      if (result === "ok") celebrate(slug);
      else setMessage(BUY_MESSAGE[result]);
      // Either way the shelf may have moved: the buy took stock off it, and a
      // refusal is often the reason to look at what's left.
      refreshShopConfig();
    } finally {
      setPendingSku(null);
    }
  };

  const itemName = (item: ItemSku) =>
    (details[item.slug]?.name ?? item.slug).replace(/-/g, " ");

  // What the dialog reads. Derived rather than stored, so a purchase completing
  // while it's open flips it to the owned state without a second source of truth.
  const openItem: ItemSku | undefined =
    selected?.kind === "item" ? pool.find((i) => i.slug === selected.slug) : undefined;
  const openSku: ShopSku | undefined =
    selected?.kind === "sku" ? skuById(selected.id) : undefined;

  // What the visible page is. A page runs through the price order and can
  // straddle two shelves, so the header names every shelf on it and the gate is
  // decided per tile.
  const pageItems = pages[page] ?? pages[pages.length - 1] ?? [];
  const isLocked = (item: ItemSku) => level < TIER_MIN_LEVEL[tierOf(item.price)];
  const pageTiers = SHELF_ORDER.filter((tier) =>
    pageItems.some((item) => tierOf(item.price) === tier),
  );
  const pageLabel = pageTiers.map((tier) => TIER_LABEL[tier]).join(" · ") || "The shelves";
  /** Every item pulled. Rare, and the honest thing to say is that the shelves
   *  are bare — not to leave a grid-shaped hole where they were. */
  const shelvesBare = pool.length === 0;
  /** The nearest shelf on this page she hasn't reached — SHELF_ORDER is cheapest
   *  first, so the first locked one is also the soonest to open. */
  const gateTier = pageTiers.find((tier) => level < TIER_MIN_LEVEL[tier]);
  const allLocked = !!gateTier && pageItems.every(isLocked);
  const pageMinLevel = gateTier ? TIER_MIN_LEVEL[gateTier] : 0;
  const pageGate = tiers[pageMinLevel - 1];
  const pageGateName = pageGate?.name ?? `level ${pageMinLevel}`;
  const pageGateXp = pageGate?.minXp ?? 0;
  const pageProgress = pageGateXp > 0 ? Math.min(1, Math.max(0, xp / pageGateXp)) : 1;
  const currentName = tiers[level - 1]?.name ?? `level ${level}`;

  // The open item's shelf gate, so the dialog can say what opens it.
  const openGateLevel = openItem ? TIER_MIN_LEVEL[tierOf(openItem.price)] : 0;
  const openLocked = !!openItem && level < openGateLevel;
  const openGateName = tiers[openGateLevel - 1]?.name ?? `level ${openGateLevel}`;

  return (
    <div className="space-y-10">
      {message && (
        <p
          role="status"
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-center font-sans text-sm text-muted-foreground"
        >
          {message}
        </p>
      )}

      {/* The Mart counter. One window for the whole catalogue: the arrows walk
          the shelves rather than the page growing to hold them. */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Item shop"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") turn(-1);
          if (event.key === "ArrowRight") turn(1);
        }}
        className="overflow-hidden rounded-[26px] border border-border bg-card shadow-[0_18px_40px_-24px_hsl(270_35%_35%_/_0.4)]"
      >
        {/* Awning. The one flourish that says "shop" before a word is read. */}
        <div
          aria-hidden
          className="h-3.5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, hsl(var(--rose)) 0 11px, hsl(var(--rose-light)) 11px 22px)",
          }}
        />

        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="inline-flex min-w-0 items-center gap-2 font-serif text-lg leading-none text-foreground">
            {allLocked ? (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <Store className="h-4 w-4 shrink-0 text-rose" aria-hidden />
            )}
            <span className="truncate">{pageLabel}</span>
          </h3>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 font-mono text-sm text-rose"
            aria-label={`${coins} coins`}
          >
            <PokeCoin size={18} />
            {coins}
          </span>
        </div>

        {/* Gate progress. Only while something on the visible page is behind a
            level — it answers the question the dimmed tiles just raised. */}
        {gateTier && (
          <div className="border-b border-border bg-accent/60 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {TIER_LABEL[gateTier]} opens at <span className="text-rose">{pageGateName}</span> ·
              you're {currentName}
            </p>
            <div
              className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={pageGateXp}
              aria-valuenow={Math.min(xp, pageGateXp)}
              aria-label={`Progress to ${pageGateName}`}
            >
              <motion.span
                className="block h-full rounded-full bg-rose"
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: pageProgress }}
                style={{ transformOrigin: "left" }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                }
              />
            </div>
            <p className="mt-1.5 font-mono text-[10px] tracking-wide text-muted-foreground">
              {Math.min(xp, pageGateXp)} / {pageGateXp} XP
            </p>
          </div>
        )}

        {/* Shelf surface. Recessed against the frame so the tiles read as goods
            sitting on it, rather than cards inside a card. */}
        {/* The swipe lives on the surface, not on the page inside it: `drag` owns
            the element's `x`, so a page that both dragged and animated `x` never
            landed back at 0 and sat one offset off-centre for good. */}
        <motion.div
          layout
          drag={reduceMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) turn(1);
            else if (info.offset.x > 60) turn(-1);
          }}
          className="relative bg-accent/40 px-3 py-3"
        >
          {shelvesBare ? (
            <div className="px-4 py-12 text-center">
              <PackageX className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-sans text-sm text-muted-foreground">
                The shelves are bare right now. Come back — the Mart restocks.
              </p>
            </div>
          ) : (
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={page}
              custom={direction}
              initial={reduceMotion ? false : { opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -40 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.34, ease: [0.16, 1, 0.3, 1] }
              }
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5"
            >
              {pageItems.map((item) => {
                const held = stockOf(item.slug);
                const tier = tierOf(item.price);
                const locked = isLocked(item);
                const soldOut = isSoldOut(item.slug);
                const left = supplyOf(item.slug);
                const gateName = tiers[TIER_MIN_LEVEL[tier] - 1]?.name ?? `level ${TIER_MIN_LEVEL[tier]}`;
                const affordable = !locked && coins >= item.price;
                const name = itemName(item);
                return (
                  <motion.button
                    key={item.slug}
                    type="button"
                    onClick={(event) => {
                      const { left, top, width, height } =
                        event.currentTarget.getBoundingClientRect();
                      show({ kind: "item", slug: item.slug, origin: { left, top, width, height } });
                    }}
                    animate={{ opacity: locked || soldOut ? 0.6 : 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    aria-label={`${name}, ${item.price} coins${
                      locked
                        ? `, locked until ${gateName}`
                        : soldOut
                          ? ", sold out"
                          : held
                            ? `, ${held} in your bag`
                            : ""
                    } — open details`}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border bg-card p-2 text-left transition-shadow",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      locked
                        ? "border-dashed border-border"
                        : soldOut
                          ? "border-border"
                          : held
                            ? "border-rose/40"
                            : "border-border hover:shadow-[0_8px_18px_-12px_hsl(var(--lilac))]",
                    )}
                  >
                    {/* Purchase sweep — plays once, then the tile settles into "in bag". */}
                    {justBought === item.slug && !reduceMotion && (
                      <motion.span
                        aria-hidden
                        initial={{ x: "-120%" }}
                        animate={{ x: "120%" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 bg-gradient-to-r from-transparent via-rose-light to-transparent"
                      />
                    )}

                    <div className="mx-auto">
                      <SpritePlinth
                        item={item}
                        detail={details[item.slug]}
                        size={64}
                        spent={soldOut}
                      />
                    </div>

                    {/* Name and price only. Three tiles across a phone leaves no
                        room for the coupon line — it leads the dialog instead,
                        which is where the decision actually gets made. */}
                    <p className="mt-1 line-clamp-2 min-h-[2.1em] text-center font-sans text-[11px] font-semibold capitalize leading-snug text-foreground">
                      {name}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-border pt-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 font-mono text-[10px]",
                          locked || soldOut ? "text-muted-foreground" : TIER_PRICE[tier],
                          soldOut && "line-through",
                        )}
                      >
                        <PokeCoin size={12} />
                        {item.price}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-tight",
                          locked || soldOut
                            ? "text-muted-foreground"
                            : held
                              ? "text-rose"
                              : affordable
                                ? "text-primary"
                                : "text-muted-foreground",
                        )}
                      >
                        {locked ? (
                          <>
                            <Lock className="h-4 w-4" aria-hidden />
                            {gateName}
                          </>
                        ) : soldOut ? (
                          <>
                            <PackageX className="h-4 w-4" aria-hidden />
                            Sold out
                          </>
                        ) : held ? (
                          <>
                            <Package className="h-4 w-4" aria-hidden />×{held}
                          </>
                        ) : !affordable ? (
                          `${item.price - coins} more`
                        ) : left !== null && left <= 3 ? (
                          // Only when it's nearly gone. A count on every tile is
                          // noise; a count on the last three is a reason to hurry.
                          `${left} left`
                        ) : (
                          "View"
                        )}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
          )}
        </motion.div>

        {/* Counter controls. Gone when there is nothing to page through — one
            page, or none at all. */}
        {pages.length > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
          <button
            type="button"
            onClick={() => turn(-1)}
            disabled={page === 0}
            aria-label="Previous page"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border text-foreground transition-colors hover:border-rose hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground/40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          <div className="flex items-center gap-1.5" aria-hidden>
            {pages.map((p, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => {
                  setDirection(i > page ? 1 : -1);
                  setPage(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === page ? "w-5 bg-rose" : "w-1.5 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => turn(1)}
            disabled={page >= pages.length - 1}
            aria-label="Next page"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border text-foreground transition-colors hover:border-rose hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground/40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {shelvesBare
          ? "The shelves are empty."
          : `${pageLabel}, page ${page + 1} of ${pages.length}`}
      </p>

      {allOwned && (
        <div className="rounded-[26px] border border-dashed border-border bg-card p-10 text-center">
          <Store className="mx-auto h-4 w-4 text-rose" aria-hidden />
          <p className="mt-3 font-sans text-sm text-muted-foreground">
            You've got every cosmetic the shop has. She's fully decked out.
          </p>
        </div>
      )}

      {!allOwned &&
        CATEGORY_ORDER.map((category) => {
          const skus = SELLABLE_CATALOGUE.filter((sku) => sku.category === category);
          if (!skus.length) return null;
          const Icon = CATEGORY_ICONS[category];
          const ownedCount = skus.filter((sku) => isOwned(purchases, sku.id)).length;

          return (
            <section key={category}>
              {/* Section head: name, a rule that carries the eye across, and how
                  far through the group she already is. */}
              <div className="flex items-center gap-3">
                <h3 className="inline-flex items-center gap-2 font-serif text-xl leading-none text-foreground">
                  <Icon className="h-4 w-4 text-rose" aria-hidden />
                  {CATEGORY_LABELS[category]}
                </h3>
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {ownedCount}/{skus.length} owned
                </span>
              </div>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-muted-foreground">
                {CATEGORY_NOTES[category]}
              </p>

              <div className="mt-4 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3">
                {skus.map((sku, index) => {
                  const owned = isOwned(purchases, sku.id);
                  const affordable = coins >= sku.price;

                  return (
                    <motion.button
                      key={sku.id}
                      type="button"
                      onClick={() => show({ kind: "sku", id: sku.id })}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: owned ? 0.78 : 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.45, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }
                      }
                      whileHover={reduceMotion ? undefined : { y: -3 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                      aria-label={`${sku.name}, ${sku.price} coins${owned ? ", owned" : ""} — open details`}
                      className={cn(
                        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-left transition-shadow",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        owned
                          ? "border-rose/40"
                          : "border-border hover:shadow-[0_10px_24px_-14px_hsl(var(--lilac))]",
                      )}
                    >
                      {justBought === sku.id && !reduceMotion && (
                        <motion.span
                          aria-hidden
                          initial={{ x: "-120%" }}
                          animate={{ x: "120%" }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 bg-gradient-to-r from-transparent via-rose-light to-transparent"
                        />
                      )}

                      {/* The swatch is the point: it shows the actual effect,
                          not an icon standing in for it. */}
                      <div className="h-24 border-b border-border p-2 transition-transform duration-300 ease-out group-hover:scale-[1.03]">
                        <CosmeticPreview skuId={sku.id} />
                      </div>

                      <div className="flex flex-1 flex-col p-3">
                        <p className="flex items-start gap-1.5 font-sans text-sm font-semibold leading-snug text-foreground">
                          {sku.name}
                          {owned && <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-rose" aria-hidden />}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 font-mono text-xs",
                              owned ? "text-muted-foreground" : "text-rose",
                            )}
                          >
                            <PokeCoin size={16} />
                            {sku.price}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-wide",
                              owned
                                ? "text-rose"
                                : affordable
                                  ? "text-primary"
                                  : "text-muted-foreground",
                            )}
                          >
                            {owned ? (
                              <Check className="h-4 w-4" aria-hidden />
                            ) : affordable ? (
                              "View"
                            ) : (
                              `${sku.price - coins} more`
                            )}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          );
        })}

      {openItem && (
        <ShopDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          visual={
            <SpritePlinth
              item={openItem}
              detail={details[openItem.slug]}
              size={96}
              spent={isSoldOut(openItem.slug)}
            />
          }
          title={itemName(openItem)}
          kicker={TIER_LABEL[tierOf(openItem.price)]}
          description={details[openItem.slug]?.flavorText ?? null}
          realAction={promiseFor(openItem.slug)}
          realActionHidden={!!actionFor(openItem.slug)?.spicy && !spicyRevealed}
          price={openItem.price}
          coins={coins}
          owned={false}
          ownedLabel="In bag"
          stock={stockOf(openItem.slug)}
          remaining={supplyOf(openItem.slug)}
          stackable
          locked={openLocked}
          lockedLabel={openGateName}
          pending={pendingSku === openItem.slug}
          onBuy={(qty) => handleBuyItem(openItem.slug, qty)}
          origin={selected?.kind === "item" ? selected.origin : null}
          burst
        />
      )}

      {openSku && (
        <ShopDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          visual={
            <div className="h-full w-full">
              <CosmeticPreview skuId={openSku.id} />
            </div>
          }
          title={openSku.name}
          kicker={CATEGORY_LABELS[openSku.category as SellableCategory]}
          description={openSku.blurb}
          price={openSku.price}
          coins={coins}
          owned={isOwned(purchases, openSku.id)}
          ownedLabel="Owned"
          pending={pendingSku === openSku.id}
          onBuy={() => handleBuy(openSku.id)}
        />
      )}
    </div>
  );
};

export default ShopTab;
