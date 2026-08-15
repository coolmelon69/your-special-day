/**
 * The one detail view every purchasable in the shop opens into — Poké items and
 * cosmetics alike. Built on the Radix dialog primitive directly rather than the
 * `DialogContent` wrapper, because that wrapper hardcodes a black/80 scrim and
 * this site is soft-lavender light-mode throughout.
 *
 * Buying happens here and only here: the grid card is a single button, so there
 * is never a control nested inside a control.
 */
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Gift, Lock, Minus, Package, PackageX, Plus, X } from "lucide-react";
import PokeCoin from "@/components/PokeCoin";
import { cn } from "@/lib/utils";

export interface ShopDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Big visual for the top of the sheet — sprite on its plinth, or a swatch. */
  visual: React.ReactNode;
  title: string;
  /** Mono caption over the title: the price tier, or the category. */
  kicker: string;
  description: string | null;
  /** The real-life coupon this item is worth, for Poké items. Cosmetics have
   *  none — they're worn, not cashed in. */
  realAction?: string | null;
  /** True when `realAction` is a teasing one and the reveal toggle is off. The
   *  shop still says a promise is attached; it just doesn't read it out on a
   *  screen somebody else might be looking at. */
  realActionHidden?: boolean;
  price: number;
  coins: number;
  owned: boolean;
  /** Copy for the owned state — "In bag" for items, "Owned" for cosmetics. */
  ownedLabel: string;
  /** How many are already in the bag. Items stack, so this is a note rather than
   *  a bar to buying. Absent for cosmetics, which you can only own once. */
  stock?: number;
  /** Present on stackable things: shows the stepper and hands the count to
   *  `onBuy`. Absent means one, and no stepper — nobody buys two of a filter. */
  stackable?: boolean;
  /** How many the shop has left to sell, admin-set. `null` or absent is
   *  unlimited; `0` is sold out. Distinct from `stock`, which is the bag. */
  remaining?: number | null;
  /** Shelf not open to this trainer yet. Everything still reads — only the buy
   *  is off, replaced by the name of the level that opens it. */
  locked?: boolean;
  /** Level name that unlocks it, e.g. "Ace". Required when `locked`. */
  lockedLabel?: string;
  pending: boolean;
  onBuy: (qty: number) => void;
}

/** Nothing sensible needs more than this in one go, and it matches the ceiling
 *  `buy_item` enforces. The affordable count is almost always the lower of the two. */
const MAX_QTY = 99;

