import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Check, Clock, RotateCcw } from "lucide-react";
import type { ItineraryItem } from "./TimelineSection";
import { burstConfetti, sparkleBurst } from "../utils/particles";

interface StampCollectionSectionProps {
  itineraryState: ItineraryItem[];
  onStampClick: (item: ItineraryItem) => void;
  onResetProgress: () => void;
  sprites: Record<string, React.FC<{ isActive: boolean; isPast: boolean }>>;
}

const StampCollectionSection = ({ 
  itineraryState, 
  onStampClick,
  onResetProgress,
  sprites 
}: StampCollectionSectionProps) => {
  const previousStateRef = useRef<ItineraryItem[]>([]);

  // Detect when stamps are collected and trigger particle effects
  useEffect(() => {
    if (previousStateRef.current.length === 0) {
      previousStateRef.current = [...itineraryState];
      return;
    }

    itineraryState.forEach((item, index) => {
      const previousItem = previousStateRef.current[index];
      
      // Check if a stamp was just completed (wasn't past before, is past now)
      if (previousItem && !previousItem.isPast && item.isPast) {
        // Trigger celebration effect for newly collected stamp
        setTimeout(() => {
          // Calculate position based on grid layout
          const gridCols = window.innerWidth >= 1024 ? 6 : window.innerWidth >= 640 ? 3 : 2;
          const row = Math.floor(index / gridCols);
          const col = index % gridCols;
          
          // Approximate center of stamp card
          const cardWidth = window.innerWidth >= 1024 ? window.innerWidth / 6 : 
                           window.innerWidth >= 640 ? window.innerWidth / 3 : 
                           window.innerWidth / 2;
          const cardHeight = 200; // Approximate card height
          const x = (col + 0.5) * cardWidth;
          const y = 200 + (row * (cardHeight + 24)) + (cardHeight / 2); // 24px gap
          
          // Sparkle burst at stamp location
          sparkleBurst({
            x,
            y,
            particleCount: 25,
          });
          
          // Confetti burst for celebration
          setTimeout(() => {
            burstConfetti({
              particleCount: 50,
              origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            });
          }, 200);
        }, index * 100); // Stagger effects for multiple stamps
      }
    });

    previousStateRef.current = [...itineraryState];
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
            
            return (
              <motion.div
                key={index}
                className="h-full flex"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                animate={isCompleted ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={isCompleted ? {
                  delay: index * 0.1,
                  duration: 0.4,
                  scale: { repeat: Infinity, duration: 2, delay: index * 0.1 + 0.4 }
                } : {
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
                  {/* Stamp Card */}
                  <div className={`relative h-full min-h-[200px] p-4 md:p-6 rounded-lg border-4 transition-all flex flex-col ${
                    isCompleted
                      ? "bg-[hsl(35_45%_90%)] border-[hsl(15_70%_55%)] shadow-lg"
                      : "bg-[hsl(35_40%_88%)] border-[hsl(30_30%_60%)] opacity-70"
                  }`}>
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

                    {/* Sprite Icon */}
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 flex-shrink-0">
                      <SpriteComponent isActive={item.isActive} isPast={item.isPast} />
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

                    {/* Completion Indicator */}
                    <div className="flex items-center justify-center gap-1 mt-auto flex-shrink-0">
                      {isCompleted ? (
                        <>
                          <Check className="w-4 h-4 text-[hsl(120_60%_50%)]" />
                          <span className="font-pixel text-[8px] md:text-[10px] text-[hsl(120_60%_50%)] whitespace-nowrap">
                            STAMPED
                          </span>
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
                  </div>
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

