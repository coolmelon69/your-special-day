import { supabase, isSupabaseAvailable } from "./supabaseClient";
import { getCurrentUser } from "./auth";
import type { ItineraryItem } from "@/components/TimelineSection";
import type { CustomStamp, CustomCoupon } from "@/types/admin";

export interface AchievementData {
  redeemedCouponIds: number[];
  achievementsUnlocked: string[];
  achievementTimestamps: Record<string, number>;
}

// Stamps Progress Sync Functions

/**
 * Sync stamps progress to Supabase
 * Converts itineraryState array to individual rows in stamps_progress table
 * @param itineraryState - The current itinerary state
 */
export const syncStampsProgress = async (
  itineraryState: ItineraryItem[]
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync stamps");
    return false;
  }

  try {
    // Convert itineraryState to individual stamp records
    const stampRecords = itineraryState.map((item) => ({
      user_id: user.id,
      stamp_key: `${item.time}-${item.title}`,
      is_active: item.isActive,
      is_past: item.isPast,
      updated_at: new Date().toISOString(),
    }));

    // Use upsert to insert or update records
    const { data, error } = await supabase
      .from("stamps_progress")
      .upsert(stampRecords, {
        onConflict: "user_id,stamp_key",
      })
      .select();

    if (error) {
      console.error("Error syncing stamps progress:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log("Stamps synced successfully:", data?.length || 0, "records");

    return true;
  } catch (error) {
    console.error("Error in syncStampsProgress:", error);
    return false;
  }
};

/**
 * Load stamps progress from Supabase and merge with provided itinerary
 * Returns merged itineraryState with Supabase data taking precedence (last-write-wins)
 * @param baseItinerary - The base itinerary to merge with
 */
export const loadStampsProgress = async (
  baseItinerary: ItineraryItem[]
): Promise<ItineraryItem[]> => {
  if (!isSupabaseAvailable() || !supabase) {
    return baseItinerary;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to load stamps");
    return baseItinerary;
  }

  try {
    // Load stamps from Supabase for this user
    const { data, error } = await supabase
      .from("stamps_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading stamps progress:", error);
      return baseItinerary;
    }

    if (!data || data.length === 0) {
      return baseItinerary;
    }

    // Create a map of stamp_key -> stamp data from Supabase
    const supabaseStampsMap = new Map(
      data.map((record) => [
        record.stamp_key,
        {
          isActive: record.is_active,
          isPast: record.is_past,
          updatedAt: new Date(record.updated_at).getTime(),
        },
      ])
    );

    // Merge base itinerary with Supabase data
    // Use Supabase data if it exists (last-write-wins based on updated_at)
    const mergedItinerary = baseItinerary.map((item) => {
      const stampKey = `${item.time}-${item.title}`;
      const supabaseData = supabaseStampsMap.get(stampKey);

      if (supabaseData) {
        return {
          ...item,
          isActive: supabaseData.isActive,
          isPast: supabaseData.isPast,
        };
      }

      return item;
    });

    return mergedItinerary;
  } catch (error) {
    console.error("Error in loadStampsProgress:", error);
    return baseItinerary;
  }
};

// Coupon Achievements Sync Functions

/**
 * Sync coupon achievements to Supabase
 * @param achievementData - The achievement data to sync
 */
export const syncCouponAchievements = async (
  achievementData: AchievementData
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync coupon achievements");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("coupon_achievements")
      .upsert(
        {
          user_id: user.id,
          redeemed_coupon_ids: achievementData.redeemedCouponIds,
          achievements_unlocked: achievementData.achievementsUnlocked,
          achievement_timestamps: achievementData.achievementTimestamps,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select();

    if (error) {
      console.error("Error syncing coupon achievements:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log("Coupon achievements synced successfully:", data);

    return true;
  } catch (error) {
    console.error("Error in syncCouponAchievements:", error);
    return false;
  }
};

/**
 * Load coupon achievements from Supabase
 * Returns AchievementData with updated_at timestamp, or null if not found or error
 */
export const loadCouponAchievements = async (): Promise<{
  data: AchievementData;
  updatedAt: number;
} | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to load coupon achievements");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("coupon_achievements")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user hasn't synced yet
        return null;
      }
      console.error("Error loading coupon achievements:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      data: {
        redeemedCouponIds: data.redeemed_coupon_ids || [],
        achievementsUnlocked: data.achievements_unlocked || [],
        achievementTimestamps: data.achievement_timestamps || {},
      },
      updatedAt: new Date(data.updated_at).getTime(),
    };
  } catch (error) {
    console.error("Error in loadCouponAchievements:", error);
    return null;
  }
};

/**
 * Merge local and remote achievement data
 * Uses last-write-wins strategy based on updated_at timestamp
 */
export const mergeAchievementData = (
  localData: AchievementData | null,
  remoteData: AchievementData | null,
  localTimestamp?: number,
  remoteTimestamp?: number
): AchievementData => {
  // If only one exists, use that
  if (!remoteData && localData) {
    return localData;
  }
  if (!localData && remoteData) {
    return remoteData;
  }
  if (!localData && !remoteData) {
    return {
      redeemedCouponIds: [],
      achievementsUnlocked: [],
      achievementTimestamps: {},
    };
  }

  // Both exist - use remote if timestamp is newer, otherwise use local
  if (remoteTimestamp && localTimestamp) {
    return remoteTimestamp >= localTimestamp ? remoteData! : localData!;
  }

  // If timestamps are not available, prefer remote (assume it's more recent)
  return remoteData!;
};

