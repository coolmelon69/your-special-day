import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, Trophy, Heart, Compass } from "lucide-react";
import {
  spiralConfetti,
  sparkleBurst,
  heartRain,
  burstConfetti,
  celebrationConfetti,
  pixelBurst,
} from "../utils/particles";
import type { ItineraryItem } from "./TimelineSection";
import EditorialCouponCard from "./EditorialCouponCard";
import VoucherModal from "./VoucherModal";
import { Eyebrow, DisplayHeading, EditorialFigure } from "@/components/editorial";
import { cn } from "@/lib/utils";
import { useAdventure } from "@/contexts/AdventureContext";
import {
  syncCouponAchievements,
  loadCouponAchievements,
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
    description: "Redeemed at least 5 coupons",
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

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isNewlyUnlocked: boolean;
}

const AchievementBadge = ({ achievement, isUnlocked, isNewlyUnlocked }: AchievementBadgeProps) => {
  return (
    <motion.div
      className={cn(
        "feature relative rounded-2xl border bg-card p-6 transition-all",
        isUnlocked ? "border-rose/40 shadow-romantic" : "border-border opacity-60"
      )}
      initial={{ scale: isNewlyUnlocked ? 0.8 : 1, opacity: isNewlyUnlocked ? 0 : 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "feature-mark",
          isUnlocked ? "text-rose border-rose/40" : "text-muted-foreground"
        )}
      >
        {achievement.icon}
      </div>
      <h3 className="font-serif text-xl font-bold text-foreground mb-1.5">{achievement.name}</h3>
      <p className="text-[15px] text-muted-foreground">{achievement.description}</p>

      {isUnlocked ? (
        <p className="font-mono text-[11px] uppercase tracking-wide text-rose mt-3">
          ✓ Unlocked
          {achievement.unlockedAt && ` · ${new Date(achievement.unlockedAt).toLocaleDateString()}`}
        </p>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mt-3 flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Locked
        </p>
      )}

      {/* Glow effect for newly unlocked */}
      {isNewlyUnlocked && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-rose opacity-30 blur-md -z-10"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
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
  const [processingCouponId, setProcessingCouponId] = useState<number | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  
  // Track if initial load from Supabase has completed
  const hasLoadedFromSupabase = useRef(false);
  // Realtime subscription cleanup ref
  const unsubscribeCouponsRef = useRef<(() => void) | null>(null);
  // Track previous unlocked achievements to animate newly unlocked (DB-driven)
  const prevUnlockedRef = useRef<string[]>([]);

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

  // Load achievement data from Supabase only (DB is source of truth)
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
        console.log("Loading coupon achievements from Supabase for user:", user.email);
        const remoteResult = await loadCouponAchievements();
        console.log("Loaded coupon achievements from Supabase:", remoteResult);

        const finalData: AchievementDataType = remoteResult?.data ?? {
          redeemedCouponIds: [],
          achievementsUnlocked: [],
          achievementTimestamps: {},
        };

        setRedeemedCoupons(finalData.redeemedCouponIds);
        setAchievementData(finalData);
        prevUnlockedRef.current = finalData.achievementsUnlocked;

        try {
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(finalData));
          }
        } catch (err) {
          console.error("Error saving to localStorage:", err);
        }
      } catch (error) {
        console.error("Error loading achievement data:", error);
        const empty: AchievementDataType = {
          redeemedCouponIds: [],
          achievementsUnlocked: [],
          achievementTimestamps: {},
        };
        setRedeemedCoupons(empty.redeemedCouponIds);
        setAchievementData(empty);
        prevUnlockedRef.current = empty.achievementsUnlocked;
      }
    };

    // Load if user is authenticated
    if (user) {
      loadAchievementData();
    }
  }, [user]);

  // DB-driven micro-celebrations when achievements become unlocked
  useEffect(() => {
    const prev = prevUnlockedRef.current;
    const current = achievementData.achievementsUnlocked || [];
    const newly = current.filter((id) => !prev.includes(id));
    if (newly.length === 0) {
      prevUnlockedRef.current = current;
      return;
    }

    newly.forEach((achievementId, index) => {
      setTimeout(() => {
        switch (achievementId) {
          case "adventure-seeker":
            spiralConfetti({ particleCount: 150, origin: { x: 0.5, y: 0.6 } });
            sparkleBurst({ x: window.innerWidth / 2, y: window.innerHeight * 0.6, particleCount: 30 });
            break;
          case "romantic-explorer":
            heartRain({ duration: 4000, heartCount: 40 });
            burstConfetti({ particleCount: 120, origin: { x: 0.5, y: 0.6 } });
            break;
          case "coupon-master":
            celebrationConfetti({ bursts: 8, particleCount: 150 });
            setTimeout(() => {
              pixelBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2, particleCount: 80 });
            }, 500);
            break;
          default:
            burstConfetti({ particleCount: 100, origin: { x: 0.5, y: 0.6 } });
        }
      }, index * 400);
    });

    setNewlyUnlockedAchievements(newly);
    setTimeout(() => setNewlyUnlockedAchievements([]), 5000);
    prevUnlockedRef.current = current;
  }, [achievementData.achievementsUnlocked]);

  // Calculate completed stamps
  const completedStamps = itineraryState.filter(item => item.isPast).length;

  // Achievements are persisted and loaded from the DB (single source of truth)

  const handleCouponClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleRedeem = async (id: number): Promise<boolean> => {
    if (!user) {
      setRedeemError("The magic had a hiccup, try again!");
      return false;
    }
    if (processingCouponId != null) return false;

    setProcessingCouponId(id);
    setRedeemError(null);
    try {
      // Always base the write on the latest DB state to avoid overwriting concurrent changes
      const remote = await loadCouponAchievements();
      const current = remote?.data ?? achievementData;

      if (current.redeemedCouponIds.includes(id)) {
        return true;
      }

      const nextRedeemed = [...current.redeemedCouponIds, id];
      const now = Date.now();
      const nextUnlocked = [...(current.achievementsUnlocked || [])];
      const nextTimestamps = { ...(current.achievementTimestamps || {}) };

      if (nextRedeemed.length >= 1 && !nextUnlocked.includes("adventure-seeker")) {
        nextUnlocked.push("adventure-seeker");
        nextTimestamps["adventure-seeker"] = now;
      }
      if (nextRedeemed.length >= 5 && !nextUnlocked.includes("romantic-explorer")) {
        nextUnlocked.push("romantic-explorer");
        nextTimestamps["romantic-explorer"] = now;
      }
      if (nextRedeemed.length >= coupons.length && !nextUnlocked.includes("coupon-master")) {
        nextUnlocked.push("coupon-master");
        nextTimestamps["coupon-master"] = now;
      }

      const nextData: AchievementDataType = {
        redeemedCouponIds: nextRedeemed,
        achievementsUnlocked: nextUnlocked,
        achievementTimestamps: nextTimestamps,
      };

      const ok = await syncCouponAchievements(nextData);
      if (!ok) {
        setRedeemError("The magic had a hiccup, try again!");
        return false;
      }

      // Re-validate from DB after a successful write (DB is source of truth)
      const refreshed = await loadCouponAchievements();
      const finalData = refreshed?.data ?? nextData;
      setRedeemedCoupons(finalData.redeemedCouponIds);
      setAchievementData(finalData);
      prevUnlockedRef.current = finalData.achievementsUnlocked;

      return true;
    } catch (e) {
      console.error("Error redeeming coupon:", e);
      setRedeemError("The magic had a hiccup, try again!");
      return false;
    } finally {
      setProcessingCouponId(null);
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
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-6">
        {/* Editorial hero */}
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Eyebrow no="Nº 02">The Rewards</Eyebrow>
            <DisplayHeading className="mt-4">
              Little <em>promises</em>, <strong>wrapped</strong> as coupons
              <span className="dot-accent">.</span>
            </DisplayHeading>
            <p className="text-lg text-muted-foreground max-w-[52ch] mt-6">
              Every stamp you collect unlocks one. Each coupon is a promise I'll keep —
              so jangan malu-malu, redeem them whenever you like.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <EditorialFigure
              src="/images/gallery/coupon.jpg"
              alt="A little promise, wrapped"
              dotGrid="br"
              aspectClassName="aspect-square"
              annotate={
                <>
                  One stamp,
                  <br />
                  one promise —
                  <br />
                  no expiry, ever.
                </>
              }
              caption="Made especially for you"
            />
          </motion.div>
        </div>

        {redeemError && (
          <motion.div
            className="max-w-md mx-auto mb-8 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {redeemError}
          </motion.div>
        )}

        {/* Achievement Badges Section */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="max-w-[38ch] mb-10">
            <Eyebrow>Milestones</Eyebrow>
            <DisplayHeading as="h2" className="mt-4">
              Badges you earn <em>along the way</em>.
            </DisplayHeading>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

        <div className="max-w-[42ch] mb-10">
          <Eyebrow>The Coupons</Eyebrow>
          <DisplayHeading as="h2" className="mt-4">
            Promises <em>yours to spend</em>.
          </DisplayHeading>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {coupons.map((coupon, index) => {
            const isRedeemed = redeemedCoupons.includes(coupon.id);
            const isUnlocked = isCouponUnlocked(coupon);
            const isLocked = !isUnlocked && !isRedeemed;
            const isProcessing = processingCouponId === coupon.id;

            return (
              <motion.div
                key={coupon.id}
                className="h-full"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <EditorialCouponCard
                  coupon={coupon}
                  isRedeemed={isRedeemed}
                  isLocked={isLocked}
                  isProcessing={isProcessing}
                  completedStamps={completedStamps}
                  onCardClick={() => !isLocked && !isProcessing && handleCouponClick(coupon)}
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
          isProcessing={selectedCoupon ? processingCouponId === selectedCoupon.id : false}
        />

        <p className="font-mono text-[13px] text-center text-muted-foreground mt-10">
          ✿ Coupons never expire — use them whenever you like. 💕
        </p>

        {/* Closing CTA strip */}
        <motion.div
          className="text-center max-w-[620px] mx-auto mt-24 pt-16 border-t border-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <DisplayHeading as="h2">
            The day's <em>yours</em>. Go collect it<span className="dot-accent">.</span>
          </DisplayHeading>
          <p className="text-lg text-muted-foreground mt-4 mb-8">
            Every stamp you press unlocks one more little promise.
          </p>
          <a
            href="/stamps"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary px-5 py-3 font-medium text-primary-foreground transition-all hover:brightness-95"
          >
            <Sparkles className="w-4 h-4" /> Back to your stamps
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default GiftCouponsSection;