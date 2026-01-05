import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Check, Lock, Trophy, Heart, Compass } from "lucide-react";
import {
  spiralConfetti,
  sparkleBurst,
  heartRain,
  burstConfetti,
  celebrationConfetti,
  pixelBurst,
} from "../utils/particles";
import type { ItineraryItem } from "./TimelineSection";
import ThreeDCouponCard from "./3DCouponCard";
import VoucherModal from "./VoucherModal";
import { useAdventure } from "@/contexts/AdventureContext";
import {
  syncCouponAchievements,
  loadCouponAchievements,
  mergeAchievementData,
  subscribeToCouponAchievements,
  type AchievementData as AchievementDataType,
} from "@/utils/supabaseSync";

export interface Coupon {
  id: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
  requiredStamps: number;
  category?: string;
}

// Default coupons (fallback if custom coupons not enabled)
const defaultCoupons: Coupon[] = [
  {
    id: 1,
    title: "Free Zoo Negara Entry",
    description: "A fun day exploring the zoo together!",
    emoji: "🦁",
    color: "from-pink-400 to-rose-500",
    requiredStamps: 1,
    category: "adventure",
  },
  {
    id: 2,
    title: "Dinner Choice",
    description: "Pick any restaurant, my treat!",
    emoji: "🍽️",
    color: "from-amber-400 to-orange-500",
    requiredStamps: 2,
    category: "romantic",
  },
  {
    id: 3,
    title: "Movie Pick",
    description: "You choose the movie, no complaints!",
    emoji: "🎬",
    color: "from-purple-400 to-indigo-500",
    requiredStamps: 3,
    category: "romantic",
  },
];

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlockedAt?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "adventure-seeker",
    name: "Adventure Seeker",
    description: "Redeemed your first coupon!",
    icon: <Compass className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
  },
  {
    id: "romantic-explorer",
    name: "Romantic Explorer",
    description: "Redeemed 2+ coupons",
    icon: <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
  },
  {
    id: "coupon-master",
    name: "Coupon Master",
    description: "Redeemed all available coupons!",
    icon: <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />,
  },
];

const ACHIEVEMENT_STORAGE_KEY = "coupon-achievements";

interface AchievementData {
  redeemedCouponIds: number[];
  achievementsUnlocked: string[];
  achievementTimestamps: Record<string, number>;
}

interface ProgressBarProps {
  completed: number;
  required: number;
  color: string;
}

