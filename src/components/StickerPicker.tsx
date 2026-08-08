import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import type { Sticker } from "@/components/TimelineSection";
import { useAdventure } from "@/contexts/AdventureContext";
import { isOwned, priceOf } from "@/utils/shop";

export type StickerType =
  | "heart"
  | "heart-filled"
  | "star"
  | "star-filled"
  | "flower"
  | "music-note"
  | "coffee"
  | "camera"
  | "sparkle"
  // Snack Pack — sticker.pack.snacks
  | "boba"
  | "ramen"
  | "cake"
  | "ice-cream"
  // Cat Pack — sticker.pack.cats
  | "cat-happy"
  | "cat-sleepy"
  | "cat-curious"
  | "cat-loaf"
  // Celestial Pack — sticker.pack.celestial
  | "moon"
  | "comet"
  | "constellation"
  | "planet";

interface StickerPickerProps {
  onStickerSelect: (sticker: Sticker) => void;
  onClose: () => void;
}

// Pixel art sticker components
const PixelHeart = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <path
      d="M 8 2 C 6 0, 4 2, 4 4 C 4 6, 8 10, 8 10 C 8 10, 12 6, 12 4 C 12 2, 10 0, 8 2 Z"
      fill="hsl(0, 70%, 60%)"
      stroke="hsl(0, 60%, 40%)"
      strokeWidth="1"
    />
  </svg>
);

const PixelHeartFilled = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <path
      d="M 8 2 C 6 0, 4 2, 4 4 C 4 6, 8 10, 8 10 C 8 10, 12 6, 12 4 C 12 2, 10 0, 8 2 Z"
      fill="hsl(0, 80%, 65%)"
      stroke="hsl(0, 70%, 50%)"
      strokeWidth="1.5"
    />
  </svg>
);

const PixelStar = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <path
      d="M 8 0 L 10 6 L 16 6 L 11 9 L 13 15 L 8 11 L 3 15 L 5 9 L 0 6 L 6 6 Z"
      fill="hsl(45, 80%, 65%)"
      stroke="hsl(45, 70%, 50%)"
      strokeWidth="1"
    />
  </svg>
);

const PixelStarFilled = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <path
      d="M 8 0 L 10 6 L 16 6 L 11 9 L 13 15 L 8 11 L 3 15 L 5 9 L 0 6 L 6 6 Z"
      fill="hsl(45, 90%, 70%)"
      stroke="hsl(45, 80%, 55%)"
      strokeWidth="1.5"
    />
  </svg>
);

const PixelFlower = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="7" y="1" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="4" y="3" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="10" y="3" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="5" y="6" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="9" y="6" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="7" y="4" width="2" height="2" fill="hsl(45, 80%, 60%)" />
  </svg>
);

const PixelMusicNote = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="4" width="2" height="8" fill="hsl(var(--foreground))" />
    <rect x="4" y="2" width="6" height="2" fill="hsl(var(--foreground))" />
    <rect x="8" y="4" width="2" height="6" fill="hsl(var(--foreground))" />
    <circle cx="3" cy="13" r="2" fill="hsl(var(--foreground))" />
    <circle cx="9" cy="11" r="2" fill="hsl(var(--foreground))" />
  </svg>
);

const PixelCoffee = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="4" width="10" height="8" fill="hsl(var(--primary))" />
    <rect x="4" y="5" width="8" height="6" fill="hsl(45, 60%, 35%)" />
    <rect x="13" y="5" width="2" height="1" fill="hsl(var(--primary))" />
    <rect x="14" y="6" width="1" height="3" fill="hsl(var(--primary))" />
    <rect x="13" y="9" width="2" height="1" fill="hsl(var(--primary))" />
  </svg>
);

