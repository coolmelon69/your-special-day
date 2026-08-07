import {
  syncCouponAchievements,
  loadCouponAchievements,
  type AchievementData,
} from "@/utils/supabaseSync";

export type RedeemResult =
  | { status: "redeemed"; data: AchievementData }
  | { status: "already"; data: AchievementData }
  | { status: "error" };

/**
 * Maps a coupon's id (number for defaults, string for custom coupons) to the
 * numeric id used in `redeemedCouponIds`. Custom coupons hash into the 10000+
 * range so they never collide with default coupon ids (1-3).
 */
export const convertCouponId = (id: number | string): number => {
  if (typeof id === "number") return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash;
  }
  return 10000 + Math.abs(hash);
};

/**
 * Redeem a coupon against `coupon_achievements` — the single source of truth for
 * redemption. Shared by the ticket modal and the QR scanner so both write the
 * same row instead of drifting apart.
 *
 * Always re-reads the DB first so two devices redeeming at once don't clobber
 * each other's list.
 */
export const redeemCoupon = async (
  couponId: number,
  totalCoupons: number,
  fallbackData?: AchievementData
): Promise<RedeemResult> => {
  try {
    const remote = await loadCouponAchievements();
    const current: AchievementData = remote?.data ??
      fallbackData ?? {
        redeemedCouponIds: [],
        achievementsUnlocked: [],
        achievementTimestamps: {},
      };

    if (current.redeemedCouponIds.includes(couponId)) {
      return { status: "already", data: current };
    }

    const nextRedeemed = [...current.redeemedCouponIds, couponId];
    const now = Date.now();
    const nextUnlocked = [...(current.achievementsUnlocked || [])];
    const nextTimestamps = { ...(current.achievementTimestamps || {}) };

    const unlock = (id: string, threshold: number) => {
      if (nextRedeemed.length >= threshold && !nextUnlocked.includes(id)) {
        nextUnlocked.push(id);
        nextTimestamps[id] = now;
      }
    };

    unlock("adventure-seeker", 1);
    unlock("romantic-explorer", 5);
    if (totalCoupons > 0) unlock("coupon-master", totalCoupons);

    const nextData: AchievementData = {
      redeemedCouponIds: nextRedeemed,
      achievementsUnlocked: nextUnlocked,
      achievementTimestamps: nextTimestamps,
    };

    const ok = await syncCouponAchievements(nextData);
    if (!ok) return { status: "error" };

    // Re-validate from the DB after a successful write.
    const refreshed = await loadCouponAchievements();
    return { status: "redeemed", data: refreshed?.data ?? nextData };
  } catch (e) {
    console.error("Error redeeming coupon:", e);
    return { status: "error" };
  }
};

/** Un-redeem a coupon, as if it had never been used. Leaves achievements as-is. */
export const resetCoupon = async (couponId: number): Promise<RedeemResult> => {
  try {
    const remote = await loadCouponAchievements();
    const current: AchievementData = remote?.data ?? {
      redeemedCouponIds: [],
      achievementsUnlocked: [],
      achievementTimestamps: {},
    };

    if (!current.redeemedCouponIds.includes(couponId)) {
      return { status: "already", data: current };
    }

    const nextData: AchievementData = {
      ...current,
      redeemedCouponIds: current.redeemedCouponIds.filter((id) => id !== couponId),
    };

    const ok = await syncCouponAchievements(nextData);
    if (!ok) return { status: "error" };

    const refreshed = await loadCouponAchievements();
    return { status: "redeemed", data: refreshed?.data ?? nextData };
  } catch (e) {
    console.error("Error resetting coupon:", e);
    return { status: "error" };
  }
};

/** Un-redeem every coupon. Leaves achievements as-is. */
export const resetAllCoupons = async (): Promise<RedeemResult> => {
  try {
    const remote = await loadCouponAchievements();
    const current: AchievementData = remote?.data ?? {
      redeemedCouponIds: [],
      achievementsUnlocked: [],
      achievementTimestamps: {},
    };

    if (current.redeemedCouponIds.length === 0) {
      return { status: "already", data: current };
    }

    const nextData: AchievementData = { ...current, redeemedCouponIds: [] };

    const ok = await syncCouponAchievements(nextData);
    if (!ok) return { status: "error" };

    const refreshed = await loadCouponAchievements();
    return { status: "redeemed", data: refreshed?.data ?? nextData };
  } catch (e) {
    console.error("Error resetting all coupons:", e);
    return { status: "error" };
  }
};
