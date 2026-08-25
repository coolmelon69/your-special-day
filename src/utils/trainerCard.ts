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

/** `rareItem` is per rare drop. Common drops are worth zero on purpose: a stamp
 *  already earns XP and items are one-per-checkpoint, so paying for a common
 *  would be paying twice for the same event. Only rarity moves the bar. */
export type XpWeights = { badge: number; stamp: number; visit: number; rareItem: number };
export type LevelTier = { name: string; minXp: number; color: TierColor; icon: string };

/** Per-stamp XP overrides, keyed by `stampKeyOf` — the same key `stamps_progress`
 *  rows use. A stamp missing from the map is worth `weights.stamp`. Renaming or
 *  retiming a stamp changes its key, so it falls back to the default weight. */
export type StampXpMap = Record<string, number>;

/** Everything the admin can tune about levelling. */
export type TrainerCardConfig = { weights: XpWeights; tiers: LevelTier[]; stampXp?: StampXpMap };

export const XP_WEIGHTS: XpWeights = { badge: 5, stamp: 2, visit: 3, rareItem: 10 };

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

/** The one key a stamp is known by across progress rows and XP overrides. */
export const stampKeyOf = (stamp: { time: string; title: string }): string =>
  `${stamp.time}-${stamp.title}`;

/** XP a single stamp is worth: its override, or the flat weight. */
export const stampXpOf = (
  stamp: { time: string; title: string },
  config: TrainerCardConfig = DEFAULT_TRAINER_CONFIG,
): number => {
  const override = config.stampXp?.[stampKeyOf(stamp)];
  return Number.isFinite(override) ? (override as number) : (config.weights ?? XP_WEIGHTS).stamp;
};

/** Total XP from the stamps already collected. */
export const collectedStampXp = (
  collected: { time: string; title: string }[],
  config: TrainerCardConfig = DEFAULT_TRAINER_CONFIG,
): number => collected.reduce((sum, stamp) => sum + stampXpOf(stamp, config), 0);

export const computeXp = (
  badges: number,
  stamps: number,
  visits: number,
  rareItems: number = 0,
  weights: XpWeights = XP_WEIGHTS,
  /** Sum of the per-stamp values, when the caller knows which stamps were
   *  collected. Falls back to the flat `stamps * weights.stamp` when absent. */
  stampXpTotal?: number,
): number =>
  badges * weights.badge +
  (stampXpTotal ?? stamps * weights.stamp) +
  visits * weights.visit +
  // A config saved before rare items existed has no `rareItem` key.
  rareItems * (weights.rareItem ?? 0);

/** `unlockSku` absent means free — every preset shipped before the shop stays free.
 *  `dex` is the National Dex number the sprite URL is built from (`pokeSprites.ts`);
 *  `icon` stays as the fallback for when the sprite CDN can't be reached. */
export type AvatarPreset = {
  id: string;
  dex: number;
  icon: string;
  label: string;
  species: string;
  unlockSku?: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "pikachu", dex: 25, icon: "⚡", label: "Sparky", species: "Pikachu" },
  { id: "eevee", dex: 133, icon: "🦊", label: "Evee", species: "Eevee" },
  { id: "bulbasaur", dex: 1, icon: "🌱", label: "Sprout", species: "Bulbasaur" },
  { id: "squirtle", dex: 7, icon: "🐢", label: "Shellback", species: "Squirtle" },
  { id: "charmander", dex: 4, icon: "🔥", label: "Ember", species: "Charmander" },
  { id: "jigglypuff", dex: 39, icon: "🎈", label: "Puff", species: "Jigglypuff" },
  { id: "psyduck", dex: 54, icon: "🦆", label: "Quack", species: "Psyduck" },
  { id: "meowth", dex: 52, icon: "🐱", label: "Whiskers", species: "Meowth" },
];

export const avatarFor = (avatarId: string | null | undefined): AvatarPreset =>
  AVATAR_PRESETS.find((a) => a.id === avatarId) ?? AVATAR_PRESETS[0];

/**
 * Trainer card cosmetics — worn on `TrainerCard.tsx`, unlocked from `SHOP_CATALOGUE`.
 * `id` is the value stored in `profile.cardMaterial` / `profile.cardFrame`; `unlockSku`
 * is the SKU in `shop.ts` that must appear in `profile.purchases` before it applies.
 * No "none" entry here on purpose — the unset/default state is simply absent from the
 * table, which is what keeps an unowned card looking exactly like it does today.
 */
export interface CardMaterial {
  id: "foil" | "holo" | "fullart";
  label: string;
  blurb: string;
  unlockSku: string;
}

/** `fullart` is the odd one out: Foil and Holo lay a finish over the printed
 *  face, but Full Art *replaces* that face with an edge-to-edge one. Same
 *  field, so picking it deselects the other two — which is right, a card is
 *  only ever printed one way. */
