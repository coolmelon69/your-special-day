import { motion } from "framer-motion";
import {
  Compass,
  Map,
  Star,
  PenLine,
  Camera,
  Heart,
  Sparkles,
  Check,
  type LucideIcon,
} from "lucide-react";
import type { AchievementTierProgress } from "@/utils/cafeAchievements";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Compass,
  Map,
  Star,
  PenLine,
  Camera,
  Heart,
  Sparkles,
};

export interface AchievementCardProps {
  achievement: AchievementTierProgress;
  /** The closest-to-unlock tier in this track — shows a live progress bar. */
  isActive: boolean;
  /** True for one render right after this tier crosses its unlock threshold. */
  justUnlocked: boolean;
}

const TIER_LABEL: Record<AchievementTierProgress["tier"], string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

const AchievementCard = ({ achievement, isActive, justUnlocked }: AchievementCardProps) => {
  const Icon = ICONS[achievement.icon] ?? Star;
  const pct =
    achievement.threshold === 0
      ? 0
      : Math.min(100, Math.round((achievement.current / achievement.threshold) * 100));

  return (
    <motion.div
      initial={justUnlocked ? { scale: 0.8 } : false}
      animate={justUnlocked ? { scale: [0.8, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border bg-card p-3 sm:p-4",
        achievement.unlocked
          ? "border-rose/40 shadow-romantic"
          : isActive
          ? "border-primary/40"
          : "border-border opacity-60"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full sm:h-9 sm:w-9",
          achievement.unlocked ? "bg-rose/10 text-rose" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      </div>

      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:mt-3 sm:text-[10px]">
        {TIER_LABEL[achievement.tier]}
      </p>
      <p className="mt-1 font-serif text-sm font-bold leading-tight sm:text-lg">
        {achievement.title}
      </p>
      <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug text-muted-foreground sm:line-clamp-none sm:text-xs">
        {achievement.description}
      </p>

      {achievement.unlocked ? (
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-rose sm:mt-3 sm:text-[10px]">
          <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          Unlocked
        </p>
      ) : isActive ? (
        <div className="mt-2 sm:mt-3">
          <p className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground sm:text-[10px]">
            {achievement.current} / {achievement.threshold}
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground sm:mt-3 sm:text-[10px]">
          Needs {achievement.threshold}
        </p>
      )}
    </motion.div>
  );
};

export default AchievementCard;
