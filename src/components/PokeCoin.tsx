/**
 * The currency mark. PokéAPI ships no PokéCoin, so the wallet borrows the closest
 * real thing in the sprite set — the Amulet Coin item, a gold disc on a ribbon.
 * Vendored into `public/images/` rather than hotlinked: it renders on every shop
 * card and price row, and a raw.githubusercontent round-trip per view is a
 * dependency the page doesn't need.
 *
 * Sprites are 30px native. Smoothing is left on because every use here is a
 * *downscale* — `pixelated` under 1× samples the source unevenly and the coin
 * loses its rim. The bag and shop shelves, which draw sprites at 1× or 2×, keep
 * their own `imageRendering: pixelated`.
 */
import { cn } from "@/lib/utils";

interface PokeCoinProps {
  /** Rendered box in px. Defaults to 18 — reads level with 14px body text. */
  size?: number;
  className?: string;
}

const PokeCoin = ({ size = 18, className }: PokeCoinProps) => (
  <img
    src="/images/pokecoin.png"
    alt=""
    aria-hidden
    width={size}
    height={size}
    draggable={false}
    className={cn("inline-block shrink-0 select-none", className)}
    style={{ width: size, height: size }}
  />
);

export default PokeCoin;
