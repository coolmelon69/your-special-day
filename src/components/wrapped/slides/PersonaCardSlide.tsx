import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { MOCK_DATA } from "../slideData";
import WrappedSlide from "../WrappedSlide";
import { cn } from "@/lib/utils";

const FLOATERS = ["💕", "💢", "💖", "🔥", "🥰", "⚡", "💗", "😡"];

const TraitBar = ({
  name,
  value,
  index,
}: {
  name: string;
  value: number;
  index: number;
}) => {
  const isRage = name === "Ragebaiting";
  const isLove = name === "I love U's given";
  const isSpecial = isRage || isLove;
  const overflow = value > 100;
  const display = isLove ? "33 times" : `${value}%`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.12 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("font-sans text-sm sm:text-base font-medium", isRage ? "text-rose" : "text-foreground")}>
          {name}
        </span>
        <span
          className={cn(
            "font-mono text-sm font-semibold flex items-center gap-1",
            isSpecial ? "text-rose" : "text-primary"
          )}
        >
          {overflow && <Flame className="w-3.5 h-3.5" />}
          {display}
        </span>
      </div>

      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isSpecial ? "bg-gradient-to-r from-rose to-rose/70" : "bg-gradient-to-r from-primary to-periwinkle"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, delay: 0.6 + index * 0.12, ease: "easeOut" }}
        >
          {/* shimmer sweep on overflow / love bars */}
          {isSpecial && (
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: "linear" }}
            />
          )}
        </motion.div>

        {/* overflow glow cap — the bar "breaks the limit" */}
        {overflow && (
          <motion.span
            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose"
            style={{ filter: "blur(4px)" }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </motion.div>
  );
};

const PersonaCardSlide = () => {
  return (
    <WrappedSlide tone="lavender" glyphs={false}>
      {/* soft floating emoji particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {FLOATERS.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl sm:text-3xl"
            style={{ left: `${8 + (i % 4) * 26}%`, bottom: "-10%", opacity: 0.45 }}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: "-130%", opacity: [0, 0.5, 0.4, 0], scale: [0.6, 1, 0.9], x: [0, i % 2 ? 18 : -18, 0] }}
            transition={{ duration: 5 + (i % 3), delay: i * 0.4, repeat: Infinity, repeatDelay: 1.5, ease: "easeOut" }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-rose/40 bg-card/90 backdrop-blur-sm p-6 sm:p-8 shadow-romantic text-left"
        initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Eyebrow no="Nº 10">The persona</Eyebrow>
        <DisplayHeading as="h2" className="mt-3 mb-7 text-center">
          <em>{MOCK_DATA.persona.title}</em>
        </DisplayHeading>

        <div className="space-y-5">
          {MOCK_DATA.persona.traits.map((trait, index) => (
            <TraitBar key={trait.name} name={trait.name} value={trait.value} index={index} />
          ))}
        </div>

        <motion.p
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          — This is who you are, together
        </motion.p>
      </motion.div>
    </WrappedSlide>
  );
};

export default PersonaCardSlide;