// Custom Stamps Sync Functions

/**
 * Sync custom stamps to Supabase
 * @param stamps - Array of custom stamps to sync
 */
export const syncCustomStamps = async (
  stamps: CustomStamp[]
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync custom stamps");
    return false;
  }

  try {
    // Convert custom stamps to database format
    const stampRecords = stamps.map((stamp) => ({
      id: stamp.id,
      user_id: user.id,
      time: stamp.time,
      title: stamp.title,
      description: stamp.description,
      sprite: stamp.sprite,
      is_active: stamp.isActive,
      is_past: stamp.isPast,
      location: stamp.location || null,
      updated_at: new Date(stamp.updatedAt).toISOString(),
    }));

    // Use upsert to insert or update records
    const { data, error } = await supabase
      .from("custom_stamps")
      .upsert(stampRecords, {
        onConflict: "user_id,id",
      })
      .select();

    if (error) {
      console.error("Error syncing custom stamps:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log("Custom stamps synced successfully:", data?.length || 0, "records");
    return true;
  } catch (error) {
    console.error("Error in syncCustomStamps:", error);
    return false;
  }
};

/**
 * Load custom stamps from Supabase
 */
export const loadCustomStamps = async (): Promise<CustomStamp[]> => {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to load custom stamps");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("custom_stamps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading custom stamps:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert database format to CustomStamp format
    const stamps: CustomStamp[] = data.map((record) => ({
      id: record.id,
      time: record.time,
      title: record.title,
      description: record.description,
      sprite: record.sprite,
      isActive: record.is_active,
      isPast: record.is_past,
      location: record.location || undefined,
      createdAt: new Date(record.created_at).getTime(),
      updatedAt: new Date(record.updated_at).getTime(),
    }));

    return stamps;
  } catch (error) {
    console.error("Error in loadCustomStamps:", error);
    return [];
  }
};

/**
 * Delete a custom stamp from Supabase
 * @param stampId - The ID of the stamp to delete
 */
export const deleteCustomStampFromSupabase = async (
  stampId: string
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to delete custom stamps");
    return false;
  }

  try {
    const { error } = await supabase
      .from("custom_stamps")
      .delete()
      .eq("id", stampId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting custom stamp from Supabase:", error);
      return false;
    }

    console.log("Custom stamp deleted from Supabase:", stampId);
    return true;
  } catch (error) {
    console.error("Error in deleteCustomStampFromSupabase:", error);
    return false;
  }
};

// Custom Coupons Sync Functions

/**
 * Sync custom coupons to Supabase
 * @param coupons - Array of custom coupons to sync
 */
export const syncCustomCoupons = async (
  coupons: CustomCoupon[]
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync custom coupons");
    return false;
  }

  try {
    // Convert custom coupons to database format
    const couponRecords = coupons.map((coupon) => ({
      id: coupon.id,
      user_id: user.id,
      title: coupon.title,
      description: coupon.description,
      emoji: coupon.emoji,
      color: coupon.color,
      required_stamps: coupon.requiredStamps,
      category: coupon.category || null,
      updated_at: new Date(coupon.updatedAt).toISOString(),
    }));

    // Use upsert to insert or update records
    const { data, error } = await supabase
      .from("custom_coupons")
      .upsert(couponRecords, {
        onConflict: "user_id,id",
      })
      .select();

    if (error) {
      console.error("Error syncing custom coupons:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log("Custom coupons synced successfully:", data?.length || 0, "records");
    return true;
  } catch (error) {
    console.error("Error in syncCustomCoupons:", error);
    return false;
  }
};

/**
 * Load custom coupons from Supabase
 */
export const loadCustomCoupons = async (): Promise<CustomCoupon[]> => {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to load custom coupons");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("custom_coupons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading custom coupons:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert database format to CustomCoupon format
    const coupons: CustomCoupon[] = data.map((record) => ({
      id: record.id,
      title: record.title,
      description: record.description,
      emoji: record.emoji,
      color: record.color,
      requiredStamps: record.required_stamps,
      category: record.category || undefined,
      createdAt: new Date(record.created_at).getTime(),
      updatedAt: new Date(record.updated_at).getTime(),
    }));

    return coupons;
  } catch (error) {
    console.error("Error in loadCustomCoupons:", error);
    return [];
  }
};

/**
 * Delete a custom coupon from Supabase
 * @param couponId - The ID of the coupon to delete
 */
export const deleteCustomCouponFromSupabase = async (
  couponId: string
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to delete custom coupons");
    return false;
  }

  try {
    const { error } = await supabase
      .from("custom_coupons")
      .delete()
      .eq("id", couponId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting custom coupon from Supabase:", error);
      return false;
    }

    console.log("Custom coupon deleted from Supabase:", couponId);
    return true;
  } catch (error) {
    console.error("Error in deleteCustomCouponFromSupabase:", error);
    return false;
  }
};