export const CARD_MATERIALS: CardMaterial[] = [
  { id: "foil", label: "Foil", blurb: "Etched metal, whole card. Tilt it and the glints move.", unlockSku: "card.material.foil" },
  { id: "holo", label: "Holo", blurb: "Rainbow across the whole card, brightest over your photo.", unlockSku: "card.material.holo" },
  { id: "fullart", label: "Full Art", blurb: "The chase pull. Art to the edge, gold rim, your name in foil.", unlockSku: "card.material.fullart" },
];

export interface CardFrame {
  id: "sakura" | "starfield";
  label: string;
  blurb: string;
  unlockSku: string;
}

export const CARD_FRAMES: CardFrame[] = [
  { id: "sakura", label: "Sakura", blurb: "Petals along the card rim.", unlockSku: "card.frame.sakura" },
  { id: "starfield", label: "Starfield", blurb: "Slow stars drifting behind the portrait.", unlockSku: "card.frame.starfield" },
];

export type TeamId = "valor" | "mystic" | "instinct";

export interface Team {
  id: TeamId;
  name: string;
  motto: string;
  /** National Dex number of the legendary bird the team is sworn to. */
  dex: number;
  /** That bird's name, for the label under the mascot. */
  mascot: string;
  /** Light wash behind the card header. Text on it must be `ink`, never white. */
  tint: string;
  /** Mid-strength fill: level ring, XP bar, rim. */
  accent: string;
  /** Dark end of the same hue — the only colour used for text on `tint`. */
  ink: string;
  /** "r g b" for shadows and glows, so opacity can be applied at the call site. */
  glow: string;
}

/** The three teams, each one hue at three strengths so a card reads as one material.
 *  Hues are pulled toward this site's palette rather than the games' primaries —
 *  Valor sits at a warm coral instead of pure red, Instinct at honey instead of
 *  traffic-light yellow — so a card still belongs on a lilac page. */
export const TEAMS: Team[] = [
  {
    id: "valor",
    name: "Team Valor",
    motto: "Chase it with your whole heart.",
    dex: 146,
    mascot: "Moltres",
    tint: "hsl(9 72% 95%)",
    accent: "hsl(9 78% 57%)",
    ink: "hsl(9 62% 32%)",
    glow: "232 80 58",
  },
  {
    id: "mystic",
    name: "Team Mystic",
    motto: "Chase the quiet hours.",
    dex: 144,
    mascot: "Articuno",
    tint: "hsl(215 62% 95%)",
    accent: "hsl(215 66% 54%)",
    ink: "hsl(215 60% 31%)",
    glow: "62 124 214",
  },
  {
    id: "instinct",
    name: "Team Instinct",
    motto: "Chase the golden light.",
    dex: 145,
    mascot: "Zapdos",
    tint: "hsl(45 80% 93%)",
    accent: "hsl(45 82% 50%)",
    ink: "hsl(38 70% 26%)",
    glow: "232 180 23",
  },
];

/**
 * Cards saved before the teams were renamed still hold the old ids.
 *
 * Without this the lookup below falls through to `TEAMS[0]` and every Dusk and
 * Lumen card silently turns Valor — a colour change nobody asked for, on the one
 * screen that is supposed to feel personal. Mapped at read time by hue, so no
 * migration has to run and an old row keeps working if one ever comes back.
 */
const LEGACY_TEAM_IDS: Record<string, TeamId> = {
  blossom: "valor",
  dusk: "mystic",
  lumen: "instinct",
};

export const teamFor = (teamId: string | null | undefined): Team => {
  const id = teamId ? LEGACY_TEAM_IDS[teamId] ?? teamId : null;
  return TEAMS.find((t) => t.id === id) ?? TEAMS[0];
};

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
  /** Rare checkpoint drops. Commons are worth no XP — see `XpWeights`. */
  rareItems: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  nextLevel: string | null;
}

export const computeTrainerStats = (
  badges: number,
  stamps: number,
  visits: number,
  config: TrainerCardConfig = DEFAULT_TRAINER_CONFIG,
  rareItems: number = 0,
  stampXpTotal?: number,
): TrainerStats => {
  const weights = config.weights ?? XP_WEIGHTS;
  // Thresholds are authored in the admin panel, so never trust the order.
  const tiers = (config.tiers?.length ? [...config.tiers] : LEVEL_TIERS).sort((a, b) => a.minXp - b.minXp);
  const xp = computeXp(badges, stamps, visits, rareItems, weights, stampXpTotal);

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
    rareItems,
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
  for (const [key, value] of Object.entries(config.stampXp ?? {})) {
    if (!Number.isFinite(value) || value < 0) return `XP for "${key}" must be zero or more.`;
  }
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
