import { useState } from "react";
import { motion } from "framer-motion";
import type { Sticker } from "@/components/TimelineSection";

export type StickerType = 
  | "heart"
  | "heart-filled"
  | "star"
  | "star-filled"
  | "flower"
  | "music-note"
  | "coffee"
  | "camera"
  | "sparkle";

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

const stickerComponents: Record<StickerType, React.FC<{ size?: number }>> = {
  heart: PixelHeart,
  "heart-filled": PixelHeartFilled,
  star: PixelStar,
  "star-filled": PixelStarFilled,
  flower: PixelFlower,
  "music-note": PixelMusicNote,
  coffee: PixelCoffee,
  camera: PixelCamera,
  sparkle: PixelSparkle,
};

const stickerTypes: StickerType[] = [
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

const StickerPicker = ({ onStickerSelect, onClose }: StickerPickerProps) => {
  const handleStickerClick = (type: StickerType) => {
    const sticker: Sticker = {
      id: `${type}-${Date.now()}`,
      type,
      x: 50, // Default center position
      y: 50,
      scale: 1,
    };
    onStickerSelect(sticker);
  };

  return (
    <div className="bg-[hsl(35_40%_85%)] border-2 border-[hsl(15_60%_50%)] p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4
          className="font-pixel text-xs md:text-sm text-[hsl(15_70%_40%)]"
          style={{
            textRendering: "optimizeSpeed",
            WebkitFontSmoothing: "none",
            MozOsxFontSmoothing: "unset",
            fontSmooth: "never",
            letterSpacing: "0.05em",
          }}
        >
          Add Sticker
        </h4>
        <button
          onClick={onClose}
          className="text-[hsl(15_60%_35%)] hover:text-[hsl(15_70%_50%)] transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stickerTypes.map((type) => {
          const StickerComponent = stickerComponents[type];
          return (
            <motion.button
              key={type}
              onClick={() => handleStickerClick(type)}
              className="p-3 bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] hover:bg-[hsl(35_30%_85%)] hover:border-[hsl(15_60%_50%)] transition-all flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <StickerComponent size={32} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StickerPicker;

