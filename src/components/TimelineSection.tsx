import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

const itinerary = [
  {
    time: "9:00 AM",
    title: "Breakfast Quest",
    description: "Wake up to your favorite breakfast with fresh flowers and orange juice",
    sprite: "coffee",
    isActive: true,
    isPast: false,
  },
  {
    time: "11:00 AM",
    title: "Flower Gathering",
    description: "Pick out the most beautiful bouquet from the local flower market",
    sprite: "flower",
    isActive: false,
    isPast: false,
  },
  {
    time: "1:00 PM",
    title: "Feast Time",
    description: "Your favorite restaurant with a special birthday menu",
    sprite: "food",
    isActive: false,
    isPast: false,
  },
  {
    time: "3:30 PM",
    title: "Memory Capture",
    description: "Capturing beautiful moments at our favorite spot in the park",
    sprite: "camera",
    isActive: false,
    isPast: false,
  },
  {
    time: "6:00 PM",
    title: "Melody Hour",
    description: "Live music at the rooftop venue with the best views",
    sprite: "music",
    isActive: false,
    isPast: false,
  },
  {
    time: "9:00 PM",
    title: "Starlight Banquet",
    description: "Elegant candlelit dinner with a stunning city view",
    sprite: "dinner",
    isActive: false,
    isPast: false,
  },
];

// Pixel art sprite components
const PixelCoffee = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Steam */}
    {isActive && (
      <>
        <rect x="5" y="1" width="1" height="1" fill="hsl(var(--muted-foreground))" className="animate-pulse" />
        <rect x="7" y="0" width="1" height="1" fill="hsl(var(--muted-foreground))" className="animate-pulse" />
        <rect x="9" y="1" width="1" height="1" fill="hsl(var(--muted-foreground))" className="animate-pulse" />
      </>
    )}
    {/* Cup */}
    <rect x="3" y="4" width="10" height="8" fill="hsl(var(--primary))" />
    <rect x="4" y="5" width="8" height="6" fill="hsl(45 60% 35%)" />
    {/* Handle */}
    <rect x="13" y="5" width="2" height="1" fill="hsl(var(--primary))" />
    <rect x="14" y="6" width="1" height="3" fill="hsl(var(--primary))" />
    <rect x="13" y="9" width="2" height="1" fill="hsl(var(--primary))" />
    {/* Base */}
    <rect x="2" y="12" width="12" height="2" fill="hsl(var(--primary))" />
  </svg>
);

const PixelFlower = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Petals */}
    <rect x="7" y="1" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="4" y="3" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="10" y="3" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="5" y="6" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="9" y="6" width="2" height="2" fill="hsl(var(--primary))" />
    {/* Center */}
    <rect x="7" y="4" width="2" height="2" fill="hsl(45 80% 60%)" />
    {/* Stem */}
    <rect x="7" y="8" width="2" height="5" fill="hsl(142 50% 40%)" />
    {/* Leaves */}
    <rect x="5" y="10" width="2" height="1" fill="hsl(142 50% 40%)" />
    <rect x="9" y="11" width="2" height="1" fill="hsl(142 50% 40%)" />
    {/* Pot */}
    <rect x="5" y="13" width="6" height="2" fill="hsl(25 60% 45%)" />
  </svg>
);

const PixelFood = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Plate */}
    <rect x="1" y="11" width="14" height="3" fill="hsl(var(--muted))" />
    <rect x="2" y="10" width="12" height="1" fill="hsl(var(--border))" />
    {/* Fork */}
    <rect x="2" y="2" width="1" height="8" fill="hsl(var(--muted-foreground))" />
    <rect x="1" y="2" width="1" height="3" fill="hsl(var(--muted-foreground))" />
    <rect x="3" y="2" width="1" height="3" fill="hsl(var(--muted-foreground))" />
    {/* Knife */}
    <rect x="12" y="2" width="2" height="8" fill="hsl(var(--muted-foreground))" />
    <rect x="13" y="1" width="1" height="1" fill="hsl(var(--muted-foreground))" />
    {/* Food */}
    <rect x="5" y="6" width="6" height="4" fill="hsl(var(--primary))" />
    <rect x="6" y="5" width="4" height="1" fill="hsl(15 70% 50%)" />
  </svg>
);