const PixelCamera = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="5" width="12" height="8" fill="hsl(var(--foreground))" />
    <rect x="3" y="6" width="10" height="6" fill="hsl(var(--muted))" />
    <rect x="5" y="7" width="6" height="4" fill="hsl(var(--foreground))" />
    <rect x="6" y="8" width="4" height="2" fill="hsl(200, 70%, 50%)" />
    <rect x="11" y="6" width="2" height="2" fill="hsl(45, 80%, 60%)" />
  </svg>
);

const PixelSparkle = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="7" y="0" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="7" y="14" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="0" y="7" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="14" y="7" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="3" y="3" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="11" y="3" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="3" y="11" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="11" y="11" width="2" height="2" fill="hsl(45, 80%, 70%)" />
    <rect x="7" y="7" width="2" height="2" fill="hsl(45, 90%, 80%)" />
  </svg>
);

// Snack Pack
const PixelBoba = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="4" y="1" width="8" height="2" fill="hsl(340, 70%, 70%)" />
    <rect x="3" y="3" width="10" height="10" fill="hsl(30, 60%, 80%)" />
    <rect x="4" y="4" width="8" height="8" fill="hsl(30, 50%, 70%)" />
    <circle cx="6" cy="10" r="1" fill="hsl(0, 0%, 15%)" />
    <circle cx="9" cy="11" r="1" fill="hsl(0, 0%, 15%)" />
    <circle cx="7.5" cy="8" r="1" fill="hsl(0, 0%, 15%)" />
  </svg>
);

const PixelRamen = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="7" width="12" height="6" fill="hsl(0, 60%, 55%)" />
    <rect x="3" y="8" width="10" height="4" fill="hsl(45, 70%, 75%)" />
    <path d="M 4 8 Q 6 10, 4 11 M 7 8 Q 9 10, 7 11 M 10 8 Q 12 10, 10 11" stroke="hsl(40, 60%, 45%)" strokeWidth="1" fill="none" />
    <rect x="6" y="5" width="4" height="2" fill="hsl(0, 0%, 95%)" />
  </svg>
);

const PixelCake = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="9" width="10" height="5" fill="hsl(30, 55%, 65%)" />
    <rect x="3" y="6" width="10" height="3" fill="hsl(340, 70%, 80%)" />
    <rect x="7" y="2" width="2" height="4" fill="hsl(45, 70%, 60%)" />
    <rect x="7" y="1" width="2" height="1" fill="hsl(20, 80%, 55%)" />
    <circle cx="5" cy="11" r="1" fill="hsl(0, 70%, 60%)" />
    <circle cx="11" cy="11" r="1" fill="hsl(0, 70%, 60%)" />
  </svg>
);

const PixelIceCream = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <circle cx="8" cy="5" r="4" fill="hsl(340, 65%, 78%)" />
    <path d="M 5 7 L 8 15 L 11 7 Z" fill="hsl(35, 55%, 65%)" />
    <path d="M 5 7 L 8 15 L 11 7" stroke="hsl(35, 50%, 45%)" strokeWidth="0.5" fill="none" />
    <rect x="7" y="1" width="2" height="2" fill="hsl(0, 70%, 60%)" />
  </svg>
);

// Cat Pack
const PixelCatHappy = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="3" width="10" height="9" fill="hsl(30, 50%, 65%)" />
    <path d="M 3 3 L 3 0 L 6 3 Z M 13 3 L 13 0 L 10 3 Z" fill="hsl(30, 50%, 65%)" />
    <path d="M 5 7 Q 6 8, 7 7 M 9 7 Q 10 8, 11 7" stroke="hsl(0, 0%, 15%)" strokeWidth="1" fill="none" />
    <path d="M 6 10 Q 8 11, 10 10" stroke="hsl(0, 0%, 15%)" strokeWidth="1" fill="none" />
  </svg>
);

