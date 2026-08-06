import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Map,
  Star,
  PenLine,
  Camera,
  Heart,
  Sparkles,
  Check,
  Lock,
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

/** Every track gets its own silhouette, the way a gym badge case reads as seven different
 *  objects on a velvet page rather than one shape stamped seven times. The icon inside
 *  confirms the track; the outline is what you recognise from across the room. */
const TRACK_SHAPE: Record<string, string> = {
  // Explorer — a compass bezel.
  Compass: "M50 3 L83 16 L97 49 L84 82 L51 97 L18 84 L3 51 L16 18 Z",
  // Cartographer — a map-maker's shield.
  Map: "M50 3 L93 16 V50 C93 73 74 89 50 97 C26 89 7 73 7 50 V16 Z",
  // Critics' Circle — a ten-point rosette.
  Star: "M50 2 L65.3 29 L95.7 35.2 L74.7 58 L78.2 88.8 L50 76 L21.8 88.8 L25.3 58 L4.3 35.2 L34.7 29 Z",
  // Storytellers — an upright hexagon, like a nib seen end-on.
  PenLine: "M50 2 L92 26 V74 L50 98 L8 74 V26 Z",
  // Shutterbugs — a chamfered plate, the shape of a film gate.
  Camera: "M27 5 H73 L95 27 V73 L73 95 H27 L5 73 V27 Z",
  // Keepers — a heart crest.
  Heart:
    "M50 96 C21 77 6 57 6 37 C6 19 19 6 33 6 C42 6 48 11 50 18 C52 11 58 6 67 6 C81 6 94 19 94 37 C94 57 79 77 50 96 Z",
  // Perfect Dates — a four-point sparkle.
  Sparkles: "M50 2 C58 21 79 42 98 50 C79 58 58 79 50 98 C42 79 21 58 2 50 C21 42 42 21 50 2 Z",
};

const FALLBACK_SHAPE = TRACK_SHAPE.PenLine;

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

/** Metal ramps per tier — a deliberate local exception to the token palette, same precedent
 *  as the Ticketbook's local `--stock`/`--print` tokens (DESIGN_SYSTEM.md §14): these are
 *  literal metals, not semantic app colors, so they live here rather than in index.css.
 *  `bounce` is the light kicking back off the table into the bottom edge — the stop that
 *  separates a polished pin from a flat gradient. */
const TIER_METAL: Record<
  AchievementTierProgress["tier"],
  { light: string; mid: string; dark: string; bounce: string; enamel: string; glow: string }
> = {
  bronze: {
    light: "#f7d4a4",
    mid: "#c9803a",
    dark: "#5c3210",
    bounce: "#e0a468",
    enamel: "#7d451a",
    glow: "201 124 58",
  },
  silver: {
    light: "#ffffff",
    mid: "#c4ccd7",
    dark: "#666e7e",
    bounce: "#eef1f5",
    enamel: "#79808f",
    glow: "150 160 176",
  },
  gold: {
    light: "#fff6c9",
    mid: "#e9b622",
    dark: "#7d5804",
    bounce: "#ffd873",
    enamel: "#9b6f06",
    glow: "233 182 34",
  },
};

/** Sweep order down a row: bronze catches the light, then silver, then gold. */
const SHEEN_DELAY: Record<AchievementTierProgress["tier"], number> = {
  bronze: 0,
  silver: 0.55,
  gold: 1.1,
};

