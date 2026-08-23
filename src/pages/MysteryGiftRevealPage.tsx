import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, QrCode } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { burstConfetti, sparkleBurst } from "@/utils/particles";
import { playStampSound } from "@/utils/sound";
import type { MysteryGiftPayload } from "@/utils/mysteryGifts";

/* THESIS — a mystery gift is a sealed envelope, not a loot box. It was
   written by hand, sealed with wax and left somewhere she'd find it; the
   screen's only job is to be the moment the wax breaks.
   OWN-WORLD — the ticket book's material (§14), because that is where the
   gift lands: security stock, laid chain lines, rose as the only ink. The
   envelope is new, the paper it is cut from is not.
   STORY — she scans a card, an envelope is lying there face down, sealed;
   she presses the wax, it cracks in two, the flap falls open and the ticket
   rises out. What we see is the BACK of an envelope — flap, seal, the line
   written across the fold. No stamp, no address: those live on a face we
   never turn to, and drawing them here would put them under the flap.
   MOTION — one authored moment, in four beats: press, crack, flap, rise.
   Everything before it is a slow float and a sheen crossing the paper, so
   the object looks alive without asking for anything.
   FORM — one object, centred, nothing else competing. */

type RevealState = { payload: MysteryGiftPayload; id?: string } | null;

/** Beat 2→3: how long the wax cracks before the flap starts to fall. */
const FLAP_MS = 300;
/** Beat 3→4: how long until the ticket has cleared the envelope's mouth. */
const RISE_MS = 760;
/** When the spent envelope is finally taken out of the DOM. */
const CLEAR_MS = 1500;

/** Wax shards, fixed so a re-render doesn't re-scatter them mid-flight. */
const SHARDS = [
  { x: -58, y: 54, r: -128, s: 0.34, d: 0.04 },
  { x: 47, y: 63, r: 141, s: 0.3, d: 0.02 },
  { x: -22, y: 82, r: -64, s: 0.24, d: 0.09 },
  { x: 26, y: 92, r: 78, s: 0.2, d: 0.06 },
];

const MysteryGiftRevealPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const state = (location.state ?? null) as RevealState;

  /** sealed → breaking (wax + flap) → open (ticket rising) → the envelope goes. */
  const [isBreaking, setIsBreaking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const sealRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const open = useCallback(() => {
    if (isBreaking || isOpen) return;

    if (reduceMotion) {
      setIsBreaking(true);
      setIsOpen(true);
      setIsCleared(true);
      return;
    }

    setIsBreaking(true);
    playStampSound();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10, 30, 18]);
    }

    /* The sparks come off the wax itself, so the burst reads as the seal
       cracking rather than as confetti fired at the page. sparkleBurst takes
       viewport pixels; burstConfetti takes a normalised origin — two units,
       one point on the screen. */
    const seal = sealRef.current?.getBoundingClientRect();
    const cx = seal ? seal.left + seal.width / 2 : window.innerWidth / 2;
    const cy = seal ? seal.top + seal.height / 2 : window.innerHeight / 2;
    sparkleBurst({ x: cx, y: cy, particleCount: 26 });

    timers.current.push(
      window.setTimeout(() => setIsOpen(true), FLAP_MS),
      window.setTimeout(() => {
        burstConfetti({
          particleCount: 70,
          origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
        });
      }, RISE_MS),
      window.setTimeout(() => setIsCleared(true), CLEAR_MS)
    );
  }, [isBreaking, isOpen, reduceMotion]);

  /* Reached only from a successful scan. A bare visit has no gift to show,
     so it goes where the gifts live instead of rendering an empty ceremony. */
  if (!state?.payload) return <Navigate to="/coupons" replace />;

  const { payload } = state;
  const today = new Date().toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="ticketbook min-h-screen bg-background">
      <Helmet>
        <title>A mystery gift · Your Special Day</title>
        <meta name="description" content="Something sealed, just for you." />
      </Helmet>

      <main className="mx-auto flex min-h-screen w-full max-w-[42rem] flex-col items-center justify-center px-6 py-16">
        <motion.p
          className="gift-hand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isOpen ? "Nº — opened just now" : "Nº — sealed, for you"}
        </motion.p>

        {/* The ticket below prints the title. The headline carries the moment
            instead, or the two say the same thing twice. */}
        <h1 className="mt-4 text-center font-serif text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {isOpen ? (
            <>
              Yours <em className="italic text-rose">now</em>.
            </>
          ) : (
            <>
              Something came <em className="italic text-rose">for you</em>
            </>
          )}
        </h1>

        {/* ─── the object ───
            Both layers share one grid cell so the ticket can rise from behind
            the envelope rather than replacing it. The envelope keeps the
            higher stacking order until it falls away. */}
        <div className="relative mt-10 grid w-full max-w-[26rem] place-items-center sm:max-w-[34rem] [perspective:1500px]">
          {/* ─── the ticket, rising out ─── */}
          {isOpen && (
            <motion.div
              className="w-full [grid-area:1/1]"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 132, scale: 0.9, rotate: -2.5 }
              }
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{
                duration: reduceMotion ? 0.3 : 0.92,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <article className="ticket-stock relative overflow-hidden rounded-2xl border border-[hsl(var(--stock-shade))] shadow-[0_1px_1px_hsl(272_30%_30%_/_0.06),0_28px_50px_-28px_hsl(272_40%_30%_/_0.5)]">
                <div className="ticket-guilloche absolute inset-x-0 top-0 h-2.5" aria-hidden="true" />

                <div className="relative px-6 pb-5 pt-6 sm:px-8">
                  <header className="flex items-center gap-3">
                    {/* A gift has no place in the book's numbering until it is
                        filed, so the head prints the date instead. */}
                    <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
                      {today}
                    </span>
                    <span className="h-px flex-1 bg-[hsl(var(--stock-shade))]" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-rose">
                      Mystery gift
                    </span>
                  </header>

                  <div className="mt-4 flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <h2 className="font-serif text-[1.75rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-[2rem]">
                        {payload.title}
                      </h2>
                      <p className="mt-1.5 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
                        {payload.description}
                      </p>
                    </div>
                    <span
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-dashed border-[hsl(var(--stock-shade))] bg-[hsl(var(--primary)/0.04)] text-2xl"
                      aria-hidden="true"
                    >
                      {payload.emoji}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-[hsl(var(--stock-shade))] pt-3">
                    <div>
                      <dt className="ticket-field-key">Costs</dt>
                      <dd className="ticket-field-val">nothing</dd>
                    </div>
                    <div>
                      <dt className="ticket-field-key">Valid</dt>
                      <dd className="ticket-field-val">forever</dd>
                    </div>
                    <div>
                      <dt className="ticket-field-key">Status</dt>
                      <dd className="ticket-field-val text-rose">yours</dd>
                    </div>
                  </dl>
                </div>
              </article>
            </motion.div>
          )}

          {/* ─── the envelope ─── */}
          <AnimatePresence>
            {!isCleared && (
              <motion.div
                key="envelope"
                className="relative z-10 w-full [grid-area:1/1]"
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={
                  isOpen && !reduceMotion
                    ? /* spent: it drops out of the frame, taking its shadow */
                      { opacity: 0, y: 190, scale: 0.94, rotate: 2.5 }
                    : { opacity: 1, y: 0, scale: 1, rotate: 0 }
                }
                exit={{ opacity: 0 }}
                transition={{
                  duration: isOpen ? 0.82 : 0.55,
                  ease: isOpen ? [0.4, 0, 0.7, 0.2] : [0.16, 1, 0.3, 1],
                }}
              >
                {/* the slow float, so the object is alive before it is touched */}
                <motion.div
                  animate={
                    reduceMotion || isBreaking ? { y: 0 } : { y: [0, -7, 0] }
                  }
                  transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* the envelope body */}
                  <div className="gift-envelope relative aspect-[1.62/1] w-full overflow-hidden rounded-[0.4rem] border border-[hsl(var(--stock-shade))] shadow-[0_2px_2px_hsl(272_30%_30%_/_0.06),0_36px_60px_-34px_hsl(272_40%_30%_/_0.5)]">
                    {/* the bottom fold — the panel the flap tucks against */}
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(0deg, hsl(272 30% 42% / 0.09), transparent 70%)",
                        clipPath: "polygon(0 100%, 50% 44%, 100% 100%)",
                        boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.6)",
                      }}
                      aria-hidden="true"
                    />
                    {/* the crease, one hairline down each side of the V */}
                    <span
                      className="absolute inset-0 opacity-80"
                      style={{
                        background:
                          "linear-gradient(to bottom right, transparent calc(50% - 0.5px), hsl(var(--stock-shade)) 50%, transparent calc(50% + 0.5px)), linear-gradient(to bottom left, transparent calc(50% - 0.5px), hsl(var(--stock-shade)) 50%, transparent calc(50% + 0.5px))",
                        clipPath: "polygon(0 100%, 50% 44%, 100% 100%)",
                      }}
                      aria-hidden="true"
                    />

                    {/* the mouth darkens as the flap lifts — the inside of an
                        envelope is a shadow, and it is what the ticket climbs
                        out of */}
                    <motion.span
                      className="absolute inset-x-0 top-0 h-[46%]"
                      style={{
                        background:
                          "linear-gradient(180deg, hsl(272 34% 26% / 0.5), transparent)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isBreaking ? 1 : 0 }}
                      transition={{ duration: 0.5, delay: 0.18 }}
                      aria-hidden="true"
                    />

                    {/* a sheen crossing the paper — the light in the room
                        moving, not a glow bolted to a card */}
                    {!reduceMotion && (
                      <motion.span
                        className="pointer-events-none absolute inset-y-0 w-1/3"
                        style={{
                          background:
                            "linear-gradient(100deg, transparent, hsl(0 0% 100% / 0.55), transparent)",
                        }}
                        initial={{ x: "-140%" }}
                        animate={{ x: "420%" }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          repeatDelay: 4.6,
                          ease: "easeInOut",
                        }}
                        aria-hidden="true"
                      />
                    )}

                    <div className="ticket-guilloche absolute inset-x-0 bottom-0 h-2" aria-hidden="true" />
                    {/* the one thing written on the back of an envelope: who it
                        is for, in the hand of whoever sealed it */}
                    <p className="absolute bottom-3.5 left-0 right-0 text-center font-script text-[1.6rem] leading-none text-[hsl(272_26%_36%)] sm:text-[1.9rem]">
                      for you, <span className="text-rose">whenever</span>
                    </p>
                  </div>

                  {/* the flap, hinged along the top edge */}
                  <motion.div
                    className="gift-flap absolute inset-x-0 top-0 h-[52%] origin-top border-x border-b border-[hsl(var(--stock-shade))]"
                    animate={
                      isBreaking && !reduceMotion
                        ? { rotateX: -168, y: -2 }
                        : { rotateX: 0 }
                    }
                    transition={{
                      duration: 0.72,
                      delay: 0.14,
                      ease: [0.22, 1.1, 0.36, 1],
                    }}
                    style={{ transformStyle: "preserve-3d" }}
                    aria-hidden="true"
                  />

                  {/* ─── the wax ─── */}
                  <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
                    <AnimatePresence>
                      {!isBreaking && (
                        <motion.button
                          ref={sealRef}
                          type="button"
                          onClick={open}
                          className="gift-wax rounded-full outline-none ring-offset-4 ring-offset-[hsl(var(--stock))] focus-visible:ring-2 focus-visible:ring-rose"
                          aria-label="Break the seal and open the gift"
                          animate={
                            reduceMotion
                              ? {}
                              : { scale: [1, 1.045, 1], rotate: [0, -1.4, 0] }
                          }
                          transition={{
                            duration: 3.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          whileHover={reduceMotion ? {} : { scale: 1.07 }}
                          whileTap={{ scale: 0.92 }}
                          exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        >
                          {/* A monogram, never the payload's emoji — the seal
                              must not say what is inside. */}
                          <span className="font-serif text-2xl leading-none" aria-hidden="true">
                            ♥
                          </span>
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {/* the wax breaks the way wax breaks: in two, along a line,
                        and then in pieces */}
                    {isBreaking && !reduceMotion && (
                      <>
                        {[-1, 1].map((side) => (
                          <motion.span
                            key={side}
                            className="gift-wax absolute left-1/2 top-1/2"
                            style={{
                              clipPath:
                                side < 0
                                  ? "polygon(0 0, 52% 0, 44% 34%, 54% 62%, 46% 100%, 0 100%)"
                                  : "polygon(52% 0, 100% 0, 100% 100%, 46% 100%, 54% 62%, 44% 34%)",
                            }}
                            initial={{ x: "-50%", y: "-50%", opacity: 1 }}
                            animate={{
                              x: `calc(-50% + ${side * 46}px)`,
                              y: `calc(-50% + 30px)`,
                              rotate: side * 42,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.62, ease: [0.3, 0.8, 0.5, 1] }}
                            aria-hidden="true"
                          />
                        ))}
                        {SHARDS.map((shard, i) => (
                          <motion.span
                            key={i}
                            className="gift-wax absolute left-1/2 top-1/2"
                            initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 0.5 }}
                            animate={{
                              x: `calc(-50% + ${shard.x}px)`,
                              y: `calc(-50% + ${shard.y}px)`,
                              rotate: shard.r,
                              scale: shard.s,
                              opacity: 0,
                            }}
                            transition={{
                              duration: 0.78,
                              delay: shard.d,
                              ease: [0.3, 0.9, 0.5, 1],
                            }}
                            aria-hidden="true"
                          />
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── what to do next ─── */}
        <div className="mt-8 min-h-[3.25rem]">
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.55 }}
              >
                <Link
                  to="/coupons"
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-rose bg-rose px-5 py-3 font-medium text-white transition-gentle hover:brightness-95 sm:w-auto"
                >
                  Put it in the ticket book
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => navigate("/scan-qr")}
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border px-5 py-3 font-medium text-foreground transition-gentle hover:border-foreground sm:w-auto"
                >
                  <QrCode className="h-4 w-4" />
                  Scan another card
                </button>
              </motion.div>
            ) : (
              <motion.p
                className="text-center text-[15px] leading-relaxed text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isBreaking ? (
                  <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-rose">
                    breaking the seal…
                  </span>
                ) : (
                  <>Press the seal. Jangan malu-malu.</>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Screen readers get the outcome as a sentence, not as an animation. */}
        <p className="sr-only" role="status" aria-live="polite">
          {isOpen
            ? `Gift opened: ${payload.title}. ${payload.description}`
            : "A sealed gift is waiting. Activate the seal to open it."}
        </p>
      </main>
    </div>
  );
};

export default MysteryGiftRevealPage;