const PixelCamera = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Body */}
    <rect x="2" y="5" width="12" height="8" fill="hsl(var(--foreground))" />
    <rect x="3" y="6" width="10" height="6" fill="hsl(var(--muted))" />
    {/* Lens */}
    <rect x="5" y="7" width="6" height="4" fill="hsl(var(--foreground))" />
    <rect x="6" y="8" width="4" height="2" fill="hsl(200 70% 50%)" />
    {/* Flash */}
    <rect x="11" y="6" width="2" height="2" fill="hsl(45 80% 60%)" className={isActive ? "animate-pulse" : ""} />
    {/* Top */}
    <rect x="5" y="3" width="4" height="2" fill="hsl(var(--foreground))" />
    {/* Button */}
    <rect x="12" y="4" width="2" height="1" fill="hsl(var(--primary))" />
  </svg>
);

const PixelMusic = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Notes */}
    <rect x="4" y="2" width="2" height="8" fill="hsl(var(--foreground))" />
    <rect x="10" y="4" width="2" height="6" fill="hsl(var(--foreground))" />
    {/* Note heads */}
    <rect x="2" y="9" width="4" height="3" fill="hsl(var(--foreground))" />
    <rect x="8" y="9" width="4" height="3" fill="hsl(var(--foreground))" />
    {/* Beam */}
    <rect x="5" y="2" width="6" height="2" fill="hsl(var(--foreground))" />
    {/* Musical sparkles */}
    {isActive && (
      <>
        <rect x="1" y="3" width="1" height="1" fill="hsl(var(--primary))" className="animate-pulse" />
        <rect x="14" y="5" width="1" height="1" fill="hsl(var(--primary))" className="animate-pulse" />
        <rect x="13" y="2" width="1" height="1" fill="hsl(45 80% 60%)" className="animate-pulse" />
      </>
    )}
  </svg>
);

const PixelDinner = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Candle */}
    <rect x="7" y="4" width="2" height="6" fill="hsl(var(--muted))" />
    {/* Flame */}
    <rect x="7" y="2" width="2" height="2" fill="hsl(45 90% 55%)" className={isActive ? "animate-pulse" : ""} />
    <rect x="8" y="1" width="1" height="1" fill="hsl(25 90% 50%)" />
    {/* Plate */}
    <rect x="2" y="10" width="12" height="2" fill="hsl(var(--muted))" />
    <rect x="3" y="12" width="10" height="2" fill="hsl(var(--border))" />
    {/* Wine glass */}
    <rect x="12" y="5" width="2" height="1" fill="hsl(var(--muted-foreground))" />
    <rect x="12" y="6" width="2" height="3" fill="hsl(var(--primary))" />
    <rect x="13" y="9" width="1" height="2" fill="hsl(var(--muted-foreground))" />
    {/* Stars */}
    {isActive && (
      <>
        <rect x="1" y="1" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
        <rect x="14" y="0" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
        <rect x="3" y="2" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
      </>
    )}
  </svg>
);

// Avatar sprite
const PixelAvatar = () => (
  <svg viewBox="0 0 12 16" className="w-6 h-8 md:w-8 md:h-10" style={{ imageRendering: "pixelated" }}>
    {/* Hair */}
    <rect x="3" y="0" width="6" height="3" fill="hsl(25 50% 30%)" />
    <rect x="2" y="2" width="8" height="2" fill="hsl(25 50% 30%)" />
    {/* Face */}
    <rect x="3" y="3" width="6" height="5" fill="hsl(30 60% 75%)" />
    {/* Eyes */}
    <rect x="4" y="4" width="1" height="2" fill="hsl(var(--foreground))" />
    <rect x="7" y="4" width="1" height="2" fill="hsl(var(--foreground))" />
    {/* Smile */}
    <rect x="5" y="6" width="2" height="1" fill="hsl(var(--primary))" />
    {/* Body */}
    <rect x="2" y="8" width="8" height="5" fill="hsl(var(--primary))" />
    {/* Arms */}
    <rect x="0" y="9" width="2" height="3" fill="hsl(var(--primary))" />
    <rect x="10" y="9" width="2" height="3" fill="hsl(var(--primary))" />
    {/* Legs */}
    <rect x="3" y="13" width="2" height="3" fill="hsl(220 50% 40%)" />
    <rect x="7" y="13" width="2" height="3" fill="hsl(220 50% 40%)" />
  </svg>
);

const sprites: Record<string, React.FC<{ isActive: boolean; isPast: boolean }>> = {
  coffee: PixelCoffee,
  flower: PixelFlower,
  food: PixelFood,
  camera: PixelCamera,
  music: PixelMusic,
  dinner: PixelDinner,
};

