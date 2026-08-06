import { useCallback, useEffect, useId, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import PinBadge, { TIER_METAL, shapeFor, type Tier } from "@/components/cafes/PinBadge";
import { degreesFromDrag, isShowingBack, projectRelease, snapTarget } from "@/utils/medalRotation";
import { cn } from "@/lib/utils";

/** Slices of the extruded edge, as a fraction of half the medal's thickness.
 *  Six is enough for the rim to read as solid metal at a 40° turn without banding. */
const RIM_SLICES = [-1, -0.6, -0.2, 0.2, 0.6, 1];

export interface Medal3DProps {
  tier: Tier;
  iconKey: string;
  Icon: LucideIcon;
  locked: boolean;
  isActive: boolean;
  pct: number;
  /** Edge length of the medal in px. Drives thickness and the engraving inside it. */
  size: number;
  /** Engraved back plate. Without it the medal is front-only and never turns. */
  back?: { track: string; line: string };
}

/**
 * The pin badge given real thickness: the struck front face, an extruded rim, and
 * an engraved back, stacked in CSS 3D. Drag it and it spins with momentum, then
 * settles on the nearest face; left alone it sways just enough to catch the light.
 *
 * Locked badges are deliberately inert — a still front face, no turn. The spin is
 * something you earn.
 */
const Medal3D = ({ tier, iconKey, Icon, locked, isActive, pct, size, back }: Medal3DProps) => {
  const backGradId = `medal-back-${useId().replace(/:/g, "")}`;
  const metal = TIER_METAL[tier];
  const shape = shapeFor(iconKey);
  const reduceMotion = useReducedMotion();
  const spinnable = !locked && back !== undefined;

  /** Where the drag started, so a pan is applied relative to the resting angle. */
  const spinOrigin = useRef(0);
  /** The committed rotation: drag, momentum, and snapping all land here. */
  const spin = useMotionValue(0);
  /** The idle breath, kept separate so it can never fight an in-flight snap. */
  const sway = useMotionValue(0);
  const swayHeld = useRef(false);
  /** Pointer-driven lean, springy so the medal tips rather than snaps. */
  const tilt = useSpring(spinnable && !reduceMotion ? 3 : 0, { stiffness: 120, damping: 18 });

  const rotateY = useTransform([spin, sway], ([a, b]: number[]) => a + b);
  // The ground shadow narrows as the medal turns edge-on, the way a real one would.
  const shadowScale = useTransform(
    rotateY,
    (deg) => 0.7 + Math.abs(Math.cos((deg * Math.PI) / 180)) * 0.3
  );

  // Which face is showing is decided here rather than left to `backface-visibility`.
  // WebKit doesn't depth-sort this stack — it paints in DOM order and ignores the
  // property, so on Safari the engraved back covered the front at every angle.
  // Switching opacity at the 90° crossings does the same job on every engine.
  const frontOpacity = useTransform(rotateY, (deg) => (isShowingBack(deg) ? 0 : 1));
  const backOpacity = useTransform(rotateY, (deg) => (isShowingBack(deg) ? 1 : 0));

  const startSway = useCallback(() => {
    if (!spinnable || reduceMotion || swayHeld.current) return;
    animate(sway, [0, 8, 0, -8, 0], { duration: 7, ease: "easeInOut", repeat: Infinity });
  }, [spinnable, reduceMotion, sway]);

  // The breath runs from mount, and is handed back after every spin settles.
  useEffect(() => startSway(), [startSway]);
  useMotionValueEvent(spin, "animationComplete", startSway);

  const handlePanStart = () => {
    swayHeld.current = true;
    sway.stop();
    animate(sway, 0, { duration: 0.2 });
    spinOrigin.current = spin.get();
  };

  const handlePan = (_: PointerEvent, info: PanInfo) => {
    spin.set(spinOrigin.current + degreesFromDrag(info.offset.x));
  };

  const handlePanEnd = (_: PointerEvent, info: PanInfo) => {
    const landing = reduceMotion ? spin.get() : projectRelease(spin.get(), info.velocity.x);
    const target = snapTarget(landing);
    swayHeld.current = false;
    if (reduceMotion) {
      spin.set(target);
      startSway();
      return;
    }
    animate(spin, target, { type: "spring", stiffness: 55, damping: 13, restDelta: 0.4 });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!spinnable || reduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const fromCenter = (event.clientY - box.top) / box.height - 0.5;
    tilt.set(3 - fromCenter * 16);
  };

  const thickness = size * 0.05;

  const pin = (
    <PinBadge
      tier={tier}
      iconKey={iconKey}
      Icon={Icon}
      locked={locked}
      isActive={isActive}
      pct={pct}
      justUnlocked={false}
      size={size}
      flat={spinnable}
    />
  );

  if (!spinnable) return pin;

  /** A solid slice of the silhouette, in the darkest metal — the extruded edge. */
  const rimSlice = (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <path d={shape} fill={metal.dark} stroke={metal.dark} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div
      data-medal
      // Without this a spin drags a text selection across the page on Safari.
      className="relative select-none [-webkit-touch-callout:none]"
      style={{ width: size, height: size, perspective: size * 4 }}
      // Safari starts a text selection on pointerdown even over unselectable
      // content, and that selection eats the pointermove stream the spin needs.
      onPointerDown={(event) => event.preventDefault()}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => tilt.set(reduceMotion ? 0 : 3)}
    >
      <motion.div
        aria-hidden
        className="absolute left-1/2 rounded-[50%] bg-foreground/25 blur-md"
        style={{
          top: "100%",
          width: size * 0.6,
          height: size * 0.08,
          x: "-50%",
          marginTop: size * 0.05,
          scaleX: shadowScale,
        }}
      />

      <motion.div
        className="relative h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ rotateY, rotateX: tilt, transformStyle: "preserve-3d" }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {/* Invisible head-on, and the whole reason the medal reads as an object at angle. */}
        {RIM_SLICES.map((slice) => (
          <div
            key={slice}
            className="absolute inset-0"
            style={{ transform: `translateZ(${slice * thickness}px)` }}
          >
            {rimSlice}
          </div>
        ))}

        <motion.div
          className="absolute inset-0"
          style={{
            transform: `translateZ(${thickness}px)`,
            backfaceVisibility: "hidden",
            opacity: frontOpacity,
          }}
        >
          {pin}
        </motion.div>

        {/* The engraved reverse: what a real pin has stamped into its back plate. */}
        <motion.div
          className="absolute inset-0"
          style={{
            transform: `rotateY(180deg) translateZ(${thickness}px)`,
            backfaceVisibility: "hidden",
            opacity: backOpacity,
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            <defs>
              <linearGradient id={backGradId} x1="18" y1="8" x2="82" y2="92" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={metal.enamel} />
                <stop offset="60%" stopColor={metal.dark} />
                <stop offset="100%" stopColor={metal.enamel} />
              </linearGradient>
            </defs>
            <path
              d={shape}
              fill={`url(#${backGradId})`}
              stroke={metal.dark}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d={shape} fill="rgba(0,0,0,0.18)" transform="translate(50 50) scale(0.78) translate(-50 -50)" />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-[22%] text-center"
            style={{ color: metal.light }}
          >
            <p
              className="font-serif font-bold leading-tight drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]"
              style={{ fontSize: size * 0.085 }}
            >
              {back.track}
            </p>
            <div
              className="my-[0.8em] h-px w-7 opacity-40"
              style={{ backgroundColor: metal.light }}
              aria-hidden
            />
            <p
              className={cn("font-mono uppercase leading-snug tracking-[0.12em] opacity-85")}
              style={{ fontSize: size * 0.05 }}
            >
              {back.line}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Medal3D;