const PinBadge = ({
  tier,
  iconKey,
  Icon,
  locked,
  isActive,
  pct,
  justUnlocked,
}: {
  tier: AchievementTierProgress["tier"];
  iconKey: string;
  Icon: LucideIcon;
  locked: boolean;
  isActive: boolean;
  pct: number;
  justUnlocked: boolean;
}) => {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const metal = TIER_METAL[tier];
  const shape = TRACK_SHAPE[iconKey] ?? FALLBACK_SHAPE;

  const clipId = `pin-clip-${uid}`;
  const metalId = `pin-metal-${uid}`;
  const enamelId = `pin-enamel-${uid}`;
  const bevelId = `pin-bevel-${uid}`;
  const recessId = `pin-recess-${uid}`;
  const glossId = `pin-gloss-${uid}`;
  const sheenId = `pin-sheen-${uid}`;
  const holoId = `pin-holo-${uid}`;
  const progId = `pin-prog-${uid}`;

  /** The struck body: rim in metal, recessed enamel plate, bevel light along the top-left. */
  const Body = ({ fill, plate, stroke }: { fill: string; plate: string; stroke: string }) => (
    <g>
      <path d={shape} fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
      <g transform="translate(50 50) scale(0.7) translate(-50 -50)">
        <path d={shape} fill={plate} stroke={stroke} strokeWidth="3.4" strokeLinejoin="round" />
        {/* the plate is sunk into the rim: shadow on its top edge, light on its bottom */}
        <path
          d={shape}
          fill="none"
          stroke={`url(#${recessId})`}
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
      </g>
      <path
        d={shape}
        fill="none"
        stroke={`url(#${bevelId})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  );

  // A locked-but-active tier fills from the bottom as you close in — the pin is literally
  // being cast. Everything below the waterline is finished metal, everything above is blank.
  const showProgress = locked && isActive && pct > 0;

  return (
    <div className="relative h-20 w-20 sm:h-24 sm:w-24">
      {/* the pin clasp, catching its own highlight */}
      <div
        className={cn(
          "absolute left-1/2 top-0 z-10 h-3 w-3 -translate-x-1/2 -translate-y-[45%] rounded-full border",
          locked
            ? "border-border bg-muted"
            : "border-black/15 bg-[radial-gradient(circle_at_32%_28%,#fff,rgba(120,120,130,0.85))] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        )}
      />

      {/* seated glow — an unlocked pin throws a little of its own colour onto the page */}
      {!locked && (
        <div
          className="pointer-events-none absolute inset-[-18%] rounded-full opacity-70 blur-xl"
          style={{ background: `radial-gradient(circle, rgb(${metal.glow} / 0.35), transparent 68%)` }}
          aria-hidden
        />
      )}

      <svg
        viewBox="0 0 100 100"
        className={cn(
          "relative h-full w-full",
          locked
            ? "drop-shadow-[0_2px_3px_rgba(60,50,80,0.10)]"
            : "drop-shadow-[0_5px_7px_rgba(50,40,70,0.28)]"
        )}
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <path d={shape} />
          </clipPath>
          <linearGradient id={metalId} x1="14" y1="4" x2="86" y2="98" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={metal.light} />
            <stop offset="38%" stopColor={metal.mid} />
            <stop offset="74%" stopColor={metal.dark} />
            <stop offset="100%" stopColor={metal.bounce} />
          </linearGradient>
          <linearGradient id={enamelId} x1="20" y1="20" x2="80" y2="86" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={metal.enamel} />
            <stop offset="100%" stopColor={metal.dark} />
          </linearGradient>
          <linearGradient id={bevelId} x1="18" y1="8" x2="82" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={recessId} x1="20" y1="12" x2="80" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#000" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id={glossId} cx="30%" cy="20%" r="52%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="48%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* gold alone gets the holographic pass — the tier you actually chase */}
          <linearGradient id={holoId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--rose))" stopOpacity="0" />
            <stop offset="35%" stopColor="hsl(var(--rose))" stopOpacity="0.55" />
            <stop offset="65%" stopColor="hsl(var(--periwinkle))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--periwinkle))" stopOpacity="0" />
          </linearGradient>
          <clipPath id={progId}>
            <rect x="0" y={100 - pct} width="100" height={pct} />
          </clipPath>
        </defs>

        {locked ? (
          <>
            {/* the empty setting in the case — struck into the page, not floating on it */}
            <Body fill="hsl(var(--accent))" plate="hsl(var(--background))" stroke="hsl(var(--lilac))" />
            {showProgress && (
              <g clipPath={`url(#${progId})`}>
                <Body fill={`url(#${metalId})`} plate={`url(#${enamelId})`} stroke={metal.dark} />
                <path d={shape} fill={`url(#${glossId})`} />
              </g>
            )}
            {showProgress && (
              <g clipPath={`url(#${clipId})`}>
                <rect x="0" y={100 - pct - 1} width="100" height="2" fill={metal.light} opacity="0.9" />
              </g>
            )}
          </>
        ) : (
          <>
            <Body fill={`url(#${metalId})`} plate={`url(#${enamelId})`} stroke={metal.dark} />
            <path d={shape} fill={`url(#${glossId})`} />
            <g clipPath={`url(#${clipId})`}>
              <g transform="rotate(20 50 50)">
                {reduceMotion ? (
                  <rect x="18" y="-25" width="20" height="150" fill={`url(#${sheenId})`} opacity="0.5" />
                ) : (
                  <>
                    <motion.rect
                      y="-25"
                      width="24"
                      height="150"
                      fill={`url(#${sheenId})`}
                      initial={{ x: -45 }}
                      animate={{ x: [-45, 118] }}
                      transition={{
                        duration: 1.15,
                        ease: [0.4, 0, 0.2, 1],
                        repeat: Infinity,
                        repeatDelay: 5.2,
                        delay: justUnlocked ? 0.25 : SHEEN_DELAY[tier],
                      }}
                    />
                    {tier === "gold" && (
                      <motion.rect
                        y="-25"
                        width="46"
                        height="150"
                        fill={`url(#${holoId})`}
                        initial={{ x: -60 }}
                        animate={{ x: [-60, 118] }}
                        transition={{
                          duration: 2.6,
                          ease: "linear",
                          repeat: Infinity,
                          repeatDelay: 3.7,
                          delay: 1.9,
                        }}
                      />
                    )}
                  </>
                )}
              </g>
            </g>
          </>
        )}

        {/* unlock shockwave — one ring, out and gone */}
        {justUnlocked && !reduceMotion && (
          <motion.path
            d={shape}
            fill="none"
            stroke={metal.light}
            strokeWidth="3"
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 1.75, opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.12 }}
            style={{ transformOrigin: "50px 50px" }}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {locked && !showProgress ? (
          <Lock className="h-4 w-4 text-muted-foreground/45 sm:h-[1.15rem] sm:w-[1.15rem]" aria-hidden />
        ) : locked ? (
          // The icon fills with the badge: ghosted above the waterline, struck white below it.
          <div className="relative h-7 w-7 sm:h-8 sm:w-8">
            <Icon className="absolute inset-0 h-full w-full text-muted-foreground/55" aria-hidden />
            <Icon
              className="absolute inset-0 h-full w-full text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.45)]"
              style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}
              aria-hidden
            />
          </div>
        ) : (
          <Icon
            className="h-7 w-7 text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.45)] sm:h-8 sm:w-8"
            aria-hidden
          />
        )}
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
      whileHover={{ y: -4, scale: 1.04 }}
      className="flex flex-col items-center rounded-xl p-2 text-center sm:p-3"
    >
      <PinBadge
        tier={achievement.tier}
        iconKey={achievement.icon}
        Icon={Icon}
        locked={locked}
        isActive={isActive}
        pct={pct}
        justUnlocked={justUnlocked}
      />

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
    </motion.div>
  );
};

export default AchievementCard;
