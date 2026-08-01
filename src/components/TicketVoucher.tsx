import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import type { Coupon } from "./GiftCouponsSection";
import { cn } from "@/lib/utils";

/* THESIS — a promise is a numbered ticket in a book, not a card in a grid.
   The page refuses the 3-up gradient-card shelf; it is a printed strip you
   pull tickets out of.
   OWN-WORLD — security-tinted stock, guilloché head band, perforation +
   punched notches, rose as the only ink, mono for the printed fields,
   Cormorant for what the ticket is worth. Irregular torn edges, never cuts.
   STORY — she reads what a promise costs, pulls it along the perforation,
   and the full ticket opens with the code to hand over.
   FIRST VIEWPORT — the book's cover: series line, heading, unspent count,
   three seals; its perforated bottom edge feeds straight into the strip.
   FORM — cinema/boarding stub, single column, pull-to-open. */

/** px of drag past which the stub commits and separates. */
const TEAR_THRESHOLD = 52;
/** how long the separation plays before the full ticket opens. */
const TEAR_DURATION = 380;
/** how long the stub stays detached before it slides back into the book. */
const STUB_RETURN = 1100;

interface TicketVoucherProps {
  coupon: Coupon;
  /** 1-based number printed on the ticket. */
  serial: number;
  isRedeemed: boolean;
  isLocked: boolean;
  isProcessing?: boolean;
  completedStamps: number;
  redeemedAt?: number;
  onOpen: () => void;
}

/** Paper fibres thrown off the perforation. Fixed per mount so they don't
    re-randomise on every render. */
const useFibres = () =>
  useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        x: 18 + Math.random() * 70,
        y: (Math.random() - 0.5) * 120,
        r: (Math.random() - 0.5) * 220,
        d: 0.5 + Math.random() * 0.35,
        w: 2 + Math.random() * 4,
        h: 1 + Math.random() * 2,
      })),
    []
  );

