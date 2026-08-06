import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, PieChart, Heart, Crown } from "lucide-react";
import type { CafeCategory, CafePlace } from "@/types/cafes";
import { RATER_A_LABEL, RATER_B_LABEL } from "@/types/cafes";
import { computeCafeStats } from "@/utils/cafeStats";
import { cn } from "@/lib/utils";

interface CafeStatsProps {
  categories: CafeCategory[];
  places: CafePlace[];
}

/** Counts up from 0 once in view. Formats with `format` on every tick. */
const AnimatedNumber = ({
  value,
  format,
}: {
  value: number;
  format: (rounded: number) => string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1.1, bounce: 0 });
  const display = useTransform(spring, (latest) => format(latest));

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  return <motion.span ref={ref}>{display}</motion.span>;
};

const cellVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const CafeStats = ({ categories, places }: CafeStatsProps) => {
  const stats = computeCafeStats(categories, places);

  if (stats.totalCount === 0) return null;

  return (
    <div className="relative mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:divide-x sm:divide-border">
      {/* visited */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cellVariants}
        className="rounded-lg border border-border bg-card p-4 sm:rounded-none sm:border-none md:p-5"
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Visited
        </p>
        <p className="mt-2 font-serif text-3xl font-bold leading-none tabular-nums md:text-4xl">
          <AnimatedNumber value={stats.visitedCount} format={(n) => String(Math.round(n))} />
          <span className="ml-1 text-base font-normal text-muted-foreground">
            / {stats.totalCount}
          </span>
        </p>
      </motion.div>

      {/* completion */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cellVariants}
        className="rounded-lg border border-border bg-card p-4 sm:rounded-none sm:border-none md:p-5"
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <PieChart className="h-3.5 w-3.5" aria-hidden />
          Completion
        </p>
        <p className="mt-2 font-serif text-3xl font-bold leading-none tabular-nums text-primary md:text-4xl">
          <AnimatedNumber
            value={stats.completionPct}
            format={(n) => `${Math.round(n)}%`}
          />
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionPct}%` }}
            transition={{ duration: 1.1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* ratings */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cellVariants}
        className="rounded-lg border border-border bg-card p-4 sm:rounded-none sm:border-none md:p-5"
      >
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          Avg rating
        </p>
        <div className="mt-2 space-y-0.5">
          <p className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold leading-none tabular-nums text-primary md:text-3xl">
              {stats.avgRatingHim === null ? (
                "—"
              ) : (
                <AnimatedNumber value={stats.avgRatingHim} format={(n) => n.toFixed(1)} />
              )}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
              {RATER_A_LABEL}
            </span>
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold leading-none tabular-nums text-rose md:text-3xl">
              {stats.avgRatingHer === null ? (
                "—"
              ) : (
                <AnimatedNumber value={stats.avgRatingHer} format={(n) => n.toFixed(1)} />
              )}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
              {RATER_B_LABEL}
            </span>
          </p>
        </div>
      </motion.div>

      {/* top category */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cellVariants}
        className={cn(
          "relative overflow-hidden rounded-lg border p-4 sm:rounded-none sm:border-none md:p-5",
          stats.topCategory ? "border-rose/40" : "border-border opacity-60"
        )}
      >
        {stats.topCategory && (
          <motion.div
            className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-rose opacity-20 blur-xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Crown className="h-3.5 w-3.5 text-rose" aria-hidden />
          Top category
        </p>
        {stats.topCategory ? (
          <p className="mt-2 flex items-center gap-2">
            <span className="text-2xl leading-none" aria-hidden>
              {stats.topCategory.icon ?? "🍽"}
            </span>
            <span className="truncate font-serif text-xl font-bold italic leading-tight text-rose md:text-2xl">
              {stats.topCategory.name}
            </span>
          </p>
        ) : (
          <p className="mt-2 font-serif text-2xl font-bold leading-none text-muted-foreground">
            —
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default CafeStats;
