import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Trophy, Heart, Compass } from "lucide-react";
import type { ItineraryItem } from "./TimelineSection";
import TicketVoucher from "./TicketVoucher";
import VoucherModal, { FINE_PRINT } from "./VoucherModal";
import { DisplayHeading } from "@/components/editorial";
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
    icon: <Compass className="h-[1.375rem] w-[1.375rem]" />,
  },
  {
    id: "romantic-explorer",
    name: "Romantic Explorer",
    description: "Redeemed at least 5 coupons",
    icon: <Heart className="h-[1.375rem] w-[1.375rem]" />,
  },
  {
    id: "coupon-master",
    name: "Coupon Master",
    description: "Redeemed all available coupons!",
    icon: <Trophy className="h-[1.375rem] w-[1.375rem]" />,
  },
];

const ACHIEVEMENT_STORAGE_KEY = "coupon-achievements";

interface AchievementData {
  redeemedCouponIds: number[];
  achievementsUnlocked: string[];
  achievementTimestamps: Record<string, number>;
}

interface AchievementSealProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isNewlyUnlocked: boolean;
  /** Each seal is pressed by hand, so none of them land straight. */
  tilt: number;
}

/** A milestone as a seal pressed into the book's cover — inked when earned,
    blind-embossed while it is still to come. */