const ShopDetailDialog = ({
  open,
  onOpenChange,
  visual,
  title,
  kicker,
  description,
  realAction,
  realActionHidden,
  price,
  coins,
  owned,
  ownedLabel,
  stock,
  stackable,
  remaining,
  locked,
  lockedLabel,
  pending,
  onBuy,
}: ShopDetailProps) => {
  const reduceMotion = useReducedMotion();
  const [qty, setQty] = useState(1);
  // Back to one each time it opens. A count left over from the last item is a
  // number nobody chose, attached to a price they haven't looked at yet.
  useEffect(() => {
    if (open) setQty(1);
  }, [open, title]);

  const soldOut = remaining === 0;

  /** The stepper stops wherever the first real limit is — the coins, the shelf,
   *  or the ceiling — so a purchase can never be refused for something the
   *  reader could already see on this screen. */
  const affordableQty = Math.max(1, Math.min(MAX_QTY, Math.floor(coins / price)));
  const maxQty = remaining == null ? affordableQty : Math.max(1, Math.min(affordableQty, remaining));
  const chosen = stackable ? Math.min(qty, maxQty) : 1;
  const total = price * chosen;
  const shortfall = total - coins;
  const affordable = shortfall <= 0;
  const buyable = !locked && !owned && !soldOut && affordable;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[hsl(270_25%_20%_/_0.42)] backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-[26px] border border-border bg-card shadow-[0_28px_60px_-28px_hsl(270_35%_35%_/_0.55)]",
            "duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Close
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </DialogPrimitive.Close>

          {/* Hero. The visual owns a fixed band so every item, sticker pack and
              filter opens to the same silhouette. */}
          <div className="grid h-40 place-items-center border-b border-border bg-gradient-to-b from-accent to-card px-6">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.86, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="grid h-28 w-full max-w-[220px] place-items-center"
            >
              {visual}
            </motion.div>
          </div>

          <div className="px-6 pb-6 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {kicker}
            </p>
            <DialogPrimitive.Title className="mt-1.5 font-serif text-2xl capitalize leading-tight text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2.5 font-sans text-sm leading-relaxed text-muted-foreground">
              {description ?? "No description on file for this one."}
            </DialogPrimitive.Description>

            {/* What it's actually for. Shown before the price, because it is the
                reason to spend the coins — the flavour text above is only the joke. */}
            {realAction && (
              <div className="mt-4 rounded-2xl border border-rose/30 bg-rose-light/40 px-4 py-3">
                <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-rose">
                  <Gift className="h-4 w-4" aria-hidden />
                  Redeem for
                </p>
                <p
                  className={cn(
                    "mt-1.5 leading-snug",
                    realActionHidden
                      ? "font-sans text-sm italic text-muted-foreground"
                      : "font-serif text-base text-foreground",
                  )}
                >
                  {realActionHidden ? "Teasing — reveal it from the Bag tab." : realAction}
                </p>
              </div>
            )}

            {/* How many. Only on things that stack, and only while they can
                actually be bought — a stepper over a locked shelf is a control
                that does nothing. */}
            {stackable && !locked && !soldOut && (
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    How many
                  </p>
                  {!!stock && (
                    <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground">
                      <Package className="h-4 w-4" aria-hidden />
                      {stock} already in your bag
                    </p>
                  )}
                  {remaining != null && (
                    <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-xs text-rose">
                      <PackageX className="h-4 w-4" aria-hidden />
                      {remaining} left in the shop
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    disabled={chosen <= 1}
                    aria-label="One fewer"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border text-foreground transition-colors hover:border-rose hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:border-border"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span
                    className="w-10 text-center font-mono text-lg tabular-nums text-foreground"
                    aria-live="polite"
                    aria-label={`${chosen} selected`}
                  >
                    {chosen}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((n) => Math.min(maxQty, n + 1))}
                    disabled={chosen >= maxQty}
                    aria-label="One more"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border text-foreground transition-colors hover:border-rose hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:border-border"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
              <span
                className={cn(
                  "inline-flex items-center gap-2 font-mono text-base",
                  owned || locked || soldOut ? "text-muted-foreground" : "text-rose",
                  (owned || soldOut) && "line-through",
                )}
              >
                <PokeCoin size={20} />
                {total}
              </span>

              <motion.button
                type="button"
                disabled={!buyable || pending}
                onClick={() => onBuy(chosen)}
                whileTap={reduceMotion || !buyable ? undefined : { scale: 0.96 }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors",
                  locked
                    ? "cursor-not-allowed border-dashed border-border text-muted-foreground"
                    : owned
                      ? "cursor-default border-rose/40 text-rose"
                      : soldOut || !affordable
                      ? "cursor-not-allowed border-border text-muted-foreground"
                      : "border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60",
                )}
              >
                {locked ? (
                  <>
                    <Lock className="h-4 w-4" aria-hidden />
                    Unlocks at {lockedLabel}
                  </>
                ) : soldOut ? (
                  <>
                    <PackageX className="h-4 w-4" aria-hidden />
                    Sold out
                  </>
                ) : owned ? (
                  <>
                    {ownedLabel === "In bag" ? (
                      <Package className="h-4 w-4" aria-hidden />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden />
                    )}
                    {ownedLabel}
                  </>
                ) : !affordable ? (
                  <>
                    <PokeCoin size={16} />
                    {shortfall} more to go
                  </>
                ) : pending ? (
                  "Buying…"
                ) : (
                  <>
                    <PokeCoin size={16} />
                    Buy {chosen > 1 && `${chosen} `}for {total}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default ShopDetailDialog;
