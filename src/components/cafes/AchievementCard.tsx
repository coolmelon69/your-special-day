import { useId } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Map,
  Star,
  PenLine,
  Camera,
  Heart,
  Sparkles,
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

/** Metal gradient stops per tier — a deliberate local exception to the token palette,
 *  same precedent as the Ticketbook's local `--stock`/`--print` tokens (DESIGN_SYSTEM.md §14):
 *  these are literal metals, not semantic app colors, so they live here rather than in index.css. */
const TIER_METAL: Record<AchievementTierProgress["tier"], [string, string, string]> = {
  bronze: ["#e0a568", "#a8632b", "#5e340f"],
  silver: ["#f4f6f8", "#c3c9d1", "#7d8492"],
  gold: ["#ffe58a", "#d4a017", "#8a6206"],
};

/** The shield-shaped enamel pin body. One shape for every track — the icon inside
 *  is what differentiates tracks, the same way a gym badge case reads by icon, not silhouette. */
const PinBadge = ({
  tier,
  Icon,
  locked,
}: {
  tier: AchievementTierProgress["tier"];
  Icon: LucideIcon;
  locked: boolean;
}) => {
  const uid = useId();
  const gradId = `pin-metal-${uid}`;
  const glossId = `pin-gloss-${uid}`;
  const [light, mid, dark] = TIER_METAL[tier];

  return (
    <div className="relative h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]">
      {/* pin clasp */}
      <div
        className={cn(
          "absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border",
          locked ? "border-border bg-muted" : "border-black/10 bg-gradient-to-br from-white/80 to-muted-foreground/40"
        )}
      />
      <svg
        viewBox="0 0 100 100"
        className={cn(
          "h-full w-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.18)]",
          locked && "grayscale"
        )}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={locked ? "hsl(var(--muted))" : light} />
            <stop offset="55%" stopColor={locked ? "hsl(var(--border))" : mid} />
            <stop offset="100%" stopColor={locked ? "hsl(var(--muted))" : dark} />
          </linearGradient>
          <radialGradient id={glossId} cx="32%" cy="24%" r="45%">
            <stop offset="0%" stopColor="white" stopOpacity={locked ? 0.15 : 0.85} />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M50 3 L92 21 L92 61 L50 97 L8 61 L8 21 Z"
          fill={`url(#${gradId})`}
          stroke={locked ? "hsl(var(--border))" : dark}
          strokeWidth="2"
          opacity={locked ? 0.7 : 1}
        />
        <path d="M50 3 L92 21 L92 61 L50 97 L8 61 L8 21 Z" fill={`url(#${glossId})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className={cn(
            "h-6 w-6 sm:h-7 sm:w-7",
            locked ? "text-muted-foreground/70" : "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
          )}
          aria-hidden
        />
      </div>
    </div>
  );
};

const AchievementCard = ({ achievement, isActive, justUnlocked }: AchievementCardProps) => {
  const Icon = ICONS[achievement.icon] ?? Star;
  const locked = !achievement.unlocked;
  const pct =
    achievement.threshold === 0
      ? 0
      : Math.min(100, Math.round((achievement.current / achievement.threshold) * 100));

  return (
    <motion.div
      initial={justUnlocked ? { scale: 0.6, rotate: -8 } : false}
      animate={justUnlocked ? { scale: [0.6, 1.15, 1], rotate: [-8, 4, 0] } : { scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center rounded-xl p-2 text-center sm:p-3"
    >
      <PinBadge tier={achievement.tier} Icon={Icon} locked={locked} />

      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
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
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-rose sm:text-[10px]">
          Unlocked
        </p>
      ) : isActive ? (
        <div className="mt-2 w-full">
          <p className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground sm:text-[10px]">
            {achievement.current} / {achievement.threshold}
          </p>
          <div className="mx-auto mt-1 h-1 w-full max-w-[6rem] overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground sm:text-[10px]">
          Needs {achievement.threshold}
        </p>
      )}
    </motion.div>
  );
};

export default AchievementCard;
