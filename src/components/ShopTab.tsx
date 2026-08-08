import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Clock,
  IdCard,
  Image as ImageIcon,
  Package,
  Sparkles,
  Sticker as StickerIcon,
  Store,
} from "lucide-react";
import { SHOP_CATALOGUE, isOwned, skuById, type ShopCategory, type ShopSku } from "@/utils/shop";
import { stockForDate, itemSourceFor, type ItemSku } from "@/utils/itemShop";
import { fetchItemDetails, type ItemDetails } from "@/utils/pokeItems";
import type { OwnedItem } from "@/utils/profile";
import PokeCoin from "@/components/PokeCoin";
import CosmeticPreview from "@/components/ShopPreview";
import ShopDetailDialog from "@/components/ShopDetailDialog";
import { cn } from "@/lib/utils";

/** Price tiers. Purely presentational — the shelf has no rarity field, but the
 *  price already sorts the stock into "pocket money", "worth saving for" and
 *  "the good stuff", so the card colours the plinth and price from it. */
type Tier = "common" | "uncommon" | "prime";

const tierOf = (price: number): Tier =>
  price >= 17 ? "prime" : price >= 9 ? "uncommon" : "common";

const TIER_LABEL: Record<Tier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  prime: "Prime stock",
};

/** Radial plinth the sprite stands on — the tint is the only rarity signal. */
const TIER_PLINTH: Record<Tier, string> = {
  common: "radial-gradient(ellipse at 50% 68%, hsl(var(--muted)) 0%, transparent 68%)",
  uncommon: "radial-gradient(ellipse at 50% 68%, hsl(var(--primary-light)) 0%, transparent 68%)",
  prime: "radial-gradient(ellipse at 50% 68%, hsl(var(--rose-light)) 0%, transparent 68%)",
};

const TIER_PRICE: Record<Tier, string> = {
  common: "text-muted-foreground",
  uncommon: "text-primary",
  prime: "text-rose",
};

