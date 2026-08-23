import { useEffect, useId, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, KeyRound, Loader2, Scissors } from "lucide-react";
import { useAdventure } from "@/contexts/AdventureContext";
import { claimMysteryGift, normalizeGiftCode, CODE_LENGTH } from "@/utils/mysteryGifts";

/**
 * The counterfoil at the back of the book: the by-hand way in when the camera
 * won't read a Mystery Gift card.
 *
 * Closed by default — scanning stays the main path, and an always-open form
 * would read as the primary way to claim. The stub is torn to open it.
 *
 * Only gift codes are typeable — a coupon QR carries `{couponId, title}` and
 * no printed code exists for one, so there is nothing here to type for those.
 * See src/utils/mysteryGiftCode.ts for the code's shape.
 */

/** Live formatting: the printed form is four groups of four. */
const groupCode = (raw: string): string =>
  (normalizeGiftCode(raw).slice(0, CODE_LENGTH).match(/.{1,4}/g) ?? []).join("-");

const MESSAGES: Record<string, string> = {
  already: "This card has already been opened — its gift is in the book.",
  invalid: "No card carries that code. Check the letters and try again.",
  unauthenticated: "Sign in on this device before opening a gift.",
  error: "The magic had a hiccup, try again!",
};

const EASE = [0.16, 1, 0.3, 1] as const;

const GiftClaimSlip = () => {
  /* `/coupons?claim=1` — the scan screen's "type it by hand" way out. It
     arrives with the slip already torn open and the field focused. */
  const openedFromScanner = new URLSearchParams(useLocation().search).has("claim");

  const [open, setOpen] = useState(openedFromScanner);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, refreshCoupons } = useAdventure();
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  /* Opening puts the caret in the field — the whole point of tearing the stub.
     Arriving from the scanner also has to scroll: the slip sits at the very
     bottom of a long book. */
  useEffect(() => {
    if (!open) return;
    if (openedFromScanner) {
      rootRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    }
    const focus = window.setTimeout(() => inputRef.current?.focus(), reduceMotion ? 0 : 320);
    return () => clearTimeout(focus);
  }, [open, openedFromScanner, reduceMotion]);

  /* Opening is a physical act in this world — the paper gives, so the phone
     gives too. */
  const toggle = () => {
    setOpen((v) => {
      if (!v && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([8, 24, 12]);
      }
      return !v;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeGiftCode(code);
    if (busy || normalized.length !== CODE_LENGTH) return;

    if (!user) {
      setError(MESSAGES.unauthenticated);
      return;
    }

    setBusy(true);
    setError(null);
    const claim = await claimMysteryGift(normalized);
    setBusy(false);

    if (claim.status === "claimed") {
      await refreshCoupons();
      navigate("/gift-reveal", { state: { payload: claim.payload, id: claim.id } });
      return;
    }

    setError(MESSAGES[claim.status] ?? MESSAGES.error);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
  };

  const complete = normalizeGiftCode(code).length === CODE_LENGTH;

  return (
    <section ref={rootRef} className="mt-14 scroll-mt-24">
      {/* The stub. Closed, this is the whole component: a pull-tab of real
          ticket stock sitting on the tear line, punched at both ends so it
          reads as paper you take hold of rather than a line of text. */}
      <div className="relative flex justify-center py-2">
        <span
          className="ticket-perf ticket-perf--h pointer-events-none absolute inset-x-1 top-1/2 h-[3px] -translate-y-1/2"
          aria-hidden="true"
        />

        <motion.button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="ticket-stock group relative inline-flex min-h-11 cursor-pointer touch-none select-none items-center gap-2.5 rounded-full border border-[hsl(var(--stock-shade))] px-5 shadow-[0_1px_1px_hsl(272_30%_30%_/_0.05),0_10px_18px_-14px_hsl(272_44%_28%_/_0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          /* Drag down to tear it off — the book's signature interaction
             (DESIGN_SYSTEM.md §14). Click does the same thing; the drag is
             an enhancement, never the only way in. */
          drag={reduceMotion || open ? false : "y"}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.45}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (!open && (info.offset.y > 22 || info.velocity.y > 380)) toggle();
          }}
          whileHover={reduceMotion ? undefined : { y: -2, rotate: -0.5 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 480, damping: 30 }}
        >
          {/* punched half-moons: the tab is cut out of the strip */}
          <span className="ticket-notch -left-[0.4375rem] top-1/2 -translate-y-1/2" aria-hidden="true" />
          <span className="ticket-notch -right-[0.4375rem] top-1/2 -translate-y-1/2" aria-hidden="true" />

          <motion.span
            className="inline-flex text-rose"
            aria-hidden="true"
            /* The blades travel a little way along the cut every few seconds:
               enough motion to say "this comes apart", quiet enough to ignore. */
            animate={reduceMotion || open ? { x: 0, rotate: 0 } : { x: [0, 4, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 1.5, repeat: open ? 0 : Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
          >
            <Scissors className="h-4 w-4" />
          </motion.span>

          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-[hsl(330_62%_38%)]">
            {open ? "Fold the slip away" : "Camera won't read? Pull to type the code"}
          </span>

          <motion.span
            className="inline-flex text-rose"
            aria-hidden="true"
            animate={
              reduceMotion
                ? { rotate: open ? 180 : 0 }
                : { rotate: open ? 180 : 0, y: open ? 0 : [0, 2.5, 0] }
            }
            transition={{
              rotate: { duration: 0.35, ease: EASE },
              y: { duration: 1.4, repeat: open ? 0 : Infinity, repeatDelay: 0.9, ease: "easeInOut" },
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="slip"
            /* Unfolds from the tear: the paper drops out of the perforation
               rather than fading in somewhere else on the page. */
            initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -8 }}
            animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="ticket-stock relative mt-1 overflow-hidden rounded-2xl border border-[hsl(var(--stock-shade))] px-6 py-7 shadow-[0_1px_2px_hsl(272_30%_30%_/_0.05),0_20px_40px_-34px_hsl(272_44%_28%_/_0.45)] sm:px-8"
            >
              <div className="ticket-guilloche absolute inset-x-0 top-0 h-2" aria-hidden="true" />

              <h2 className="mt-1 font-serif text-2xl leading-tight text-foreground sm:text-[1.75rem]">
                Type the code printed on your card
              </h2>
              <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">
                Sixteen characters, four groups of four. Dashes fill themselves in.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label htmlFor="gift-code" className="ticket-field-key block">
                    Card code
                  </label>
                  <input
                    id="gift-code"
                    ref={inputRef}
                    value={code}
                    onChange={(e) => {
                      setCode(groupCode(e.target.value));
                      setError(null);
                    }}
                    placeholder="ABCD-EFGH-JKMN-PQRS"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "gift-code-error" : undefined}
                    className="mt-1.5 w-full border-0 border-b-2 border-dashed border-[hsl(var(--stock-shade))] bg-transparent px-0 pb-1.5 font-mono text-[clamp(1rem,4.4vw,1.375rem)] uppercase tracking-[0.14em] text-foreground caret-rose placeholder:text-[hsl(274_14%_66%)] focus:border-rose focus:outline-none focus-visible:ring-0"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!complete || busy}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[hsl(330_55%_40%)] px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-[background-color,opacity,transform] hover:bg-[hsl(330_55%_34%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--stock))] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy ? "Opening" : "Open gift"}
                </button>
              </div>

              <p
                id="gift-code-error"
                role="status"
                className="mt-3 min-h-[1.25rem] text-[13px] leading-snug text-[hsl(330_62%_38%)]"
              >
                {error}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GiftClaimSlip;
