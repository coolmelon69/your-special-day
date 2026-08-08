/**
 * The one detail view every purchasable in the shop opens into — Poké items and
 * cosmetics alike. Built on the Radix dialog primitive directly rather than the
 * `DialogContent` wrapper, because that wrapper hardcodes a black/80 scrim and
 * this site is soft-lavender light-mode throughout.
 *
 * Buying happens here and only here: the grid card is a single button, so there
 * is never a control nested inside a control.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Package, X } from "lucide-react";
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
  price: number;
  coins: number;
  owned: boolean;
  /** Copy for the owned state — "In bag" for items, "Owned" for cosmetics. */
  ownedLabel: string;
  pending: boolean;
  onBuy: () => void;
}

const ShopDetailDialog = ({
  open,
  onOpenChange,
  visual,
  title,
  kicker,
  description,
  price,
  coins,
  owned,
  ownedLabel,
  pending,
  onBuy,
}: ShopDetailProps) => {
  const reduceMotion = useReducedMotion();
  const shortfall = price - coins;
  const affordable = shortfall <= 0;

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

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
              <span
                className={cn(
                  "inline-flex items-center gap-2 font-mono text-base",
                  owned ? "text-muted-foreground line-through" : "text-rose",
                )}
              >
                <PokeCoin size={20} />
                {price}
              </span>

              <motion.button
                type="button"
                disabled={owned || !affordable || pending}
                onClick={onBuy}
                whileTap={reduceMotion || owned || !affordable ? undefined : { scale: 0.96 }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors",
                  owned
                    ? "cursor-default border-rose/40 text-rose"
                    : !affordable
                      ? "cursor-not-allowed border-border text-muted-foreground"
                      : "border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60",
                )}
              >
                {owned ? (
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
                    Buy for {price}
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
