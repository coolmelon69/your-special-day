/**
 * PokéAPI sprite URLs, built straight from the National Dex number.
 *
 * No API call here on purpose. `pokeItems.ts` hits pokeapi.co because it needs
 * flavour text that only the JSON carries; a sprite is a predictable path in
 * the sprites repo, so fetching one would be a round-trip to learn a URL we can
 * already write.
 *
 * The default look is the Gen-5 Black/White idle animation — the buddy breathes
 * on the card instead of sitting there. Coverage is gens 1–5 only, which every
 * dex number on this card is well inside.
 *
 * Served over jsDelivr rather than raw.githubusercontent, which sends no
 * `access-control-allow-origin` at all. That matters beyond loading: the
 * trainer card's "Save as image" draws the card into a canvas, and one non-CORS
 * image on it taints the canvas so `toDataURL` throws. jsDelivr answers `*`, so
 * the sprites can carry `crossOrigin="anonymous"` and the capture keeps working.
 */
const REPO = "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon";

/** Gen-5 animated idle loop. ~22 KB, roughly 70×60, pixel art. */
export const animatedSpriteUrl = (dex: number): string =>
  `${REPO}/versions/generation-v/black-white/animated/${dex}.gif`;

/** Classic still front sprite. ~0.6 KB, 96×96 — the reduced-motion stand-in. */
export const stillSpriteUrl = (dex: number): string => `${REPO}/${dex}.png`;

/**
 * Whether the viewer has asked their OS to reduce motion.
 *
 * Read per call rather than cached: the setting can flip mid-session, and a
 * matchMedia lookup costs nothing next to the image it decides.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * Sources to try for one buddy, best first.
 *
 * A GIF has no pause control and ignores `prefers-reduced-motion` entirely, so
 * the still sprite is *substituted* for it rather than layered behind it —
 * eight looping sprites on one onboarding screen is a vestibular problem, not a
 * style preference. The second entry is the CDN fallback: raw.githubusercontent
 * is a convenience, not an uptime promise.
 */
export const spriteSources = (dex: number): string[] =>
  prefersReducedMotion() ? [stillSpriteUrl(dex)] : [animatedSpriteUrl(dex), stillSpriteUrl(dex)];
