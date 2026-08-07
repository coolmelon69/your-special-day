/** Colour tokens a level tier can wear on the trainer card. */
export const TIER_COLORS = ["muted", "foreground", "periwinkle", "primary", "rose"] as const;
export type TierColor = (typeof TIER_COLORS)[number];

/** Literal Tailwind classes per tier colour (Tailwind can't see interpolated names). */
export const TIER_COLOR_CLASSES: Record<TierColor, { text: string; bg: string; border: string; label: string }> = {
  muted: { text: "text-muted-foreground", bg: "bg-muted-foreground", border: "border-muted-foreground", label: "Slate" },
  foreground: { text: "text-foreground", bg: "bg-foreground", border: "border-foreground", label: "Ink" },
  periwinkle: { text: "text-periwinkle", bg: "bg-periwinkle", border: "border-periwinkle", label: "Periwinkle" },
  primary: { text: "text-primary", bg: "bg-primary", border: "border-primary", label: "Purple" },
  rose: { text: "text-rose", bg: "bg-rose", border: "border-rose", label: "Rose" },
};

export type XpWeights = { badge: number; stamp: number; visit: number };
export type LevelTier = { name: string; minXp: number; color: TierColor; icon: string };

/** Everything the admin can tune about levelling. */
export type TrainerCardConfig = { weights: XpWeights; tiers: LevelTier[] };

export const XP_WEIGHTS: XpWeights = { badge: 5, stamp: 2, visit: 3 };

export const LEVEL_TIERS: LevelTier[] = [
  { name: "Rookie", minXp: 0, color: "muted", icon: "🌱" },
  { name: "Trainer", minXp: 20, color: "foreground", icon: "🎒" },
  { name: "Ace", minXp: 50, color: "periwinkle", icon: "⭐" },
  { name: "Elite", minXp: 100, color: "primary", icon: "💎" },
  { name: "Champion", minXp: 200, color: "rose", icon: "👑" },
];

export const DEFAULT_TRAINER_CONFIG: TrainerCardConfig = {
  weights: XP_WEIGHTS,
  tiers: LEVEL_TIERS,
};

export const computeXp = (
  badges: number,
  stamps: number,
  visits: number,
  weights: XpWeights = XP_WEIGHTS,
): number => badges * weights.badge + stamps * weights.stamp + visits * weights.visit;

export type AvatarPreset = { id: string; icon: string; label: string };

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "pikachu", icon: "⚡", label: "Sparky" },
  { id: "eevee", icon: "🦊", label: "Evee" },
  { id: "bulbasaur", icon: "🌱", label: "Sprout" },
  { id: "squirtle", icon: "🐢", label: "Shellback" },
  { id: "charmander", icon: "🔥", label: "Ember" },
  { id: "jigglypuff", icon: "🎈", label: "Puff" },
  { id: "psyduck", icon: "🦆", label: "Quack" },
  { id: "meowth", icon: "🐱", label: "Whiskers" },
];

export type TeamId = "blossom" | "dusk" | "lumen";

export interface Team {
  id: TeamId;
  name: string;
  motto: string;
  /** Light wash behind the card header. Text on it must be `ink`, never white. */
  tint: string;
  /** Mid-strength fill: level ring, XP bar, rim. */
  accent: string;
  /** Dark end of the same hue — the only colour used for text on `tint`. */
  ink: string;
  /** "r g b" for shadows and glows, so opacity can be applied at the call site. */
  glow: string;
}

/** Three teams, named for the palette this site already owns rather than borrowed from
 *  the games. Each is one hue at three strengths so a card reads as one material. */
export const TEAMS: Team[] = [
  {
    id: "blossom",
    name: "Team Blossom",
    motto: "Chase the sweet stops.",
    tint: "hsl(330 60% 95%)",
    accent: "hsl(330 60% 62%)",
    ink: "hsl(330 55% 30%)",
    glow: "216 100 158",
  },
  {
    id: "dusk",
    name: "Team Dusk",
    motto: "Chase the quiet hours.",
    tint: "hsl(255 45% 95%)",
    accent: "hsl(255 45% 63%)",
    ink: "hsl(255 45% 31%)",
    glow: "139 118 203",
  },
  {
    id: "lumen",
    name: "Team Lumen",
    motto: "Chase the golden light.",
    tint: "hsl(42 85% 93%)",
    accent: "hsl(42 82% 50%)",
    ink: "hsl(35 70% 25%)",
    glow: "233 182 34",
  },
];

export const teamFor = (teamId: string | null | undefined): Team =>
  TEAMS.find((t) => t.id === teamId) ?? TEAMS[0];

/** A stable 12-digit trainer ID from the user's uuid, grouped 4-4-4 like a friend code.
 *  Cosmetic only — it identifies the card, never a record. */
export const trainerIdFor = (userId: string | null | undefined): string => {
  let hash = 0;
  for (const char of userId ?? "trainer") {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000_000_000;
  }
  const digits = String(hash).padStart(12, "0").slice(-12);
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
};

export interface TrainerStats {
  badges: number;
  stamps: number;
  visits: number;
  xp: number;
  level: string;
  /** 1-based tier position — the number that sits inside the level ring. */
  levelNumber: number;
  levelColor: TierColor;
  levelIcon: string;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  nextLevel: string | null;
}

export const computeTrainerStats = (
  badges: number,
  stamps: number,
  visits: number,
  config: TrainerCardConfig = DEFAULT_TRAINER_CONFIG,
): TrainerStats => {
  const weights = config.weights ?? XP_WEIGHTS;
  // Thresholds are authored in the admin panel, so never trust the order.
  const tiers = (config.tiers?.length ? [...config.tiers] : LEVEL_TIERS).sort((a, b) => a.minXp - b.minXp);
  const xp = computeXp(badges, stamps, visits, weights);

  let currentTierIndex = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].minXp) currentTierIndex = i;
  }
  const currentTier = tiers[currentTierIndex];
  const nextTier = tiers[currentTierIndex + 1] ?? null;

  return {
    badges,
    stamps,
    visits,
    xp,
    level: currentTier.name,
    levelNumber: currentTierIndex + 1,
    levelColor: currentTier.color ?? "rose",
    levelIcon: currentTier.icon ?? "⭐",
    xpIntoLevel: xp - currentTier.minXp,
    xpForNextLevel: nextTier ? nextTier.minXp - currentTier.minXp : null,
    nextLevel: nextTier?.name ?? null,
  };
};

/** Admin-facing validation. Returns a human message, or null when the config is usable. */
export const validateTrainerConfig = (config: TrainerCardConfig): string | null => {
  const { weights, tiers } = config;
  for (const [key, value] of Object.entries(weights)) {
    if (!Number.isFinite(value) || value < 0) return `XP per ${key} must be zero or more.`;
  }
  if (Object.values(weights).every((w) => w === 0)) return "At least one XP source must be worth more than zero.";
  if (!tiers.length) return "There must be at least one rank.";
  if (tiers.some((t) => !t.name.trim())) return "Every rank needs a name.";
  if (tiers.some((t) => !Number.isFinite(t.minXp) || t.minXp < 0)) return "Rank XP must be zero or more.";

  const sorted = [...tiers].sort((a, b) => a.minXp - b.minXp);
  if (sorted[0].minXp !== 0) return "The first rank must start at 0 XP.";
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minXp === sorted[i - 1].minXp) {
      return `"${sorted[i].name}" and "${sorted[i - 1].name}" start at the same XP.`;
    }
  }
  return null;
};
