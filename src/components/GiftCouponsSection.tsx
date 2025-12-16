import { useState, useEffect } from "react";
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

export interface Coupon {
  id: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
  requiredStamps: number;
  category?: string;
}

const coupons: Coupon[] = [
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
    icon: <Compass className="w-8 h-8" />,
  },
  {
    id: "romantic-explorer",
    name: "Romantic Explorer",
    description: "Redeemed 2+ coupons",
    icon: <Heart className="w-8 h-8" />,
  },
  {
    id: "coupon-master",
    name: "Coupon Master",
    description: "Redeemed all available coupons!",
    icon: <Trophy className="w-8 h-8" />,
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
      className={`relative p-4 rounded-lg border-2 ${
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
        <div className={`mb-2 ${isUnlocked ? "text-[hsl(15_70%_55%)]" : "text-[hsl(30_30%_50%)] grayscale"}`}>
          {achievement.icon}
        </div>
        <h4 className={`font-pixel text-sm font-bold mb-1 ${
          isUnlocked ? "text-[hsl(15_70%_40%)]" : "text-[hsl(30_20%_40%)]"
        }`}>
          {achievement.name}
        </h4>
        <p className={`font-pixel text-[10px] ${
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
  const [redeemedCoupons, setRedeemedCoupons] = useState<number[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [achievementData, setAchievementData] = useState<AchievementData>({
    redeemedCouponIds: [],
    achievementsUnlocked: [],
    achievementTimestamps: {},
  });
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);

  // Load achievement data from localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      
      const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AchievementData;
        if (parsed.redeemedCouponIds && Array.isArray(parsed.redeemedCouponIds)) {
          setRedeemedCoupons(parsed.redeemedCouponIds);
          setAchievementData({
            redeemedCouponIds: parsed.redeemedCouponIds || [],
            achievementsUnlocked: parsed.achievementsUnlocked || [],
            achievementTimestamps: parsed.achievementTimestamps || {},
          });
        }
      }
    } catch (error) {
      console.error("Error loading achievement data:", error);
    }
  }, []);

  // Save achievement data to localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return;
      }
      
      const dataToSave: AchievementData = {
        redeemedCouponIds: redeemedCoupons,
        achievementsUnlocked: achievementData.achievementsUnlocked,
        achievementTimestamps: achievementData.achievementTimestamps || {},
      };
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving achievement data:", error);
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, achievements not saved");
      }
    }
  }, [redeemedCoupons, achievementData.achievementsUnlocked]);

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
            Redeem these special coupons anytime you want!
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {coupons.map((coupon, index) => {
            const isRedeemed = redeemedCoupons.includes(coupon.id);
            const isUnlocked = isCouponUnlocked(coupon);
            const isLocked = !isUnlocked && !isRedeemed;
            
            return (
              <motion.div
                key={coupon.id}
                className="h-[400px]"
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