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
import PinBadge, { TIER_LABEL } from "@/components/cafes/PinBadge";
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
  /** Opens the detail overlay on this badge. */
  onOpen: () => void;
}

const AchievementCard = ({ achievement, isActive, justUnlocked, onOpen }: AchievementCardProps) => {
  const Icon = ICONS[achievement.icon] ?? Star;
  const locked = !achievement.unlocked;
  const pct =
    achievement.threshold === 0
      ? 0
      : Math.min(100, Math.round((achievement.current / achievement.threshold) * 100));

  const state = locked
    ? `locked, ${achievement.current} of ${achievement.threshold}`
    : "unlocked";

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`${achievement.title}, ${TIER_LABEL[achievement.tier]}, ${state}`}
      initial={justUnlocked ? { scale: 0.6, rotate: -8 } : false}
      animate={justUnlocked ? { scale: [0.6, 1.15, 1], rotate: [-8, 4, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-center rounded-xl p-2 text-center outline-none ring-offset-4 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:p-3"
    >
      {/* The pin flies from here into the detail overlay and back. */}
      <motion.div layoutId={`medal-${achievement.id}`}>
        <PinBadge
          tier={achievement.tier}
          iconKey={achievement.icon}
          Icon={Icon}
          locked={locked}
          isActive={isActive}
          pct={pct}
          justUnlocked={justUnlocked}
        />
      </motion.div>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
        {TIER_LABEL[achievement.tier]}
      </p>
      <p
        className={cn(
          "mt-0.5 font-serif text-sm font-bold leading-tight sm:text-base",
          locked && "text-muted-foreground"
        )}
      >
        {achievement.title}
      </p>
      <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-snug text-muted-foreground sm:line-clamp-none sm:text-xs">
        {achievement.description}
      </p>

      {!locked ? (
        <p className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-rose sm:text-[10px]">
          <Check className="h-3 w-3" aria-hidden />
          Unlocked
        </p>
      ) : isActive ? (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-primary sm:text-[10px]">
          {achievement.current} / {achievement.threshold}
        </p>
      ) : (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground sm:text-[10px]">
          Needs {achievement.threshold}
        </p>
      )}
    </motion.button>
  );
};

export default AchievementCard;