// Pixel border pattern
const PixelBorder = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Outer border */}
    <div className="absolute inset-0 bg-[hsl(25_40%_25%)]" style={{ imageRendering: "pixelated" }} />
    {/* Inner border */}
    <div className="absolute inset-1 bg-[hsl(35_50%_45%)]" />
    {/* Content area */}
    <div className="absolute inset-2 bg-[hsl(25_30%_20%)]" />
    {/* Corner decorations */}
    <div className="absolute top-0 left-0 w-3 h-3 bg-[hsl(35_60%_55%)]" />
    <div className="absolute top-0 right-0 w-3 h-3 bg-[hsl(35_60%_55%)]" />
    <div className="absolute bottom-0 left-0 w-3 h-3 bg-[hsl(35_60%_55%)]" />
    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[hsl(35_60%_55%)]" />
    {/* Content */}
    <div className="relative z-10 p-4">{children}</div>
  </div>
);

const TimelineSection = () => {
  const [selectedEvent, setSelectedEvent] = useState<typeof itinerary[0] | null>(null);
  const activeIndex = itinerary.findIndex(item => item.isActive);

  // Path coordinates for the winding road
  const pathPoints = [
    { x: 10, y: 85 },
    { x: 25, y: 70 },
    { x: 45, y: 75 },
    { x: 55, y: 55 },
    { x: 75, y: 50 },
    { x: 90, y: 30 },
  ];

  return (
    <section className="py-12 md:py-20 bg-[hsl(142_30%_25%)] relative overflow-hidden">
      {/* Pixel UI Border Frame */}
      <div className="container px-4 md:px-6">
        <PixelBorder className="min-h-[600px] md:min-h-[700px]">
          {/* Section Header */}
          <motion.div
            className="text-center mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-pixel text-xs md:text-sm text-[hsl(45_80%_70%)] mb-2 tracking-wider">
              ~ ADVENTURE MAP ~
            </h2>
            <p className="font-pixel text-[8px] md:text-[10px] text-[hsl(45_60%_60%)]">
              Click a checkpoint to view details
            </p>
          </motion.div>

          {/* Pixel Map Container */}
          <div 
            className="relative w-full h-[400px] md:h-[500px] rounded overflow-hidden"
            style={{ imageRendering: "pixelated" }}
          >
            {/* Grass background with pattern */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: "hsl(120 35% 35%)",
                backgroundImage: `
                  linear-gradient(90deg, hsl(120 30% 30%) 1px, transparent 1px),
                  linear-gradient(hsl(120 30% 30%) 1px, transparent 1px)
                `,
                backgroundSize: "8px 8px",
              }}
            />

            {/* Decorative trees */}
            {[
              { x: 5, y: 20 }, { x: 15, y: 40 }, { x: 8, y: 60 },
              { x: 85, y: 15 }, { x: 92, y: 45 }, { x: 88, y: 70 },
              { x: 35, y: 15 }, { x: 65, y: 85 }, { x: 20, y: 90 },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-6 h-8 md:w-8 md:h-10"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <svg viewBox="0 0 8 10" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
                  <rect x="3" y="6" width="2" height="4" fill="hsl(25 50% 35%)" />
                  <rect x="1" y="2" width="6" height="5" fill="hsl(142 45% 35%)" />
                  <rect x="2" y="0" width="4" height="3" fill="hsl(142 50% 40%)" />
                </svg>
              </div>
            ))}

            {/* River */}
            <div 
              className="absolute w-[15%] h-full right-[30%] bg-[hsl(200_60%_45%)]"
              style={{
                clipPath: "polygon(30% 0%, 70% 0%, 90% 30%, 60% 50%, 80% 70%, 50% 100%, 20% 100%, 40% 70%, 10% 50%, 50% 30%)",
              }}
            />

            {/* Small pixel buildings */}
            <div className="absolute w-8 h-8 md:w-10 md:h-10" style={{ left: "70%", top: "65%" }}>
              <svg viewBox="0 0 10 10" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
                <rect x="1" y="4" width="8" height="6" fill="hsl(25 40% 50%)" />
                <rect x="0" y="2" width="10" height="3" fill="hsl(15 50% 40%)" />
                <rect x="3" y="6" width="2" height="4" fill="hsl(25 30% 30%)" />
                <rect x="6" y="5" width="2" height="2" fill="hsl(200 70% 70%)" />
              </svg>
            </div>

            {/* Dirt path connecting checkpoints */}
            <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: "pixelated" }}>
              <defs>
                <pattern id="dirtPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                  <rect width="8" height="8" fill="hsl(30 40% 40%)" />
                  <rect x="0" y="0" width="2" height="2" fill="hsl(30 35% 35%)" />
                  <rect x="4" y="4" width="2" height="2" fill="hsl(30 35% 35%)" />
                </pattern>
              </defs>
              <path
                d={`M ${pathPoints.map(p => `${p.x}%,${p.y}%`).join(" L ")}`}
                stroke="url(#dirtPattern)"
                strokeWidth="20"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Path border */}
              <path
                d={`M ${pathPoints.map(p => `${p.x}%,${p.y}%`).join(" L ")}`}
                stroke="hsl(30 30% 30%)"
                strokeWidth="24"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ zIndex: -1 }}
              />
            </svg>

            {/* Checkpoint sprites */}
            {itinerary.map((item, index) => {
              const SpriteComponent = sprites[item.sprite];
              const pos = pathPoints[index];
              
              return (
                <motion.button
                  key={index}
                  className={`absolute w-10 h-10 md:w-14 md:h-14 cursor-pointer focus:outline-none ${
                    item.isActive ? "z-20" : "z-10"
                  }`}
                  style={{ 
                    left: `${pos.x}%`, 
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => setSelectedEvent(item)}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  animate={item.isActive ? {
                    y: [0, -5, 0],
                    transition: { repeat: Infinity, duration: 0.8 }
                  } : {}}
                >
                  {/* Glow effect for active item */}
                  {item.isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[hsl(45_80%_60%)]"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.6, 0.2, 0.6],
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                  <SpriteComponent isActive={item.isActive} isPast={item.isPast} />
                </motion.button>
              );
            })}

            {/* Avatar on current location */}
            <motion.div
              className="absolute z-30"
              style={{
                left: `${pathPoints[activeIndex].x}%`,
                top: `${pathPoints[activeIndex].y}%`,
                transform: "translate(-50%, -120%)",
              }}
              animate={{
                y: [0, -3, 0],
              }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              <PixelAvatar />
            </motion.div>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-[hsl(25_30%_15%)] p-2 rounded border-2 border-[hsl(35_50%_45%)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-[hsl(45_80%_60%)] rounded-full animate-pulse" />
                <span className="font-pixel text-[6px] md:text-[8px] text-[hsl(45_70%_70%)]">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[hsl(var(--muted-foreground))] rounded-full opacity-50" />
                <span className="font-pixel text-[6px] md:text-[8px] text-[hsl(45_70%_70%)]">Completed</span>
              </div>
            </div>
          </div>
        </PixelBorder>
      </div>

      {/* Pixel Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[hsl(0_0%_0%)] bg-opacity-70"
              onClick={() => setSelectedEvent(null)}
            />
            
            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              {/* Pixel border frame */}
              <div className="relative bg-[hsl(25_25%_15%)] border-4 border-[hsl(35_50%_45%)] p-1">
                {/* Inner border */}
                <div className="border-2 border-[hsl(25_40%_30%)] p-4">
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] hover:bg-[hsl(0_60%_60%)] transition-colors"
                  >
                    <X className="w-4 h-4 text-[hsl(0_0%_100%)]" />
                  </button>

                  {/* Content */}
                  <div className="text-center">
                    {/* Sprite preview */}
                    <div className="w-16 h-16 mx-auto mb-4">
                      {(() => {
                        const SpriteComponent = sprites[selectedEvent.sprite];
                        return <SpriteComponent isActive={true} isPast={false} />;
                      })()}
                    </div>

                    {/* Time badge */}
                    <div className="inline-block bg-[hsl(var(--primary))] px-3 py-1 mb-3">
                      <span className="font-pixel text-[10px] text-[hsl(var(--primary-foreground))]">
                        {selectedEvent.time}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-pixel text-sm md:text-base text-[hsl(45_80%_70%)] mb-4">
                      {selectedEvent.title}
                    </h3>

                    {/* Description */}
                    <p className="font-pixel text-[8px] md:text-[10px] text-[hsl(45_60%_60%)] leading-relaxed">
                      {selectedEvent.description}
                    </p>

                    {/* Decorative pixel divider */}
                    <div className="flex justify-center gap-1 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-[hsl(var(--primary))]"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TimelineSection;
