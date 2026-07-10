import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Check, Clock } from "lucide-react";
import type { ItineraryItem } from "./TimelineSection";
import { burstConfetti, sparkleBurst } from "../utils/particles";
import { Eyebrow, DisplayHeading, Pill } from "@/components/editorial";
import { cn } from "@/lib/utils";

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
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  );
};

interface StampCollectionSectionProps {
  itineraryState: ItineraryItem[];
  onStampClick: (item: ItineraryItem) => void;
  sprites: Record<string, React.FC<{ isActive: boolean; isPast: boolean }>>;
}

// Random rotation between -5 and 5 degrees for hand-pressed stamp look
const randomSlamRotation = () => (Math.random() * 10 - 5);

const StampCollectionSection = ({ 
  itineraryState, 
  onStampClick,
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
    <section className="py-12 md:py-20 bg-background relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <motion.div
          className="mb-12 max-w-[42ch]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Eyebrow>The Collection</Eyebrow>
          <DisplayHeading as="h2" className="mt-4">
            Each stop, <em>a stamp</em> we keep<span className="dot-accent">.</span>
          </DisplayHeading>
        </motion.div>

        {/* Stamp Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-6xl mx-auto items-stretch">
          {itineraryState.map((item, index) => {
            const SpriteComponent = sprites[item.sprite];
            const isCompleted = item.isPast;
            const isActive = item.isActive && !item.isPast;
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
                  className="w-full h-full relative cursor-pointer focus:outline-none"
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Stamp Card - jiggle on slam impact when just completed */}
                  <motion.div
                    className={cn(
                      "relative h-full min-h-[200px] p-4 md:p-5 rounded-2xl border transition-all flex flex-col text-center bg-card",
                      isCompleted
                        ? "border-rose/40 shadow-romantic"
                        : isActive
                        ? "border-primary/40"
                        : "border-border opacity-60"
                    )}
                    animate={isJustCompleted ? {
                      x: [0, -4, 4, -3, 3, -1, 1, 0],
                      transition: {
                        delay: 0.12,
                        duration: 0.35,
                        ease: "easeOut",
                      },
                    } : undefined}
                  >
                    {/* Sprite Icon or Evidence Image */}
                    <div className={cn(
                       "w-full aspect-square mb-3 flex-shrink-0 rounded-xl border overflow-hidden",
                       isCompleted && item.imageUrl ? "" : "grid place-items-center p-3",
                       isCompleted ? "bg-rose/10 border-rose/30" : "bg-foreground/5 border-border"
                     )}>
                       {isCompleted && item.imageUrl ? (
                         <EvidenceImage
                           imageUrl={item.imageUrl}
                           fallback={<div className="w-14 h-14 grid place-items-center p-3"><SpriteComponent isActive={item.isActive} isPast={item.isPast} /></div>}
                           alt={item.title}
                         />
                       ) : (
                         <div className="w-14 h-14"><SpriteComponent isActive={item.isActive} isPast={item.isPast} /></div>
                       )}
                     </div>

                    {/* Time Badge */}
                    <div className="mb-2 flex-shrink-0 flex justify-center">
                      <Pill variant={isCompleted ? "rose" : isActive ? "accent" : "tag"}>
                        {item.time}
                      </Pill>
                    </div>

                    {/* Title */}
                    <h3 className={cn(
                      "font-medium text-sm mb-2 flex-grow flex items-center justify-center text-center break-words line-clamp-2",
                      isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {item.is_secret && !isCompleted ? "Mystery Stop" : item.title}
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
                                background: "radial-gradient(circle, hsl(330 60% 40%) 0%, transparent 70%)",
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
                            <div className="flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="font-mono text-[10px] uppercase tracking-wide text-green-600 whitespace-nowrap">
                                Stamped
                              </span>
                            </div>
                            {item.checkedAt && (
                              <span className="font-mono text-[9px] text-muted-foreground text-center mt-0.5">
                                {formatCheckedDate(item.checkedAt)}
                              </span>
                            )}
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                            {isActive ? "Up next" : "Pending"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Glow effect for completed stamps */}
                    {isCompleted && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-rose opacity-20 blur-md -z-10"
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
      </div>
    </section>
  );
};

export default StampCollectionSection;