const PixelCatSleepy = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="3" width="10" height="9" fill="hsl(220, 15%, 55%)" />
    <path d="M 3 3 L 3 0 L 6 3 Z M 13 3 L 13 0 L 10 3 Z" fill="hsl(220, 15%, 55%)" />
    <rect x="5" y="7" width="2" height="1" fill="hsl(0, 0%, 15%)" />
    <rect x="9" y="7" width="2" height="1" fill="hsl(0, 0%, 15%)" />
    <path d="M 6 10 L 10 10" stroke="hsl(0, 0%, 15%)" strokeWidth="1" />
    <text x="11" y="4" fontSize="3" fill="hsl(210, 60%, 70%)">z</text>
  </svg>
);

const PixelCatCurious = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="3" width="10" height="9" fill="hsl(25, 60%, 50%)" />
    <path d="M 3 3 L 3 0 L 6 3 Z M 13 3 L 13 0 L 10 3 Z" fill="hsl(25, 60%, 50%)" />
    <circle cx="6" cy="7" r="1.2" fill="hsl(0, 0%, 15%)" />
    <circle cx="10" cy="7" r="1.2" fill="hsl(0, 0%, 15%)" />
    <path d="M 7 9 L 9 9 L 8 10 Z" fill="hsl(340, 60%, 60%)" />
    <path d="M 12 6 L 14 5" stroke="hsl(0, 0%, 70%)" strokeWidth="0.5" />
  </svg>
);

const PixelCatLoaf = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="8" width="12" height="5" rx="2" fill="hsl(0, 0%, 90%)" />
    <path d="M 3 8 L 3 5 L 5 8 Z M 13 8 L 13 5 L 11 8 Z" fill="hsl(0, 0%, 90%)" />
    <circle cx="5.5" cy="9.5" r="0.8" fill="hsl(0, 0%, 15%)" />
    <circle cx="8.5" cy="9.5" r="0.8" fill="hsl(0, 0%, 15%)" />
  </svg>
);

// Celestial Pack
const PixelMoon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <path
      d="M 10 1 A 7 7 0 1 0 10 15 A 5.5 5.5 0 0 1 10 1 Z"
      fill="hsl(45, 60%, 75%)"
      stroke="hsl(45, 50%, 55%)"
      strokeWidth="0.5"
    />
  </svg>
);

const PixelComet = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <circle cx="11" cy="5" r="2.5" fill="hsl(200, 70%, 75%)" />
    <path d="M 9 6 L 1 14 M 10 4 L 4 12 M 11 3 L 7 11" stroke="hsl(200, 60%, 65%)" strokeWidth="1" opacity="0.6" />
  </svg>
);

const PixelConstellation = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <path d="M 2 12 L 6 4 L 10 9 L 14 2" stroke="hsl(var(--foreground))" strokeWidth="0.6" fill="none" opacity="0.7" />
    <circle cx="2" cy="12" r="1" fill="hsl(45, 90%, 75%)" />
    <circle cx="6" cy="4" r="1" fill="hsl(45, 90%, 75%)" />
    <circle cx="10" cy="9" r="1" fill="hsl(45, 90%, 75%)" />
    <circle cx="14" cy="2" r="1" fill="hsl(45, 90%, 75%)" />
  </svg>
);

const PixelPlanet = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} style={{ imageRendering: "pixelated" }}>
    <circle cx="8" cy="8" r="4" fill="hsl(260, 55%, 65%)" />
    <ellipse cx="8" cy="8" rx="7" ry="2" fill="none" stroke="hsl(45, 70%, 65%)" strokeWidth="1" transform="rotate(-15 8 8)" />
  </svg>
);

export const stickerComponents: Record<StickerType, React.FC<{ size?: number }>> = {
  heart: PixelHeart,
  "heart-filled": PixelHeartFilled,
  star: PixelStar,
  "star-filled": PixelStarFilled,
  flower: PixelFlower,
  "music-note": PixelMusicNote,
  coffee: PixelCoffee,
  camera: PixelCamera,
  sparkle: PixelSparkle,
  boba: PixelBoba,
  ramen: PixelRamen,
  cake: PixelCake,
  "ice-cream": PixelIceCream,
  "cat-happy": PixelCatHappy,
  "cat-sleepy": PixelCatSleepy,
  "cat-curious": PixelCatCurious,
  "cat-loaf": PixelCatLoaf,
  moon: PixelMoon,
  comet: PixelComet,
  constellation: PixelConstellation,
  planet: PixelPlanet,
};