const TicketVoucher = ({
  coupon,
  serial,
  isRedeemed,
  isLocked,
  isProcessing = false,
  completedStamps,
  redeemedAt,
  onOpen,
}: TicketVoucherProps) => {
  const [isTorn, setIsTorn] = useState(false);
  const timers = useRef<number[]>([]);
  const reduceMotion = useReducedMotion();
  const fibres = useFibres();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const stampsShown = Math.min(completedStamps, coupon.requiredStamps);
  const stampsLeft = Math.max(coupon.requiredStamps - completedStamps, 0);
  const canPull = !isLocked && !isRedeemed && !isProcessing;

  const pull = useCallback(() => {
    if (!canPull || isTorn) return;

    if (reduceMotion) {
      onOpen();
      return;
    }

    setIsTorn(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([8, 24, 14]);
    }
    timers.current.push(window.setTimeout(onOpen, TEAR_DURATION));
    timers.current.push(window.setTimeout(() => setIsTorn(false), STUB_RETURN));
  }, [canPull, isTorn, onOpen, reduceMotion]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > TEAR_THRESHOLD || info.velocity.x > 420) pull();
  };

  const paper =
    "ticket-stock border border-[hsl(var(--stock-shade))] shadow-[0_1px_1px_hsl(272_30%_30%_/_0.06),0_18px_34px_-24px_hsl(272_40%_30%_/_0.45)]";

  return (
    <article
      className={cn(
        "ticketbook relative flex [--stub:4.75rem] sm:[--stub:5.75rem]",
        isLocked && "opacity-75",
        isRedeemed && "opacity-90"
      )}
    >
      {/* ─── the ticket itself ─── */}
      <div
        className={cn(
          paper,
          "relative flex-1 overflow-hidden rounded-l-2xl",
          isRedeemed ? "rounded-r-none" : "rounded-r-[3px]"
        )}
      >
        {/* engraved head band */}
        <div className="ticket-guilloche absolute inset-x-0 top-0 h-2.5" aria-hidden="true" />

        <div className="relative px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
          <header className="flex items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
              Nº {String(serial).padStart(3, "0")}
            </span>
            <span className="h-px flex-1 bg-[hsl(var(--stock-shade))]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rose">
              One promise
            </span>
          </header>

          <div className="mt-4 flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h3 className="font-serif text-[1.75rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2rem]">
                {coupon.title}
              </h3>
              <p className="mt-1.5 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
                {coupon.description}
              </p>
            </div>
            {/* the printed mark — a die-cut medallion, not a gradient panel */}
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-dashed border-[hsl(var(--stock-shade))] bg-[hsl(var(--primary)/0.04)] text-2xl"
              aria-hidden="true"
            >
              {coupon.emoji}
            </span>
          </div>

          {/* printed fields */}
          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-[hsl(var(--stock-shade))] pt-3">
            <div>
              <dt className="ticket-field-key">Costs</dt>
              <dd className="ticket-field-val">
                {coupon.requiredStamps} stamp{coupon.requiredStamps === 1 ? "" : "s"}
              </dd>
            </div>
            <div>
              <dt className="ticket-field-key">Valid</dt>
              <dd className="ticket-field-val">forever</dd>
            </div>
            <div>
              <dt className="ticket-field-key">Status</dt>
              <dd
                className={cn(
                  "ticket-field-val",
                  isRedeemed && "text-rose",
                  isLocked && "text-muted-foreground"
                )}
              >
                {isRedeemed
                  ? "spent"
                  : isLocked
                  ? `${stampsShown}/${coupon.requiredStamps}`
                  : "ready"}
              </dd>
            </div>
          </dl>
        </div>

        {/* overprints */}
        {isRedeemed && (
          /* the texture class carries position:relative, so the positioning
             lives on the wrapper or it silently loses to it */
          <span
            className="absolute right-24 top-[46%] -translate-y-1/2 -rotate-[11deg] sm:right-28"
            aria-hidden="true"
          >
            <span className="ticket-overprint stamp-ink-texture block">
              Redeemed
              {redeemedAt && (
                <span className="mt-0.5 block text-[9px] tracking-[0.18em] opacity-80">
                  {new Date(redeemedAt).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </span>
          </span>
        )}
        {isLocked && (
          <span
            className="ticket-overprint ticket-overprint--void absolute right-24 top-[46%] -translate-y-1/2 -rotate-[9deg] sm:right-28"
            aria-hidden="true"
          >
            Not yet
            <span className="mt-0.5 block text-[9px] tracking-[0.18em]">
              {stampsLeft} to go
            </span>
          </span>
        )}

        {/* the torn edge a pulled stub leaves behind */}
        {isRedeemed && <span className="ticket-torn" aria-hidden="true" />}

        {/* the perforation stays with the book when the stub goes */}
        {!isRedeemed && (
          <span className="ticket-perf absolute inset-y-0 right-0 w-[3px]" aria-hidden="true" />
        )}
      </div>

      {/* ─── the stub you pull ─── */}
      {!isRedeemed && (
        <>
          <motion.button
            type="button"
            onClick={pull}
            disabled={!canPull}
            aria-label={
              isLocked
                ? `${coupon.title} — locked, ${stampsLeft} more stamp${
                    stampsLeft === 1 ? "" : "s"
                  } needed`
                : `Open the ${coupon.title} ticket`
            }
            drag={canPull && !reduceMotion ? "x" : false}
            dragConstraints={{ left: 0, right: 96 }}
            dragElastic={0.12}
            dragMomentum={false}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            animate={
              isTorn
                ? { x: 132, y: 16, rotate: 7, opacity: 0 }
                : { x: 0, y: 0, rotate: 0, opacity: 1 }
            }
            transition={
              isTorn
                ? { duration: 0.34, ease: [0.16, 1, 0.3, 1] }
                : { type: "spring", stiffness: 420, damping: 34 }
            }
            whileHover={canPull && !reduceMotion ? { x: 6 } : undefined}
            className={cn(
              paper,
              "relative z-[1] flex w-[var(--stub)] shrink-0 flex-col items-center justify-between gap-2 rounded-l-[3px] rounded-r-2xl py-5",
              canPull
                ? "cursor-grab text-rose active:cursor-grabbing"
                : "cursor-not-allowed text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            style={{ touchAction: canPull ? "none" : undefined }}
          >
            {isProcessing ? (
              <span className="my-auto inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose border-t-transparent" />
            ) : isLocked ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span className="ticket-pull">Locked</span>
                <span className="font-mono text-[9px] tracking-[0.14em]">
                  {String(serial).padStart(3, "0")}
                </span>
              </>
            ) : (
              <>
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="ticket-pull">Pull</span>
                <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
                  {String(serial).padStart(3, "0")}
                </span>
              </>
            )}
          </motion.button>

          {/* punched half-moons where the perforation meets the edges */}
          <span
            className="ticket-notch -top-[0.5625rem]"
            style={{ right: "calc(var(--stub) - 0.5625rem)" }}
            aria-hidden="true"
          />
          <span
            className="ticket-notch -bottom-[0.5625rem]"
            style={{ right: "calc(var(--stub) - 0.5625rem)" }}
            aria-hidden="true"
          />
        </>
      )}

      {/* paper fibres off the perforation */}
      <AnimatePresence>
        {isTorn && (
          <span
            className="pointer-events-none absolute inset-y-0 z-[2]"
            style={{ right: "var(--stub)" }}
            aria-hidden="true"
          >
            {fibres.map((f) => (
              <motion.span
                key={f.id}
                className="absolute top-1/2 rounded-[1px] bg-[hsl(var(--stock-shade))]"
                style={{ width: f.w, height: f.h }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 0.9 }}
                animate={{ x: f.x, y: f.y, rotate: f.r, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: f.d, ease: "easeOut" }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </article>
  );
};

export default TicketVoucher;
