/**
 * Self-check for team resolution and sprite URLs. No test framework:
 *   node src/utils/trainerCard.check.ts
 * Node strips the TypeScript types natively.
 *
 * Both subjects here fail silently rather than loudly. A broken legacy mapping
 * doesn't throw, it just quietly repaints somebody's card in the wrong team's
 * colour; a wrong sprite path doesn't throw either, it renders the emoji
 * fallback and looks like a slow network. Neither would surface in review.
 */
import assert from "node:assert/strict";
import {
  AVATAR_PRESETS,
  DEFAULT_TRAINER_CONFIG,
  TEAMS,
  avatarFor,
  collectedStampXp,
  computeTrainerStats,
  stampKeyOf,
  stampXpOf,
  teamFor,
  validateTrainerConfig,
  type TrainerCardConfig,
} from "./trainerCard.ts";
import { animatedSpriteUrl, stillSpriteUrl, spriteSources } from "./pokeSprites.ts";

// --- teams -----------------------------------------------------------------

for (const team of TEAMS) {
  assert.equal(teamFor(team.id).id, team.id, `${team.id} must resolve to itself`);
}

// The mapping that keeps pre-rename cards on the colour they chose.
assert.equal(teamFor("blossom").id, "valor");
assert.equal(teamFor("dusk").id, "mystic");
assert.equal(teamFor("lumen").id, "instinct");

// Unknown and absent both fall back rather than throwing — a profile row saved
// before teams existed has team_id null.
assert.equal(teamFor(null).id, TEAMS[0].id);
assert.equal(teamFor(undefined).id, TEAMS[0].id);
assert.equal(teamFor("nonsense").id, TEAMS[0].id);

// Every team needs a mascot the sprite loader can actually build a URL for.
for (const team of TEAMS) {
  assert.ok(Number.isInteger(team.dex) && team.dex > 0, `${team.id} needs a dex number`);
}

// --- avatars ---------------------------------------------------------------

const dexNumbers = AVATAR_PRESETS.map((p) => p.dex);
assert.equal(new Set(dexNumbers).size, dexNumbers.length, "two presets share a dex number");

for (const preset of AVATAR_PRESETS) {
  assert.equal(avatarFor(preset.id).id, preset.id);
  assert.ok(preset.icon.length > 0, `${preset.id} needs an emoji fallback`);
  // Gen-5 animated sprites only exist up to Zekrom's era; a preset past that
  // would silently fall back to the still sprite for everyone, forever.
  assert.ok(preset.dex <= 649, `${preset.id} has no animated Gen-5 sprite`);
}

assert.equal(avatarFor("nonsense").id, AVATAR_PRESETS[0].id);

// --- sprite urls -----------------------------------------------------------

assert.ok(animatedSpriteUrl(25).endsWith("/black-white/animated/25.gif"));
assert.ok(stillSpriteUrl(25).endsWith("/sprites/pokemon/25.png"));

// jsDelivr, not raw.githubusercontent: the card's html2canvas export needs a
// host that answers access-control-allow-origin. See pokeSprites.ts.
assert.ok(animatedSpriteUrl(25).startsWith("https://cdn.jsdelivr.net/"));

// Outside a browser there is no matchMedia, so the animated source leads and
// the still one backs it up — the same order a motion-tolerant viewer gets.
assert.deepEqual(spriteSources(25), [animatedSpriteUrl(25), stillSpriteUrl(25)]);

// --- per-stamp xp ----------------------------------------------------------

const breakfast = { time: "9:00 AM", title: "Breakfast Quest" };
const sunset = { time: "7:00 PM", title: "Sunset" };

// The key has to match what `syncStampsProgress` writes, or an override
// silently applies to nothing.
assert.equal(stampKeyOf(breakfast), "9:00 AM-Breakfast Quest");

const config: TrainerCardConfig = {
  ...DEFAULT_TRAINER_CONFIG,
  stampXp: { [stampKeyOf(breakfast)]: 15, [stampKeyOf(sunset)]: 0 },
};

assert.equal(stampXpOf(breakfast, config), 15, "override wins");
assert.equal(stampXpOf(sunset, config), 0, "a zero override is an override, not a missing one");
assert.equal(stampXpOf({ time: "1:00 PM", title: "Lunch" }, config), 2, "no override falls back to the weight");
assert.equal(collectedStampXp([breakfast, sunset, { time: "1:00 PM", title: "Lunch" }], config), 17);

// A stamp checked in is worth the same to whoever reads the shared row, so the
// only thing that can differ between partners is their own badges/visits.
const withOverride = computeTrainerStats(0, 1, 0, config, 0, collectedStampXp([breakfast], config));
const withoutOverride = computeTrainerStats(0, 1, 0, config, 0);
assert.equal(withOverride.xp, 15);
assert.equal(withoutOverride.xp, 2, "no total passed = old flat pricing");

assert.equal(validateTrainerConfig(config), null);
assert.ok(
  validateTrainerConfig({ ...config, stampXp: { [stampKeyOf(breakfast)]: -1 } }),
  "negative per-stamp XP must be rejected",
);

console.log("trainerCard.check.ts: all assertions passed");
