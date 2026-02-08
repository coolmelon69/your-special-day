import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Check, Clock, RotateCcw } from "lucide-react";
import type { ItineraryItem } from "./TimelineSection";
import { burstConfetti, sparkleBurst } from "../utils/particles";

// Helper function to format the checked timestamp nicely
const formatCheckedDate = (checkedAt: string | null | undefined): string => {
  if (!checkedAt) return "";
  
  try {
    const date = new Date(checkedAt);
    // Format: "Jan 5, 4:30 PM"
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

// Component to display evidence image with fallback to sprite
const EvidenceImage = ({ 
  imageUrl, 
  fallback, 
  alt 
}: { 
  imageUrl: string; 
  fallback: React.ReactNode; 
  alt: string;
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover rounded border-2 border-[hsl(15_70%_55%)]"
      style={{ imageRendering: "pixelated" }}
      onError={() => setImageError(true)}
    />
  );
};

interface StampCollectionSectionProps {
  itineraryState: ItineraryItem[];
  onStampClick: (item: ItineraryItem) => void;
  onResetProgress: () => void;
  sprites: Record<string, React.FC<{ isActive: boolean; isPast: boolean }>>;
}

// Random rotation between -5 and 5 degrees for hand-pressed stamp look
const randomSlamRotation = () => (Math.random() * 10 - 5);

const StampCollectionSection = ({ 
  itineraryState, 
  onStampClick,
  onResetProgress,
  sprites 
}: StampCollectionSectionProps) => {
  const previousStateRef = useRef<ItineraryItem[]>([]);
  const [justCompletedIndex, setJustCompletedIndex] = useState<number | null>(null);
  const slamRotationRef = useRef<Record<number, number>>({});

  // Detect when stamps are collected: trigger particle effects and slam animation only on unlock (not on refresh)
  useEffect(() => {
    let slamClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

    if (previousStateRef.current.length === 0) {
      previousStateRef.current = [...itineraryState];
      return;
    }

    itineraryState.forEach((item, index) => {
      const previousItem = previousStateRef.current[index];
      
      // Only trigger when a stamp transitions from locked to completed (active unlock event)
      if (previousItem && !previousItem.isPast && item.isPast) {
        slamRotationRef.current[index] = randomSlamRotation();
        setJustCompletedIndex(index);
        slamClearTimeoutId = setTimeout(() => setJustCompletedIndex(null), 2500);

        setTimeout(() => {
          const gridCols = window.innerWidth >= 1024 ? 6 : window.innerWidth >= 640 ? 3 : 2;
          const row = Math.floor(index / gridCols);
          const col = index % gridCols;
          const cardWidth = window.innerWidth >= 1024 ? window.innerWidth / 6 : 
                           window.innerWidth >= 640 ? window.innerWidth / 3 : 
                           window.innerWidth / 2;
          const cardHeight = 200;
          const x = (col + 0.5) * cardWidth;
          const y = 200 + (row * (cardHeight + 24)) + (cardHeight / 2);
          sparkleBurst({ x, y, particleCount: 25 });
          setTimeout(() => {
            burstConfetti({
              particleCount: 50,
              origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            });
          }, 200);
        }, index * 100);
      }
    });

    previousStateRef.current = [...itineraryState];
    return () => {
      if (slamClearTimeoutId) clearTimeout(slamClearTimeoutId);
    };
  }, [itineraryState]);

  return (
    <section className="py-12 md:py-20 bg-[hsl(35_40%_85%)] relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-pixel text-lg md:text-xl text-[hsl(15_70%_40%)] mb-2 tracking-wider">
            ~ STAMP COLLECTION ~
          </h2>
          <p className="font-pixel text-[10px] md:text-[12px] text-[hsl(15_60%_35%)]">
            Collect stamps as you complete each adventure!
          </p>
        </motion.div>

        {/* Stamp Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-6xl mx-auto items-stretch">
          {itineraryState.map((item, index) => {
            const SpriteComponent = sprites[item.sprite];
            const isCompleted = item.isPast;
            const isJustCompleted = justCompletedIndex === index;
            const slamRotation = slamRotationRef.current[index] ?? 0;

            return (
              <motion.div
                key={index}
                className="h-full flex"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.4
                }}
              >
                <motion.button
                  onClick={() => {
                    onStampClick(item);
                    // Trigger sparkle on click
                    if (isCompleted) {
                      const button = document.querySelector(`[data-stamp-index="${index}"]`) as HTMLElement;
                      if (button) {
                        const rect = button.getBoundingClientRect();
                        sparkleBurst({
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2,
                          particleCount: 15,
                        });
                      }
                    }
                  }}
                  data-stamp-index={index}
                  className={`w-full h-full relative cursor-pointer focus:outline-none ${
                    isCompleted ? "cursor-pointer" : ""
                  }`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Stamp Card - jiggle on slam impact when just completed */}
                  <motion.div
                    className={`relative h-full min-h-[200px] p-4 md:p-6 rounded-lg border-4 transition-all flex flex-col ${
                      isCompleted
                        ? "bg-[hsl(35_45%_90%)] border-[hsl(15_70%_55%)] shadow-lg"
                        : "bg-[hsl(35_40%_88%)] border-[hsl(30_30%_60%)] opacity-70"
                    }`}
                    animate={isJustCompleted ? {
                      x: [0, -4, 4, -3, 3, -1, 1, 0],
                      transition: {
                        delay: 0.12,
                        duration: 0.35,
                        ease: "easeOut",
                      },
                    } : undefined}
                  >
                    {/* Decorative border pattern */}
                    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                      {/* Corner decorations */}
                      <div className={`absolute top-1 left-1 w-3 h-3 border-2 ${
                        isCompleted ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
                      }`} />
                      <div className={`absolute top-1 right-1 w-3 h-3 border-2 ${
                        isCompleted ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
                      }`} />
                      <div className={`absolute bottom-1 left-1 w-3 h-3 border-2 ${
                        isCompleted ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
                      }`} />
                      <div className={`absolute bottom-1 right-1 w-3 h-3 border-2 ${
                        isCompleted ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
                      }`} />
                      
                      {/* Decorative dots around border */}
                      {[...Array(8)].map((_, i) => {
                        const angle = (i * 45) * (Math.PI / 180);
                        const radius = 8;
                        const centerX = 50;
                        const centerY = 50;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        return (
                          <div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full ${
                              isCompleted ? "bg-[hsl(15_70%_55%)]" : "bg-[hsl(30_30%_50%)]"
                            }`}
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Sprite Icon or Evidence Image */}
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 flex-shrink-0 relative">
                      {isCompleted && item.imageUrl ? (
                        // Show synced evidence image if available
                        <EvidenceImage 
                          imageUrl={item.imageUrl}
                          fallback={<SpriteComponent isActive={item.isActive} isPast={item.isPast} />}
                          alt={item.title}
                        />
                      ) : (
                        // Show sprite icon if no image or not completed
                        <SpriteComponent isActive={item.isActive} isPast={item.isPast} />
                      )}
                    </div>

                    {/* Time Badge */}
                    <div className={`inline-block px-2 py-1 mb-2 rounded flex-shrink-0 ${
                      isCompleted
                        ? "bg-[hsl(15_70%_55%)] text-white"
                        : "bg-[hsl(30_30%_60%)] text-[hsl(30_20%_40%)]"
                    }`}>
                      <span className="font-pixel text-[8px] md:text-[10px] whitespace-nowrap">
                        {item.time}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`font-pixel text-xs md:text-sm mb-2 flex-grow flex items-center justify-center text-center break-words line-clamp-2 ${
                      isCompleted
                        ? "text-[hsl(15_70%_40%)]"
                        : "text-[hsl(30_20%_40%)]"
                    }`}>
                      {item.title}
                    </h3>

                    {/* Completion Indicator - postmark slam when just completed */}
                    <div className="flex flex-col items-center justify-center gap-1 mt-auto flex-shrink-0 relative">
                      {isCompleted ? (
                        <>
                          {/* Slam shadow: large blur → shrinks and darkens as stamp lands */}
                          {isJustCompleted && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                              initial={{ opacity: 0 }}
                              animate={{
                                opacity: [0.8, 0.4, 0],
                                scale: [3, 1.2, 1],
                              }}
                              transition={{
                                duration: 0.25,
                                ease: "easeOut",
                              }}
                              style={{
                                filter: "blur(12px)",
                                background: "radial-gradient(circle, hsl(15_70%_30%) 0%, transparent 70%)",
                                width: "120%",
                                height: "140%",
                              }}
                            />
                          )}
                          <motion.div
                            className={`flex flex-col items-center justify-center gap-1 relative z-10 ${isJustCompleted ? "stamp-ink-texture" : ""}`}
                            initial={isJustCompleted ? {
                              scale: 4,
                              opacity: 0,
                              rotate: slamRotation,
                            } : false}
                            animate={isJustCompleted ? {
                              scale: [4, 1, 1, 1],
                              opacity: [0, 1, 1, 1],
                              rotate: slamRotation,
                              y: [0, 0, -3, 0],
                              boxShadow: [
                                "0 4px 12px rgba(0,0,0,0.15)",
                                "0 4px 12px rgba(0,0,0,0.15)",
                                "0 8px 20px rgba(0,0,0,0.12)",
                                "0 2px 8px rgba(0,0,0,0.08)",
                              ],
                              transition: {
                                duration: 1.35,
                                times: [0, 0.148, 0.26, 1],
                                ease: "easeOut",
                              },
                            } : undefined}
                          >
                            <div className="flex items-center gap-1">
                              <Check className="w-4 h-4 text-[hsl(120_60%_50%)]" />
                              <span className="font-pixel text-[8px] md:text-[10px] text-[hsl(120_60%_50%)] whitespace-nowrap">
                                STAMPED
                              </span>
                            </div>
                            {item.checkedAt && (
                              <span className="font-pixel text-[7px] md:text-[9px] text-[hsl(15_60%_40%)] text-center mt-0.5">
                                Checked on: {formatCheckedDate(item.checkedAt)}
                              </span>
                            )}
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-[hsl(30_20%_50%)]" />
                          <span className="font-pixel text-[8px] md:text-[10px] text-[hsl(30_20%_50%)] whitespace-nowrap">
                            PENDING
                          </span>
                        </>
                      )}
                    </div>

                    {/* Glow effect for completed stamps */}
                    {isCompleted && (
                      <motion.div
                        className="absolute inset-0 rounded-lg bg-[hsl(15_70%_55%)] opacity-20 blur-md -z-10"
                        animate={{
                          opacity: [0.2, 0.3, 0.2],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                        }}
                      />
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Reset Progress Button */}
        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={onResetProgress}
            className="flex items-center gap-2 px-6 py-3 font-pixel text-xs md:text-sm rounded-lg border-2 transition-all bg-[hsl(0_60%_50%)] border-[hsl(0_50%_40%)] text-white hover:bg-[hsl(0_60%_60%)] hover:scale-105 active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              textRendering: "optimizeSpeed",
              WebkitFontSmoothing: "none",
              MozOsxFontSmoothing: "unset",
              fontSmooth: "never",
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Progress</span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default StampCollectionSection;