const ProgressBar = ({ completed, required, color }: ProgressBarProps) => {
  const percentage = Math.min((completed / required) * 100, 100);
  
  return (
    <div className="mt-4 space-y-2">
      <div className="relative h-4 bg-white/20 rounded-full overflow-hidden border-2 border-white/30" style={{ imageRendering: "pixelated" }}>
        <motion.div
          className={`h-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-white/90 font-pixel text-center">
        {completed}/{required} stamps collected
      </p>
    </div>
  );
};

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isNewlyUnlocked: boolean;
}

const AchievementBadge = ({ achievement, isUnlocked, isNewlyUnlocked }: AchievementBadgeProps) => {
  return (
    <motion.div
      className={`relative p-2 sm:p-3 md:p-4 rounded-lg border-2 ${
        isUnlocked
          ? "bg-[hsl(35_45%_90%)] border-[hsl(15_70%_55%)] shadow-lg"
          : "bg-[hsl(35_40%_88%)] border-[hsl(30_30%_60%)] opacity-60"
      }`}
      initial={{ scale: isNewlyUnlocked ? 0.8 : 1, opacity: isNewlyUnlocked ? 0 : 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pixel-art border decorations */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div className={`absolute top-1 left-1 w-2 h-2 border-2 ${
          isUnlocked ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
        }`} />
        <div className={`absolute top-1 right-1 w-2 h-2 border-2 ${
          isUnlocked ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
        }`} />
        <div className={`absolute bottom-1 left-1 w-2 h-2 border-2 ${
          isUnlocked ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
        }`} />
        <div className={`absolute bottom-1 right-1 w-2 h-2 border-2 ${
          isUnlocked ? "border-[hsl(15_70%_55%)]" : "border-[hsl(30_30%_50%)]"
        }`} />
      </div>

      <div className="flex flex-col items-center text-center relative z-10">
        <div className={`mb-1 sm:mb-2 ${isUnlocked ? "text-[hsl(15_70%_55%)]" : "text-[hsl(30_30%_50%)] grayscale"}`}>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            {achievement.icon}
          </div>
        </div>
        <h4 className={`font-pixel text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${
          isUnlocked ? "text-[hsl(15_70%_40%)]" : "text-[hsl(30_20%_40%)]"
        }`}>
          {achievement.name}
        </h4>
        <p className={`font-pixel text-[9px] sm:text-[10px] ${
          isUnlocked ? "text-[hsl(15_60%_35%)]" : "text-[hsl(30_20%_40%)]"
        }`}>
          {achievement.description}
        </p>
        {isUnlocked && achievement.unlockedAt && (
          <p className="font-pixel text-[8px] text-[hsl(15_60%_35%)] mt-1">
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Glow effect for newly unlocked */}
      {isNewlyUnlocked && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-[hsl(15_70%_55%)] opacity-30 blur-md -z-10"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        />
      )}
    </motion.div>
  );
};

interface GiftCouponsSectionProps {
  itineraryState: ItineraryItem[];
}

const GiftCouponsSection = ({ itineraryState }: GiftCouponsSectionProps) => {
  const { coupons: contextCoupons, refreshCoupons, user } = useAdventure();
  const [redeemedCoupons, setRedeemedCoupons] = useState<number[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [achievementData, setAchievementData] = useState<AchievementData>({
    redeemedCouponIds: [],
    achievementsUnlocked: [],
    achievementTimestamps: {},
  });
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  
  // Track if initial load from Supabase has completed
  const hasLoadedFromSupabase = useRef(false);
  // Debounce timer for Supabase sync
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Realtime subscription cleanup ref
  const unsubscribeCouponsRef = useRef<(() => void) | null>(null);

  // Helper function to convert string IDs to unique numeric IDs
  // Maps custom coupon string IDs to a range starting from 10000 to avoid collisions with default coupon IDs (1-3)
  const convertCouponId = (id: number | string): number => {
    if (typeof id === 'number') {
      return id;
    }
    // For string IDs, create a hash-based numeric ID starting from 10000
    // This ensures no collisions with default coupon IDs (1-3)
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Map to range 10000+ to avoid collisions with default IDs
    return 10000 + Math.abs(hash);
  };

  // Use coupons from context, fallback to defaults
  const coupons: Coupon[] = contextCoupons.length > 0 
    ? contextCoupons.map(c => ({
        id: convertCouponId(c.id),
        title: c.title,
        description: c.description,
        emoji: c.emoji,
        color: c.color,
        requiredStamps: c.requiredStamps,
        category: c.category,
      }))
    : defaultCoupons;

  // Refresh coupons when component mounts
  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  // Subscribe to realtime coupon achievements changes
  useEffect(() => {
    if (!user) {
      // Unsubscribe if user logs out
      if (unsubscribeCouponsRef.current) {
        unsubscribeCouponsRef.current();
        unsubscribeCouponsRef.current = null;
      }
      return;
    }

    // Subscribe to realtime changes
    console.log("Setting up realtime subscription for coupon achievements");
    const unsubscribe = subscribeToCouponAchievements(user.id, (updatedData) => {
      console.log("Realtime coupon achievements update received:", updatedData);
      
      // Update state with the new data from another device
      setRedeemedCoupons(updatedData.redeemedCouponIds);
      setAchievementData(updatedData);
      
      // Also save to localStorage for consistency
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const dataToSave: AchievementDataType = {
            redeemedCouponIds: updatedData.redeemedCouponIds,
            achievementsUnlocked: updatedData.achievementsUnlocked,
            achievementTimestamps: updatedData.achievementTimestamps || {},
          };
          localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(dataToSave));
        }
      } catch (error) {
        console.error("Error saving realtime update to localStorage:", error);
      }
    });

    unsubscribeCouponsRef.current = unsubscribe;

    // Cleanup on unmount or user change
    return () => {
      if (unsubscribeCouponsRef.current) {
        unsubscribeCouponsRef.current();
        unsubscribeCouponsRef.current = null;
      }
    };
  }, [user]);

  // Load achievement data from Supabase first, then fallback to localStorage
  useEffect(() => {
    // If no user, reset flag and return early
    // This ensures we load from Supabase when user becomes available
    if (!user) {
      hasLoadedFromSupabase.current = false;
      return;
    }
    
    const loadAchievementData = async () => {
      if (hasLoadedFromSupabase.current) {
        return;
      }
      hasLoadedFromSupabase.current = true;
      
      console.log("Loading coupon achievements from Supabase...");

      try {
        // Load from localStorage first (as fallback)
        let localData: AchievementDataType | null = null;
        if (typeof window !== "undefined" && window.localStorage) {
          const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as AchievementDataType;
              if (parsed.redeemedCouponIds && Array.isArray(parsed.redeemedCouponIds)) {
                localData = parsed;
              }
            } catch (parseError) {
              console.error("Error parsing localStorage achievement data:", parseError);
            }
          }
        }

        // Load from Supabase
        console.log("Loading coupon achievements from Supabase for user:", user.email);
        const remoteResult = await loadCouponAchievements();
        console.log("Loaded coupon achievements from Supabase:", remoteResult);

        // Get localStorage timestamp if available (try to parse from stored data)
        let localTimestamp: number | undefined;
        if (localData && typeof window !== "undefined" && window.localStorage) {
          try {
            // Try to get timestamp from achievement_timestamps (use the latest one)
            const timestamps = Object.values(localData.achievementTimestamps || {});
            if (timestamps.length > 0) {
              localTimestamp = Math.max(...timestamps);
            }
          } catch {
            // If we can't determine local timestamp, use current time as fallback
            localTimestamp = Date.now();
          }
        }

        // When user is authenticated, always prefer Supabase data if it exists
        let finalData: AchievementDataType;
        if (remoteResult?.data) {
          // Supabase data exists - use it (it's the source of truth)
          finalData = remoteResult.data;
          console.log("Loaded remote coupon data from Supabase, using it");
        } else if (localData) {
          // No Supabase data but local data exists - use local and sync to Supabase
          finalData = localData;
          try {
            console.log("Syncing local coupon data to Supabase (first time)");
            await syncCouponAchievements(localData);
          } catch (error) {
            console.error("Error syncing local data to Supabase:", error);
            // Non-blocking - the sync effect will retry later
          }
        } else {
          // No data at all - start fresh
          finalData = {
            redeemedCouponIds: [],
            achievementsUnlocked: [],
            achievementTimestamps: {},
          };
          console.log("No coupon data found for user, starting fresh");
        }

        // Update state with final data
        setRedeemedCoupons(finalData.redeemedCouponIds);
        setAchievementData(finalData);
        
        // Save to localStorage for offline access (always use Supabase data if available)
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(finalData));
          }
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      } catch (error) {
        console.error("Error loading achievement data:", error);
        // Fallback to localStorage only
        if (typeof window !== "undefined" && window.localStorage) {
          const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as AchievementDataType;
              if (parsed.redeemedCouponIds && Array.isArray(parsed.redeemedCouponIds)) {
                setRedeemedCoupons(parsed.redeemedCouponIds);
                setAchievementData({
                  redeemedCouponIds: parsed.redeemedCouponIds || [],
                  achievementsUnlocked: parsed.achievementsUnlocked || [],
                  achievementTimestamps: parsed.achievementTimestamps || {},
                });
              }
            } catch (parseError) {
              console.error("Error parsing localStorage data:", parseError);
            }
          }
        }
      }
    };

    // Load if user is authenticated
    if (user) {
      loadAchievementData();
    }
  }, [user]);

  // Save achievement data to localStorage and sync to Supabase
  useEffect(() => {
    // Skip if this is the initial load (we handle that separately)
    if (!hasLoadedFromSupabase.current) {
      return;
    }

    const dataToSave: AchievementDataType = {
      redeemedCouponIds: redeemedCoupons,
      achievementsUnlocked: achievementData.achievementsUnlocked,
      achievementTimestamps: achievementData.achievementTimestamps || {},
    };

    // Always save to localStorage (immediate, always succeeds)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error("Error saving achievement data to localStorage:", error);
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, achievements not saved");
      }
    }

    // Debounce Supabase sync (500ms delay to avoid too many requests)
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(async () => {
      if (!user) {
        // User not authenticated, skip sync
        console.log("Skipping coupon sync - user not authenticated");
        return;
      }
      try {
        console.log("Syncing coupon achievements:", dataToSave);
        const success = await syncCouponAchievements(dataToSave);
        if (success) {
          console.log("Coupon achievements synced successfully");
        } else {
          console.warn("Coupon achievements sync returned false");
        }
      } catch (error) {
        console.error("Error syncing coupon achievements to Supabase:", error);
        // Non-blocking: continue even if sync fails
      }
    }, 500);

    // Cleanup timer on unmount or dependency change
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [redeemedCoupons, achievementData.achievementsUnlocked, achievementData.achievementTimestamps, user]);

  // Calculate completed stamps
  const completedStamps = itineraryState.filter(item => item.isPast).length;

  // Check and award achievements
  useEffect(() => {
    const redeemedCount = redeemedCoupons.length;
    const newAchievements: string[] = [];
    const now = Date.now();
    
    setAchievementData(prev => {
      const updatedUnlocked = [...prev.achievementsUnlocked];
      const updatedTimestamps = { ...prev.achievementTimestamps };

      // Adventure Seeker: 1+ redeemed
      if (redeemedCount >= 1 && !updatedUnlocked.includes("adventure-seeker")) {
        updatedUnlocked.push("adventure-seeker");
        updatedTimestamps["adventure-seeker"] = now;
        newAchievements.push("adventure-seeker");
      }

      // Romantic Explorer: 2+ redeemed
      if (redeemedCount >= 2 && !updatedUnlocked.includes("romantic-explorer")) {
        updatedUnlocked.push("romantic-explorer");
        updatedTimestamps["romantic-explorer"] = now;
        newAchievements.push("romantic-explorer");
      }

      // Coupon Master: All coupons redeemed
      if (redeemedCount >= coupons.length && !updatedUnlocked.includes("coupon-master")) {
        updatedUnlocked.push("coupon-master");
        updatedTimestamps["coupon-master"] = now;
        newAchievements.push("coupon-master");
      }

      if (newAchievements.length > 0) {
        // Trigger context-aware particle effects based on achievement type
        newAchievements.forEach((achievementId, index) => {
          setTimeout(() => {
            switch (achievementId) {
              case "adventure-seeker":
                // Adventure theme: spiral confetti + sparkle burst
                spiralConfetti({
                  particleCount: 150,
                  origin: { x: 0.5, y: 0.6 },
                });
                sparkleBurst({
                  x: window.innerWidth / 2,
                  y: window.innerHeight * 0.6,
                  particleCount: 30,
                });
                break;
              case "romantic-explorer":
                // Romantic theme: heart rain + burst confetti
                heartRain({
                  duration: 4000,
                  heartCount: 40,
                });
                burstConfetti({
                  particleCount: 120,
                  origin: { x: 0.5, y: 0.6 },
                });
                break;
              case "coupon-master":
                // Grand finale: celebration confetti + pixel burst
                celebrationConfetti({
                  bursts: 8,
                  particleCount: 150,
                });
                setTimeout(() => {
                  pixelBurst({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    particleCount: 80,
                  });
                }, 500);
                break;
              default:
                // Default celebration
                burstConfetti({
                  particleCount: 100,
                  origin: { x: 0.5, y: 0.6 },
                });
            }
          }, index * 400);
        });

        // Clear newly unlocked after animation
        setTimeout(() => {
          setNewlyUnlockedAchievements([]);
        }, 5000);
      }

      return {
        ...prev,
        achievementsUnlocked: updatedUnlocked,
        achievementTimestamps: updatedTimestamps,
      };
    });

    if (newAchievements.length > 0) {
      setNewlyUnlockedAchievements(newAchievements);
    }
  }, [redeemedCoupons.length]);

  const handleCouponClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleRedeem = (id: number) => {
    if (!redeemedCoupons.includes(id)) {
      setRedeemedCoupons([...redeemedCoupons, id]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCoupon(null);
  };

  // Check if coupon is unlocked
  const isCouponUnlocked = (coupon: Coupon) => {
    return completedStamps >= coupon.requiredStamps;
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-romantic">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Gift className="mx-auto mb-4 text-primary" size={36} />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Your <span className="text-gradient-romantic">Gift Coupons</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Unlock and redeem special coupons as you complete your adventures. Each coupon is a promise for a wonderful experience together!
          </p>
        </motion.div>

        {/* Achievement Badges Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-center mb-6">
            <span className="text-gradient-romantic">Achievements</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-4xl mx-auto">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = achievementData.achievementsUnlocked.includes(achievement.id);
              const isNewlyUnlocked = newlyUnlockedAchievements.includes(achievement.id);
              const unlockedAt = achievementData.achievementTimestamps?.[achievement.id];
              
              return (
                <AchievementBadge
                  key={achievement.id}
                  achievement={{
                    ...achievement,
                    unlockedAt,
                  }}
                  isUnlocked={isUnlocked}
                  isNewlyUnlocked={isNewlyUnlocked}
                />
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
          {coupons.map((coupon, index) => {
            const isRedeemed = redeemedCoupons.includes(coupon.id);
            const isUnlocked = isCouponUnlocked(coupon);
            const isLocked = !isUnlocked && !isRedeemed;
            
            return (
              <motion.div
                key={coupon.id}
                className="h-[280px] sm:h-[320px] md:h-[400px]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <ThreeDCouponCard
                  coupon={coupon}
                  isRedeemed={isRedeemed}
                  isLocked={isLocked}
                  completedStamps={completedStamps}
                  onCardClick={() => !isLocked && handleCouponClick(coupon)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Voucher Modal */}
        <VoucherModal
          coupon={selectedCoupon}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRedeem={handleRedeem}
          isRedeemed={selectedCoupon ? redeemedCoupons.includes(selectedCoupon.id) : false}
        />

        <motion.p
          className="text-center text-muted-foreground mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          * Coupons have no expiration date and can be used anytime! 💕
        </motion.p>
      </div>
    </section>
  );
};

export default GiftCouponsSection;