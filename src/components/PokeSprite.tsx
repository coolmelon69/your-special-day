import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { spriteSources } from "@/utils/pokeSprites";

interface PokeSpriteProps {
  /** National Dex number — see `AVATAR_PRESETS` / `TEAMS` in `trainerCard.ts`. */
  dex: number;
  /** Shown if every sprite source fails. The presets already carry an emoji. */
  fallback: string;
  /** Empty string keeps the sprite decorative, which is right beside a text label. */
  alt?: string;
  className?: string;
}

/**
 * A PokéAPI sprite that degrades instead of breaking: animated → still → emoji.
 *
 * The fallback chain exists because the sprite is a CDN image on a card someone
 * might open on café wifi. A broken-image glyph where the buddy should be reads
 * as the app being broken; the emoji it falls back to is exactly what the card
 * showed before sprites existed, so the worst case is last month's design.
 */
const PokeSprite = ({ dex, fallback, alt = "", className }: PokeSpriteProps) => {
  const sources = useMemo(() => spriteSources(dex), [dex]);
  const [attempt, setAttempt] = useState(0);

  if (attempt >= sources.length) {
    return (
      <span className={cn("grid place-items-center leading-none", className)} role="img" aria-label={alt || undefined}>
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={sources[attempt]}
      alt={alt}
      draggable={false}
      // jsDelivr answers `access-control-allow-origin: *`, so the card's
      // html2canvas capture can read these pixels back out.
      crossOrigin="anonymous"
      onError={() => setAttempt((a) => a + 1)}
      className={cn("select-none object-contain [image-rendering:pixelated]", className)}
    />
  );
};

export default PokeSprite;
