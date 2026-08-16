import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import type { Team } from "@/utils/trainerCard";

/** The moment a coupon stops being a sprite in a bag and becomes something
 *  someone actually owes you. Plays once, on a successful redeem, over the
 *  item sheet — the sheet closes only after this is dismissed.
 *
 *  Direction: *item-get fanfare* — the sprite lifts, spins, and burns out into
 *  light while the real-life reward lands under it. The alternative direction
 *  we considered and can still switch to is the Gen-3 battle sequence: white
 *  flash, sprite pulse, then a pixel-bordered dialogue box typing out "Shaz
 *  used the ORAN BERRY!" with a blinking ▼. Swapping means replacing the
 *  `Stage` block below — the props, the dismiss contract, and BagTab's call
 *  site all stay as they are.
 */
interface ItemUsedFanfareProps {
  /** PokéAPI sprite of the item just spent. Absent while details are still cold. */
  spriteUrl?: string | null;
  /** Slug or PokéAPI name, hyphenated — rendered spaced and uppercase. */
  name: string;
  /** What it's worth in real life. The reason this screen exists. */
  action: string;
  team: Team;
  onDone: () => void;
}

/** Radial burst. Angles are evenly spread and then jittered so the ring reads as
 *  scatter rather than a clock face; the values are fixed per mount so a
 *  re-render mid-flight doesn't teleport a particle. */
const PARTICLE_COUNT = 16;

const buildParticles = () =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const distance = 96 + Math.random() * 104;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 3 + Math.round(Math.random() * 3),
      delay: 0.16 + Math.random() * 0.12,
      duration: 0.75 + Math.random() * 0.45,
      /** Every third fleck carries the rose instead of the team colour, so the
       *  burst belongs to the site and not only to her team. */
      rose: i % 3 === 0,
    };
  });

/** Centres a layer on its parent without touching `transform` — Framer writes the
 *  whole transform when it animates scale or rotate, so a `-translate-x-1/2`
 *  would be dropped the moment the burst starts. Negative margins survive it. */
const centred = (size: number) => ({
  position: "absolute" as const,
  left: "50%",
  top: "50%",
  width: size,
  height: size,
  marginLeft: -size / 2,
  marginTop: -size / 2,
});

const ItemUsedFanfare = ({ spriteUrl, name, action, team, onDone }: ItemUsedFanfareProps) => {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const particles = useMemo(buildParticles, []);
  const label = name.replace(/-/g, " ");

  useEffect(() => {
    rootRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        onDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  // Reduced motion keeps the composition and drops the travel: everything
  // arrives at once, no spin, no burst, no rotating rays.
  const ease = [0.16, 1, 0.3, 1] as const;
  const rise = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease },
        };

  return createPortal(
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Used ${label}. ${action}`}
      tabIndex={-1}
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden bg-background px-6 outline-none"
    >
      {/* ── Stage ── the light the item leaves behind ──
          Every layer is a grid item in the same cell, so the stack stays centred
          on the sprite without a translate — Framer writes `transform` wholesale
          and would drop a Tailwind `-translate-x-1/2` the moment it animates. */}
      <div className="relative grid place-items-center">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Rays. Masked to a soft annulus so the spokes never touch the sprite
            or reach the screen edge as hard lines. */}
        {!reduceMotion && (
          <motion.div
            style={{
              ...centred(660),
              background: `repeating-conic-gradient(from 0deg, rgb(${team.glow} / 0.4) 0deg 5deg, transparent 5deg 17deg)`,
              WebkitMaskImage:
                "radial-gradient(circle, transparent 14%, black 30%, transparent 58%)",
              maskImage: "radial-gradient(circle, transparent 14%, black 30%, transparent 58%)",
            }}
            /* Loud on the release, then down to a wash — by the time the reward
               line lands the spokes must not compete with it for the eye. */
            initial={{ opacity: 0, scale: 0.55, rotate: 0 }}
            animate={{ opacity: [0, 0.9, 0.9, 0.18], scale: 1, rotate: 22 }}
            transition={{
              opacity: { duration: 1.6, times: [0, 0.16, 0.36, 1] },
              scale: { duration: 0.9, ease },
              rotate: { duration: 14, ease: "linear" },
            }}
          />
        )}

        {/* Flash. One wash of team colour on the release, gone in under half a second. */}
        {!reduceMotion && (
          <motion.div
            className="rounded-full"
            style={{
              ...centred(520),
              background: `radial-gradient(circle, rgb(${team.glow} / 0.55) 0%, transparent 62%)`,
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.9, 0], scale: 1.6 }}
            transition={{ duration: 0.55, times: [0, 0.22, 1], ease: "easeOut" }}
          />
        )}

        {/* Shockwave ring. Reads as the item's edge leaving. */}
        {!reduceMotion && (
          <motion.div
            className="rounded-full border-2"
            style={{ ...centred(160), borderColor: team.accent }}
            initial={{ opacity: 0.7, scale: 0.35 }}
            animate={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 0.8, delay: 0.08, ease }}
          />
        )}

        {/* Flecks. Square, not round — the sprite they came off is pixel art. */}
        {!reduceMotion &&
          particles.map((p, i) => (
            <motion.span
              key={i}
              className="rounded-[1px]"
              style={{
                ...centred(p.size),
                background: p.rose ? "hsl(var(--rose))" : team.accent,
              }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], x: p.x, y: p.y, scale: 1 }}
              transition={{ duration: p.duration, delay: p.delay, ease }}
            />
          ))}
      </div>

      {/* ── The item, spending itself ── */}
      <motion.div
        className="col-start-1 row-start-1"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 30, rotate: -14 }}
        animate={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: [0, 1, 1, 0.85], scale: [0.5, 1.22, 1.05, 1], y: 0, rotate: [-14, 6, 0] }
        }
        transition={
          reduceMotion
            ? { duration: 0.25 }
            : { duration: 1.1, times: [0, 0.32, 0.5, 1], ease }
        }
      >
        {/* A held breath, not a rest — the item hangs in the light until she
            taps on. Starts only once the entrance has landed. */}
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 3.4, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {spriteUrl ? (
            <img
              src={spriteUrl}
              alt=""
              className="h-36 w-36 drop-shadow-[0_12px_30px_rgba(0,0,0,0.16)] sm:h-44 sm:w-44"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <Sparkles className="h-28 w-28" style={{ color: team.accent }} aria-hidden />
          )}
        </motion.div>
      </motion.div>
      </div>

      {/* ── What just happened, then what it's worth ── */}
      <motion.p
        {...rise(0.5)}
        className="relative mt-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-rose"
      >
        Used the {label}
      </motion.p>

      <motion.p
        {...rise(0.66)}
        className="relative mt-3 max-w-md text-balance text-center font-serif text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl"
      >
        {action}
      </motion.p>

      <motion.span
        {...rise(0.82)}
        className="relative mt-6 h-px w-14 bg-border"
        aria-hidden
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduceMotion ? 0.2 : 1.05 }}
        className="relative mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
      >
        Tap to continue
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 3, 0], opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </motion.span>
      </motion.p>
    </motion.div>,
    document.body,
  );
};

export default ItemUsedFanfare;
