import { motion } from "framer-motion";

export type PokeStopMarkerState = "locked" | "active" | "captured";

interface PokeStopMarkerProps {
  state: PokeStopMarkerState;
  className?: string;
}

const STATE_COLORS: Record<PokeStopMarkerState, { disc: string; ring: string; dot: string }> = {
  locked: { disc: "hsl(220 10% 70%)", ring: "hsl(220 10% 55%)", dot: "hsl(220 10% 85%)" },
  active: { disc: "hsl(210 90% 55%)", ring: "hsl(210 90% 40%)", dot: "hsl(45 90% 60%)" },
  captured: { disc: "hsl(210 40% 60%)", ring: "hsl(210 40% 45%)", dot: "hsl(140 60% 50%)" },
};

/** PokéStop-style disc marker: grey when locked, spinning blue when active, dimmed "captured" ping when done. */
const PokeStopMarker = ({ state, className = "" }: PokeStopMarkerProps) => {
  const colors = STATE_COLORS[state];

  return (
    <motion.svg
      viewBox="0 0 32 32"
      className={`w-full h-full ${state === "locked" ? "opacity-50 grayscale" : ""} ${className}`}
      animate={state === "active" ? { rotate: 360 } : {}}
      transition={state === "active" ? { repeat: Infinity, duration: 3, ease: "linear" } : {}}
    >
      <circle cx="16" cy="16" r="14" fill={colors.disc} stroke={colors.ring} strokeWidth="2" />
      <rect x="2" y="14" width="28" height="4" fill={colors.ring} />
      <circle cx="16" cy="16" r="5" fill="white" stroke={colors.ring} strokeWidth="2" />
      <circle cx="16" cy="16" r="2.5" fill={colors.dot} />
    </motion.svg>
  );
};

export default PokeStopMarker;