const AchievementSeal = ({
  achievement,
  isUnlocked,
  isNewlyUnlocked,
  tilt,
}: AchievementSealProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex max-w-[13rem] items-start gap-3.5">
      <motion.span
        className={cn("ticket-seal shrink-0", !isUnlocked && "ticket-seal--blind")}
        style={{ rotate: tilt }}
        initial={
          isNewlyUnlocked && !reduceMotion
            ? { scale: 2.4, opacity: 0, rotate: tilt - 18 }
            : false
        }
        animate={{ scale: 1, opacity: 1, rotate: tilt }}
        transition={{ type: "spring", stiffness: 620, damping: 24, mass: 0.8 }}
      >
        <span className={cn(isUnlocked && "stamp-ink-texture")}>{achievement.icon}</span>
      </motion.span>

      <div className="pt-1.5">
        <h3
          className={cn(
            "font-mono text-[11px] uppercase leading-tight tracking-[0.14em]",
            isUnlocked ? "text-rose" : "text-muted-foreground"
          )}
        >
          {achievement.name}
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
          {achievement.description}
        </p>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {isUnlocked ? (
            achievement.unlockedAt ? (
              new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            ) : (
              "pressed"
            )
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-2.5 w-2.5" /> not yet
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const SEAL_TILTS = [-7, 4, -3];

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

  // DB-driven celebration: a newly earned milestone gets pressed into the cover.
  useEffect(() => {
    const prev = prevUnlockedRef.current;
    const current = achievementData.achievementsUnlocked || [];
    const newly = current.filter((id) => !prev.includes(id));
    if (newly.length === 0) {
      prevUnlockedRef.current = current;
      return;
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([16, 40, 22]);
    }

    setNewlyUnlockedAchievements(newly);
    const reset = window.setTimeout(() => setNewlyUnlockedAchievements([]), 5000);
    prevUnlockedRef.current = current;
    return () => clearTimeout(reset);
  }, [achievementData.achievementsUnlocked]);

  // Calculate completed stamps
  const completedStamps = itineraryState.filter(item => item.isPast).length;

  // Achievements are persisted and loaded from the DB (single source of truth)

  const handleCouponClick = (coupon: Coupon) => {
    setRedeemError(null);
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

  const issued = coupons.length;
  const spent = coupons.filter((c) => redeemedCoupons.includes(c.id)).length;
  const unspent = issued - spent;
  const selectedSerial = selectedCoupon
    ? coupons.findIndex((c) => c.id === selectedCoupon.id) + 1
    : undefined;

  return (
    <section className="ticketbook bg-background py-14 md:py-20">
      <div className="container px-6">
        {/* ─── the book's cover ─── */}
        <div className="relative mx-auto max-w-[52rem]">
          <motion.div
            className="ticket-stock relative overflow-hidden rounded-3xl border border-[hsl(var(--stock-shade))] px-6 pb-11 pt-10 shadow-[0_2px_2px_hsl(272_30%_30%_/_0.05),0_30px_60px_-40px_hsl(272_44%_28%_/_0.5)] sm:px-10 sm:pb-12 sm:pt-12"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ticket-guilloche absolute inset-x-0 top-0 h-3" aria-hidden="true" />

            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Book of promises
              <span className="mx-2 text-rose">·</span>
              Series one
              <span className="mx-2 text-rose">·</span>
              Issued for you
            </p>

            <DisplayHeading className="mt-5">
              Little <em>promises</em>, printed and <strong>numbered</strong>
              <span className="dot-accent">.</span>
            </DisplayHeading>

            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              Every stamp you collect unlocks one. Each ticket is a promise I'll keep — so
              jangan malu-malu, pull them out whenever you like.
            </p>

            <p className="mt-7 border-t border-dashed border-[hsl(var(--stock-shade))] pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Issued {String(issued).padStart(3, "0")}
              <span className="mx-2.5 text-[hsl(var(--stock-shade))]">/</span>
              <span className="text-rose">Unspent {String(unspent).padStart(3, "0")}</span>
              <span className="mx-2.5 text-[hsl(var(--stock-shade))]">/</span>
              Spent {String(spent).padStart(3, "0")}
              <span className="mx-2.5 text-[hsl(var(--stock-shade))]">/</span>
              Stamps {String(completedStamps).padStart(3, "0")}
            </p>

            {/* the seals pressed into the cover */}
            <div className="mt-9 flex flex-wrap gap-x-10 gap-y-7">
              {ACHIEVEMENTS.map((achievement, i) => (
                <AchievementSeal
                  key={achievement.id}
                  achievement={{
                    ...achievement,
                    unlockedAt: achievementData.achievementTimestamps?.[achievement.id],
                  }}
                  isUnlocked={achievementData.achievementsUnlocked.includes(achievement.id)}
                  isNewlyUnlocked={newlyUnlockedAchievements.includes(achievement.id)}
                  tilt={SEAL_TILTS[i % SEAL_TILTS.length]}
                />
              ))}
            </div>
          </motion.div>

          {/* the cover's perforated bottom edge — the strip tears from here */}
          <div className="relative h-9" aria-hidden="true">
            <span className="ticket-perf ticket-perf--h absolute inset-x-8 top-[1.0625rem] h-[3px]" />
            <span className="ticket-notch -left-[0.5625rem] top-2" />
            <span className="ticket-notch -right-[0.5625rem] top-2" />
          </div>
        </div>

        {/* ─── the strip ─── */}
        <div className="mx-auto mt-4 max-w-[52rem]">
          <header className="flex items-end justify-between gap-6 pb-7">
            <DisplayHeading as="h2">
              Promises <em>yours to spend</em>.
            </DisplayHeading>
            <span className="hidden shrink-0 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
              {String(issued).padStart(3, "0")} tickets
            </span>
          </header>

          <div className="flex flex-col gap-6">
            {coupons.map((coupon, index) => {
              const isRedeemed = redeemedCoupons.includes(coupon.id);
              const isUnlocked = isCouponUnlocked(coupon);
              const isLocked = !isUnlocked && !isRedeemed;
              const isProcessing = processingCouponId === coupon.id;

              return (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 26, rotate: index % 2 ? 0.5 : -0.5 }}
                  whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? 0.35 : -0.35 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <TicketVoucher
                    coupon={coupon}
                    serial={index + 1}
                    isRedeemed={isRedeemed}
                    isLocked={isLocked}
                    isProcessing={isProcessing}
                    completedStamps={completedStamps}
                    onOpen={() => handleCouponClick(coupon)}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* ─── the back of the book ─── */}
          <footer className="mt-14 border-t border-dashed border-[hsl(var(--stock-shade))] pt-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              The small print
            </h2>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-x-10">
              {FINE_PRINT.map((term, i) => (
                <li key={term} className="flex gap-2.5 text-[13px] leading-snug text-muted-foreground">
                  <span className="font-mono text-[10px] leading-[1.5] text-rose">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-rose">
              No expiry, ever — use them whenever you like
            </p>
          </footer>
        </div>

        <VoucherModal
          coupon={selectedCoupon}
          serial={selectedSerial}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRedeem={handleRedeem}
          isRedeemed={selectedCoupon ? redeemedCoupons.includes(selectedCoupon.id) : false}
          isProcessing={selectedCoupon ? processingCouponId === selectedCoupon.id : false}
          error={redeemError}
        />

        {/* ─── close ─── */}
        <motion.div
          className="mx-auto mt-20 max-w-[38rem] text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <DisplayHeading as="h2">
            The day's <em>yours</em>. Go collect it<span className="dot-accent">.</span>
          </DisplayHeading>
          <p className="mb-8 mt-4 text-lg text-muted-foreground">
            Every stamp you press prints one more ticket into the book.
          </p>
          <a
            href="/stamps"
            className="inline-flex items-center justify-center rounded-[10px] border border-primary bg-primary px-5 py-3 font-medium text-primary-foreground transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back to your stamps
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default GiftCouponsSection;