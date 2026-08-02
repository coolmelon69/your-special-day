import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, QrCode } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { burstConfetti } from "@/utils/particles";
import { playStampSound } from "@/utils/sound";
import { cn } from "@/lib/utils";

/* The scan pulled the stub off. This page is the second after: the ticket lands
   back in the book with its torn edge, and the counter's green seal comes down
   on it. One authored moment — the slam — and everything else settles around it. */

const SLAM_AT = 460; // ms — the ticket has finished landing by now

const RedemptionSuccessPage = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const state = location.state as
    | { couponTitle?: string; couponId?: number }
    | null;
  const couponTitle = state?.couponTitle;
  const serial = state?.couponId;

  const [slammed, setSlammed] = useState(false);
  const [redeemedAt] = useState(() => new Date());

  useEffect(() => {
    if (!couponTitle) return;

    if (reduceMotion) {
      setSlammed(true);
      return;
    }

    const slam = window.setTimeout(() => {
      setSlammed(true);
      playStampSound();
      burstConfetti({ particleCount: 90, origin: { x: 0.5, y: 0.46 } });
    }, SLAM_AT);

    return () => clearTimeout(slam);
  }, [couponTitle, reduceMotion]);

  // Nothing was redeemed on this visit — a reload or a direct hit on the URL.
  if (!couponTitle) return <Navigate to="/coupons" replace />;

  const paper =
    "ticket-stock border border-[hsl(var(--stock-shade))] shadow-[0_1px_1px_hsl(272_30%_30%_/_0.06),0_28px_50px_-30px_hsl(272_40%_30%_/_0.5)]";

  const stampedOn = redeemedAt.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const stampedAtTime = redeemedAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Helmet>
        <title>Redeemed — Your Special Day</title>
      </Helmet>

      <main className="ticketbook flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[38rem]">
          {/* ─── the ticket, landing ─── */}
          <motion.div
            className="relative"
            initial={reduceMotion ? false : { opacity: 0, y: -30, rotate: -2.4 }}
            animate={
              slammed && !reduceMotion
                ? {
                    opacity: 1,
                    // the seal's impact travels into the paper
                    y: [0, 5, -2, 0],
                    rotate: [0, 0.5, -0.25, 0],
                  }
                : { opacity: 1, y: 0, rotate: 0 }
            }
            transition={
              slammed
                ? { duration: 0.42, ease: "easeOut", times: [0, 0.22, 0.5, 1] }
                : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
            }
          >
            <article
              className={cn(
                paper,
                "relative overflow-hidden rounded-l-2xl rounded-r-none pr-8 sm:pr-10"
              )}
            >
              <div className="ticket-guilloche absolute inset-x-0 top-0 h-2.5" aria-hidden="true" />

              <div className="relative px-6 pb-7 pt-6 sm:px-9 sm:pb-8 sm:pt-7">
                <header className="flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
                    {serial ? `Nº ${String(serial).padStart(3, "0")}` : "Nº ———"}
                  </span>
                  <span className="h-px flex-1 bg-[hsl(var(--stock-shade))]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rose">
                    Stub pulled
                  </span>
                </header>

                <h1 className="mt-5 max-w-[15ch] font-serif text-[2.375rem] font-bold leading-[1.02] tracking-tight text-foreground sm:text-[3rem]">
                  {couponTitle}
                </h1>

                <dl className="mt-7 flex gap-10 border-t border-dashed border-[hsl(var(--stock-shade))] pt-4">
                  <div>
                    <dt className="ticket-field-key">Redeemed</dt>
                    <dd className="ticket-field-val">{stampedOn}</dd>
                  </div>
                  <div>
                    <dt className="ticket-field-key">At</dt>
                    <dd className="ticket-field-val">{stampedAtTime}</dd>
                  </div>
                </dl>
              </div>

              {/* the edge the stub left behind */}
              <span className="ticket-torn" aria-hidden="true" />
            </article>

            {/* ─── the seal, coming down ─── */}
            <motion.div
              className="pointer-events-none absolute right-0 top-1/2 translate-x-1/2"
              style={{ marginTop: "-4.75rem" }}
              initial={
                reduceMotion ? false : { scale: 2.7, opacity: 0, rotate: -30 }
              }
              animate={
                slammed
                  ? { scale: 1, opacity: 1, rotate: -11 }
                  : { scale: 2.7, opacity: 0, rotate: -30 }
              }
              transition={{ type: "spring", stiffness: 620, damping: 24, mass: 0.8 }}
            >
              <span
                className="ticket-seal ticket-seal--ok [--seal-size:8rem] sm:[--seal-size:9.5rem]"
                role="img"
                aria-label="Redeemed"
              >
                <span className="stamp-ink-texture flex flex-col items-center">
                  <Check
                    className="h-12 w-12 stroke-[3] sm:h-[3.25rem] sm:w-[3.25rem]"
                    aria-hidden="true"
                  />
                  <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em]">
                    Redeemed
                  </span>
                </span>
              </span>
            </motion.div>
          </motion.div>

          {/* ─── what just happened, in the book's own voice ─── */}
          <motion.div
            className="mt-14 sm:mt-16"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
              That one is spent — and that's the whole point. It stays in the book
              with its torn edge, so we can always see it happened.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/coupons"
                className="inline-flex items-center gap-2 rounded-[10px] border border-primary bg-primary px-5 py-3 font-medium text-primary-foreground transition-gentle hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to the ticket book
              </Link>
              <Link
                to="/scan-qr"
                className="inline-flex items-center gap-2 rounded-[10px] border border-border px-5 py-3 font-medium text-foreground transition-gentle hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <QrCode className="h-4 w-4" />
                Scan another
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
};

export default RedemptionSuccessPage;
