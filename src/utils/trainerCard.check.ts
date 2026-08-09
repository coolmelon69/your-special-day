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
import { AVATAR_PRESETS, TEAMS, avatarFor, teamFor } from "./trainerCard.ts";
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

console.log("trainerCard.check.ts: all assertions passed");
