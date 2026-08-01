import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import QRCode from "react-qr-code";
import type { Coupon } from "./GiftCouponsSection";
import { cn } from "@/lib/utils";

/* The ticket, pulled out of the book and opened. Same material world as
   TicketVoucher: security stock, guilloché head, perforated counterfoil
   holding the code you hand over. Redeeming lands as a rubber stamp. */

interface VoucherModalProps {
  coupon: Coupon | null;
  /** 1-based number printed on the ticket — matches the strip. */
  serial?: number;
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (couponId: number) => Promise<boolean>;
  isRedeemed: boolean;
  isProcessing?: boolean;
  /** Redemption failure, surfaced here because redeeming only happens here. */
  error?: string | null;
}

export const FINE_PRINT = [
  "This ticket has no expiration date and can be used anytime.",
  "Present the QR code or the ticket code at the time of redemption.",
  "This ticket is non-transferable and can only be used once.",
  "Subject to availability and terms of the participating venue.",
];

const VoucherModal = ({
  coupon,
  serial,
  isOpen,
  onClose,
  onRedeem,
  isRedeemed,
  isProcessing = false,
  error,
}: VoucherModalProps) => {
  const [copied, setCopied] = useState(false);
  const [stamped, setStamped] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const timers = useRef<number[]>([]);
  const reduceMotion = useReducedMotion();

  /* One code per ticket. Deriving it from Date.now() on every render meant the
     QR and the copied string drifted apart between paints. */
  const voucherCode = useMemo(() => {
    if (!coupon) return "";
    const suffix = Math.abs(coupon.id * 2654435761 % 1679616)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
    return `PROMISE-${String(coupon.id).padStart(4, "0")}-${suffix}`;
  }, [coupon]);

  const qrCodeValue = useMemo(
    () =>
      coupon
        ? JSON.stringify({ code: voucherCode, couponId: coupon.id, title: coupon.title })
        : "",
    [coupon, voucherCode]
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Escape to close, scroll lock, and focus handoff while open.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, isProcessing, onClose]);

  // Reset per-ticket UI state whenever a different ticket is opened.
  useEffect(() => {
    setCopied(false);
    setStamped(false);
  }, [coupon?.id, isOpen]);

  if (!coupon) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      timers.current.push(window.setTimeout(() => setCopied(false), 2000));
    } catch {
      /* clipboard blocked — the code is on screen to read either way */
    }
  };

  const handleRedeem = async () => {
    if (isProcessing || isRedeemed) return;
    const ok = await onRedeem(coupon.id);
    if (!ok) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([18, 40, 24]);
    setStamped(true);
    timers.current.push(window.setTimeout(onClose, reduceMotion ? 400 : 1100));
  };

  const showStamp = isRedeemed || stamped;
  const paper =
    "ticket-stock border border-[hsl(var(--stock-shade))] shadow-[0_2px_2px_hsl(272_30%_30%_/_0.08),0_40px_80px_-40px_hsl(272_44%_28%_/_0.6)]";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[hsl(272_30%_16%_/_0.55)] px-4 py-8 backdrop-blur-[3px] sm:px-6 sm:py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !isProcessing && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-title"
            tabIndex={-1}
            className={cn(
              "ticketbook relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl outline-none md:flex-row",
              paper
            )}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 42, scale: 0.96, rotate: -1.2 }}
            animate={
              stamped && !reduceMotion
                ? { opacity: 1, y: [0, 3, 0], scale: 1, rotate: 0 }
                : { opacity: 1, y: 0, scale: 1, rotate: 0 }
            }
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.97 }}
            transition={
              stamped
                ? { duration: 0.22, ease: "easeOut" }
                : { type: "spring", stiffness: 260, damping: 26 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ticket-guilloche absolute inset-x-0 top-0 h-3" aria-hidden="true" />

            <button
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close ticket"
              className="absolute right-4 top-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-[hsl(var(--stock-shade))] bg-[hsl(var(--stock))] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ─── the ticket ─── */}
            <div className="relative flex-1 px-6 pb-8 pt-9 sm:px-9 sm:pb-10 sm:pt-11">
              <header className="flex items-center gap-3 pr-11">
                <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
                  Nº {String(serial ?? coupon.id).padStart(3, "0")}
                </span>
                <span className="h-px flex-1 bg-[hsl(var(--stock-shade))]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rose">
                  One promise
                </span>
              </header>

              <div className="mt-6 flex items-start gap-4">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-dashed border-[hsl(var(--stock-shade))] text-2xl"
                  aria-hidden="true"
                >
                  {coupon.emoji}
                </span>
                <div>
                  <h2
                    id="voucher-title"
                    className="font-serif text-[2.25rem] font-bold leading-[1.02] tracking-tight text-foreground sm:text-[2.75rem]"
                  >
                    {coupon.title}
                  </h2>
                  <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-muted-foreground">
                    {coupon.description}
                  </p>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-dashed border-[hsl(var(--stock-shade))] py-4">
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
                  <dt className="ticket-field-key">Issued to</dt>
                  <dd className="ticket-field-val">you</dd>
                </div>
              </dl>

              <section className="mt-6">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  The small print
                </h3>
                <ol className="mt-3 space-y-1.5">
                  {FINE_PRINT.map((term, i) => (
                    <li key={term} className="flex gap-2.5 text-[13px] leading-snug text-muted-foreground">
                      <span className="font-mono text-[10px] leading-[1.5] text-rose">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="max-w-[58ch]">{term}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* ─── action ─── */}
              <div className="mt-8">
                {error && !showStamp && (
                  <p
                    role="alert"
                    className="mb-4 rounded-[10px] border border-rose/40 bg-rose/10 px-4 py-2.5 text-[13px] text-rose"
                  >
                    {error}
                  </p>
                )}
                {showStamp ? (
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-rose">
                    ✓ Spent — hope it was a good one
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleRedeem}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-rose bg-rose px-5 py-3 font-medium text-white transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isProcessing ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Marking it spent…
                        </>
                      ) : (
                        "Redeem this promise"
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center rounded-[10px] border border-[hsl(var(--stock-shade))] px-5 py-3 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      Keep it for later
                    </button>
                  </div>
                )}
              </div>

              {/* the stamp lands */}
              <AnimatePresence>
                {showStamp && (
                  <motion.span
                    className="absolute right-6 top-1/2 z-10 -translate-y-1/2 sm:right-12"
                    initial={
                      reduceMotion
                        ? { opacity: 0, rotate: -12 }
                        : { opacity: 0, scale: 2.8, rotate: -26 }
                    }
                    animate={{ opacity: 1, scale: 1, rotate: -12 }}
                    transition={{ type: "spring", stiffness: 700, damping: 26, mass: 0.7 }}
                    aria-hidden="true"
                  >
                    <span className="ticket-overprint stamp-ink-texture block text-base">
                      Redeemed
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* ─── the counterfoil you hand over ─── */}
            <div className="relative flex shrink-0 flex-col items-center justify-center gap-4 px-6 py-8 md:w-[17.5rem] md:px-7">
              <span
                className="ticket-perf ticket-perf--h absolute inset-x-6 top-0 h-[3px] md:hidden"
                aria-hidden="true"
              />
              <span
                className="ticket-perf absolute inset-y-5 left-0 hidden w-[3px] md:block"
                aria-hidden="true"
              />
              <span className="ticket-notch -left-[0.5625rem] -top-[0.5625rem] hidden md:block" aria-hidden="true" />
              <span className="ticket-notch -bottom-[0.5625rem] -left-[0.5625rem] hidden md:block" aria-hidden="true" />

              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Hand this over
              </p>

              <div className="rounded-xl border border-[hsl(var(--stock-shade))] bg-white p-3">
                <QRCode
                  value={qrCodeValue}
                  size={148}
                  level="H"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>

              <div className="w-full">
                <p className="ticket-field-key text-center">Ticket code</p>
                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  <code className="font-mono text-[12px] tracking-tight text-foreground">
                    {voucherCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    aria-label={copied ? "Ticket code copied" : "Copy ticket code"}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[hsl(var(--stock-shade))] text-muted-foreground transition-colors hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-rose" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                No expiry, ever
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoucherModal;