// Free set — always unlocked, no SKU required.
const freeStickerTypes: StickerType[] = [
  "heart",
  "heart-filled",
  "star",
  "star-filled",
  "flower",
  "music-note",
  "coffee",
  "camera",
  "sparkle",
];

interface StickerPack {
  skuId: string;
  name: string;
  stickers: StickerType[];
}

const stickerPacks: StickerPack[] = [
  {
    skuId: "sticker.pack.snacks",
    name: "Snack Pack",
    stickers: ["boba", "ramen", "cake", "ice-cream"],
  },
  {
    skuId: "sticker.pack.cats",
    name: "Cat Pack",
    stickers: ["cat-happy", "cat-sleepy", "cat-curious", "cat-loaf"],
  },
  {
    skuId: "sticker.pack.celestial",
    name: "Celestial Pack",
    stickers: ["moon", "comet", "constellation", "planet"],
  },
];

const StickerPicker = ({ onStickerSelect, onClose }: StickerPickerProps) => {
  const { profile } = useAdventure();
  const purchases = profile?.purchases ?? [];

  const handleStickerClick = (type: StickerType) => {
    const sticker: Sticker = {
      id: `${type}-${Date.now()}`,
      type,
      x: 50, // Default center position
      y: 50,
      scale: 1,
      rotation: 0,
    };
    onStickerSelect(sticker);
  };

  return (
    <div className="bg-surface border border-border shadow-[0_4px_20px_-4px_rgba(138,43,226,0.15)] p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-sm text-foreground/80">
          Add Sticker
        </h4>
        <button
          onClick={onClose}
          className="text-foreground/50 hover:text-foreground/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {freeStickerTypes.map((type) => {
          const StickerComponent = stickerComponents[type];
          return (
            <motion.button
              key={type}
              onClick={() => handleStickerClick(type)}
              className="p-3 bg-muted/20 border border-border rounded-md hover:bg-muted/40 hover:border-primary/50 transition-all flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <StickerComponent size={32} />
            </motion.button>
          );
        })}
      </div>

      {stickerPacks.map((pack) => {
        const owned = isOwned(purchases, pack.skuId);
        const price = priceOf(pack.skuId);

        return (
          <div key={pack.skuId} className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-xs text-foreground/60 flex items-center gap-2">
                {owned ? null : <Lock className="w-4 h-4 text-muted-foreground" />}
                {pack.name}
              </h5>
              {!owned && price !== null && (
                <span className="text-xs text-muted-foreground">{price} coins</span>
              )}
            </div>
            {owned ? (
              <div className="grid grid-cols-3 gap-2">
                {pack.stickers.map((type) => {
                  const StickerComponent = stickerComponents[type];
                  return (
                    <motion.button
                      key={type}
                      onClick={() => handleStickerClick(type)}
                      className="p-3 bg-muted/20 border border-border rounded-md hover:bg-muted/40 hover:border-primary/50 transition-all flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <StickerComponent size={32} />
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <Link
                to="/trainer-card?tab=shop"
                className="grid grid-cols-3 gap-2"
                aria-label={`Unlock ${pack.name} in the shop`}
              >
                {pack.stickers.map((type) => {
                  const StickerComponent = stickerComponents[type];
                  return (
                    <div
                      key={type}
                      className="relative p-3 bg-muted/20 border border-border rounded-md opacity-60 flex items-center justify-center"
                    >
                      <StickerComponent size={32} />
                      <Lock className="w-4 h-4 text-muted-foreground absolute top-1 right-1" />
                    </div>
                  );
                })}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerPicker;

