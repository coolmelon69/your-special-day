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
