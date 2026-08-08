/**
 * Self-check for the XP weight formula. No test framework:
 *   node src/utils/trainerCard.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  XP_WEIGHTS,
  computeXp,
  LEVEL_TIERS,
  AVATAR_PRESETS,
  CARD_MATERIALS,
  CARD_FRAMES,
  computeTrainerStats,
  validateTrainerConfig,
  TIER_COLOR_CLASSES,
  TEAMS,
  teamFor,
  trainerIdFor,
  type TrainerCardConfig,
} from "./trainerCard.ts";

assert.equal(computeXp(0, 0, 0), 0, "zero activity is zero XP");
assert.equal(computeXp(1, 0, 0), XP_WEIGHTS.badge, "one badge");
assert.equal(computeXp(0, 1, 0), XP_WEIGHTS.stamp, "one stamp");
assert.equal(computeXp(0, 0, 1), XP_WEIGHTS.visit, "one visit");
assert.equal(computeXp(0, 0, 0, 1), XP_WEIGHTS.rareItem, "one rare item");
assert.equal(
  computeXp(2, 3, 1),
  2 * XP_WEIGHTS.badge + 3 * XP_WEIGHTS.stamp + 1 * XP_WEIGHTS.visit,
  "mixed counts sum correctly",
);
assert.equal(
  computeXp(2, 3, 1, 2),
  2 * XP_WEIGHTS.badge + 3 * XP_WEIGHTS.stamp + 1 * XP_WEIGHTS.visit + 2 * XP_WEIGHTS.rareItem,
  "rare items add on top of the rest",
);

// Common drops are worth nothing — only rares move the bar, so a day of six
// stamps with no rare earns exactly what the stamps alone earn.
assert.equal(computeXp(0, 6, 0, 0), 6 * XP_WEIGHTS.stamp, "commons contribute no XP");

// A config saved before rare items existed has no `rareItem` key — treat it as
// zero rather than producing NaN and blanking the whole card.
const legacyWeights = { badge: 5, stamp: 2, visit: 3 } as unknown as typeof XP_WEIGHTS;
assert.equal(computeXp(1, 0, 0, 3, legacyWeights), 5, "missing rareItem weight counts as zero, not NaN");

// computeTrainerStats — zero activity is Rookie, 0 XP, no progress into level
const zeroStats = computeTrainerStats(0, 0, 0);
assert.equal(zeroStats.level, "Rookie", "zero activity starts at Rookie");
assert.equal(zeroStats.xp, 0, "zero activity is zero XP");
assert.equal(zeroStats.xpIntoLevel, 0, "zero progress into Rookie");
assert.equal(zeroStats.xpForNextLevel, LEVEL_TIERS[1].minXp - LEVEL_TIERS[0].minXp, "distance to Trainer tier");

// Exactly at a tier boundary lands on that tier, not the one below
const badgesForAce = Math.ceil(LEVEL_TIERS[2].minXp / XP_WEIGHTS.badge); // enough badges alone to hit Ace's minXp
const aceBoundaryXp = badgesForAce * XP_WEIGHTS.badge;
const aceStats = computeTrainerStats(badgesForAce, 0, 0);
assert.ok(aceStats.xp >= LEVEL_TIERS[2].minXp, "sanity: boundary XP reaches Ace threshold");
assert.equal(
  aceStats.level,
  LEVEL_TIERS.filter((t) => t.minXp <= aceStats.xp).slice(-1)[0].name,
  "lands on the highest tier not exceeding xp",
);

// Max level (Champion) has no "next" tier
const championBadges = Math.ceil(LEVEL_TIERS[LEVEL_TIERS.length - 1].minXp / XP_WEIGHTS.badge);
const championStats = computeTrainerStats(championBadges, 0, 0);
assert.equal(championStats.level, "Champion", "enough XP reaches max tier");
assert.equal(championStats.xpForNextLevel, null, "no next tier at max level");

// AVATAR_PRESETS sanity — non-empty, unique ids
assert.ok(AVATAR_PRESETS.length > 0, "at least one avatar preset");
assert.equal(
  new Set(AVATAR_PRESETS.map((a) => a.id)).size,
  AVATAR_PRESETS.length,
  "avatar preset ids are unique",
);

// Admin-tuned config drives XP and ranks, and out-of-order thresholds still work
const customConfig: TrainerCardConfig = {
  weights: { badge: 10, stamp: 1, visit: 0, rareItem: 0 },
  tiers: [
    { name: "Legend", minXp: 60, color: "rose", icon: "👑" },
    { name: "Newbie", minXp: 0, color: "muted", icon: "🌱" },
    { name: "Regular", minXp: 30, color: "primary", icon: "⭐" },
  ],
};
assert.equal(computeXp(2, 5, 9, 0, customConfig.weights), 25, "custom weights: visits worth nothing");
assert.equal(computeTrainerStats(2, 5, 9, customConfig).level, "Newbie", "25 XP is below Regular");
assert.equal(computeTrainerStats(3, 0, 0, customConfig).level, "Regular", "30 XP lands on Regular");
assert.equal(computeTrainerStats(3, 0, 0, customConfig).nextLevel, "Legend", "next rank after Regular");
assert.equal(computeTrainerStats(6, 0, 0, customConfig).xpForNextLevel, null, "Legend is the top rank");
assert.equal(computeTrainerStats(6, 0, 0, customConfig).levelIcon, "👑", "top rank carries its icon");

// Every tier colour resolves to real classes
for (const tier of LEVEL_TIERS) {
  assert.ok(TIER_COLOR_CLASSES[tier.color], `tier "${tier.name}" has a known colour`);
}

// Validation catches the ways an admin can break the ladder
assert.equal(validateTrainerConfig(customConfig), null, "a sane custom config validates");
assert.ok(
  validateTrainerConfig({ ...customConfig, weights: { badge: 0, stamp: 0, visit: 0 } }),
  "all-zero weights rejected",
);
assert.ok(
  validateTrainerConfig({ ...customConfig, tiers: customConfig.tiers.map((t) => ({ ...t, minXp: t.minXp + 5 })) }),
  "no rank at 0 XP rejected",
);
assert.ok(
  validateTrainerConfig({ ...customConfig, tiers: customConfig.tiers.map((t) => ({ ...t, minXp: 0 })) }),
  "duplicate thresholds rejected",
);
assert.ok(
  validateTrainerConfig({ ...customConfig, tiers: [{ name: "  ", minXp: 0, color: "rose", icon: "⭐" }] }),
  "blank rank name rejected",
);

// Teams — unique ids, and an unknown/absent id falls back to the first team rather than
// leaving the card with no colour at all (profiles created before teams existed).
assert.equal(new Set(TEAMS.map((t) => t.id)).size, TEAMS.length, "team ids are unique");
assert.equal(teamFor(null).id, TEAMS[0].id, "no team falls back to the first team");
assert.equal(teamFor("not-a-team").id, TEAMS[0].id, "unknown team falls back to the first team");
assert.equal(teamFor(TEAMS[2].id).id, TEAMS[2].id, "a known team id resolves to itself");

// Trainer ID — stable per user, 12 digits in 4-4-4 groups, never blank for a missing id.
const idA = trainerIdFor("6f1c2b4e-0000-4aaa-8bbb-1234567890ab");
assert.match(idA, /^\d{4} \d{4} \d{4}$/, "trainer id is 12 digits grouped 4-4-4");
assert.equal(idA, trainerIdFor("6f1c2b4e-0000-4aaa-8bbb-1234567890ab"), "same user, same id");
assert.notEqual(idA, trainerIdFor("aaaaaaaa-0000-4aaa-8bbb-1234567890ab"), "different users differ");
assert.match(trainerIdFor(null), /^\d{4} \d{4} \d{4}$/, "a signed-out card still shows an id");

// levelNumber is the 1-based tier position, so the ring never shows 0.
assert.equal(computeTrainerStats(0, 0, 0).levelNumber, 1, "lowest tier is level 1");
assert.equal(
  computeTrainerStats(1000, 0, 0).levelNumber,
  LEVEL_TIERS.length,
  "max tier is the last level number",
);

// CARD_MATERIALS / CARD_FRAMES — unique ids, every entry unlockable, and every
// unlockSku actually exists in the shop catalogue (a typo here would render a
// picker option that can never be owned).
const migration = readFileSync(new URL("../../sql/2026-08-08-items-shop.sql", import.meta.url), "utf8");
const knownSkus = new Set(
  [...migration.matchAll(/when\s+'([\w.]+)'\s+then\s+\d+/g)].map((m) => m[1]),
);

assert.equal(new Set(CARD_MATERIALS.map((m) => m.id)).size, CARD_MATERIALS.length, "material ids are unique");
assert.equal(new Set(CARD_FRAMES.map((f) => f.id)).size, CARD_FRAMES.length, "frame ids are unique");
for (const material of CARD_MATERIALS) {
  assert.ok(material.unlockSku, `material "${material.id}" needs an unlockSku`);
  assert.ok(knownSkus.has(material.unlockSku), `material "${material.id}" unlockSku "${material.unlockSku}" is not a real sku`);
}
for (const frame of CARD_FRAMES) {
  assert.ok(frame.unlockSku, `frame "${frame.id}" needs an unlockSku`);
  assert.ok(knownSkus.has(frame.unlockSku), `frame "${frame.id}" unlockSku "${frame.unlockSku}" is not a real sku`);
}

// AVATAR_PRESETS.unlockSku — every preset shipped before the shop stays free.
for (const preset of AVATAR_PRESETS) {
  assert.equal(preset.unlockSku, undefined, `preset "${preset.id}" was free before the shop and must stay free`);
}

console.log("trainerCard.check.ts: all assertions passed");