interface ShopTabProps {
  coins: number;
  purchases: string[];
  purchase: (sku: string) => Promise<boolean>;
  /** The bag — a shelf item already in it is sold out for this trainer. */
  items: OwnedItem[];
  purchaseItem: (slug: string) => Promise<boolean>;
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
type Selection = { kind: "item"; slug: string } | { kind: "sku"; id: string };

/** Sprite on its tinted plinth, at whatever size the surface needs. Sprites are
 *  32px native, so both sizes here are exact multiples — no blur. Declared at
 *  module scope on purpose: nested inside ShopTab it would be a fresh component
 *  type on every render, remounting the image and re-flashing the sprite. */
const SpritePlinth = ({
  item,
  detail,
  size,
}: {
  item: ItemSku;
  detail: ItemDetails | undefined;
  size: 64 | 96;
}) => {
  const sprite = size === 96 ? 64 : 48;
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-xl"
      style={{ height: size, width: size, backgroundImage: TIER_PLINTH[tierOf(item.price)] }}
    >
      {detail?.spriteUrl ? (
        <img
          src={detail.spriteUrl}
          alt=""
          className="transition-transform duration-300 ease-out group-hover:-translate-y-1"
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

const ShopTab = ({ coins, purchases, purchase, items, purchaseItem }: ShopTabProps) => {
  const reduceMotion = useReducedMotion();
  const [pendingSku, setPendingSku] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ItemDetails>>({});
  /** Slug or sku id whose purchase sweep is currently playing. */
  const [justBought, setJustBought] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);

  const allOwned = SELLABLE_CATALOGUE.every((sku) => isOwned(purchases, sku.id));

  // Today's five. Computed once per mount — an overnight tab left open keeps
  // yesterday's shelf until it's reloaded, which is the honest thing to do:
  // swapping stock under a half-made decision would be worse.
  const stock = useMemo(() => stockForDate(), []);
  const ownedSources = new Set(items.map((item) => item.source));

  // Sprites and names come from PokéAPI; `fetchItemDetails` caches by slug.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      stock.map((item) => fetchItemDetails(item.slug).then((d) => [item.slug, d] as const)),
    ).then((entries) => {
      if (cancelled) return;
      setDetails(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [stock]);

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

  const handleBuyItem = async (slug: string) => {
    if (pendingSku) return;
    setPendingSku(slug);
    setMessage(null);
    try {
      const bought = await purchaseItem(slug);
      if (!bought) {
        setMessage("That didn't go through — check your balance, or it may already be in your bag.");
      } else {
        celebrate(slug);
      }
    } finally {
      setPendingSku(null);
    }
  };

  const itemName = (item: ItemSku) =>
    (details[item.slug]?.name ?? item.slug).replace(/-/g, " ");

  // What the dialog reads. Derived rather than stored, so a purchase completing
  // while it's open flips it to the owned state without a second source of truth.
  const openItem: ItemSku | undefined =
    selected?.kind === "item" ? stock.find((i) => i.slug === selected.slug) : undefined;
  const openSku: ShopSku | undefined =
    selected?.kind === "sku" ? skuById(selected.id) : undefined;

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

      {/* Today's items — the only shelf that changes on its own */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Today's Items
          </h3>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden />
            New stock daily
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
          {stock.map((item, index) => {
            const inBag = ownedSources.has(itemSourceFor(item.slug));
            const affordable = coins >= item.price;
            const name = itemName(item);
            const tier = tierOf(item.price);

            return (
              <motion.button
                key={item.slug}
                type="button"
                onClick={() => setSelected({ kind: "item", slug: item.slug })}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: inBag ? 0.72 : 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }
                }
                whileHover={reduceMotion ? undefined : { y: -3 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                aria-label={`${name}, ${item.price} coins${inBag ? ", already in your bag" : ""} — open details`}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-left transition-shadow",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  inBag
                    ? "border-rose/40"
                    : "border-border hover:shadow-[0_10px_24px_-14px_hsl(var(--lilac))]",
                )}
              >
                {/* Purchase sweep — plays once, then the card settles into "in bag". */}
                {justBought === item.slug && !reduceMotion && (
                  <motion.span
                    aria-hidden
                    initial={{ x: "-120%" }}
                    animate={{ x: "120%" }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 bg-gradient-to-r from-transparent via-rose-light to-transparent"
                  />
                )}

                <div className="flex flex-1 items-start gap-3 p-4">
                  <SpritePlinth item={item} detail={details[item.slug]} size={64} />

                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-semibold capitalize leading-snug text-foreground">
                      {name}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      {TIER_LABEL[tier]}
                    </p>
                    <p className="mt-1.5 line-clamp-2 font-sans text-xs leading-relaxed text-muted-foreground">
                      {details[item.slug]?.flavorText ?? " "}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-mono text-xs",
                      inBag ? "text-muted-foreground" : TIER_PRICE[tier],
                    )}
                  >
                    <PokeCoin size={16} />
                    {item.price}
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide",
                      inBag ? "text-rose" : affordable ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {inBag ? (
                      <>
                        <Package className="h-4 w-4" aria-hidden />
                        In bag
                      </>
                    ) : affordable ? (
                      "View"
                    ) : (
                      `${item.price - coins} more`
                    )}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

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
                      onClick={() => setSelected({ kind: "sku", id: sku.id })}
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
          open
          onOpenChange={(next) => !next && setSelected(null)}
          visual={<SpritePlinth item={openItem} detail={details[openItem.slug]} size={96} />}
          title={itemName(openItem)}
          kicker={TIER_LABEL[tierOf(openItem.price)]}
          description={details[openItem.slug]?.flavorText ?? null}
          price={openItem.price}
          coins={coins}
          owned={ownedSources.has(itemSourceFor(openItem.slug))}
          ownedLabel="In bag"
          pending={pendingSku === openItem.slug}
          onBuy={() => handleBuyItem(openItem.slug)}
        />
      )}

      {openSku && (
        <ShopDetailDialog
          open
          onOpenChange={(next) => !next && setSelected(null)}
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
