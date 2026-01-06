import { supabase, isSupabaseAvailable } from "./supabaseClient";
import { getCurrentUser } from "./auth";
import type { ItineraryItem } from "@/components/TimelineSection";
import type { CustomStamp, CustomCoupon, AdminSettings } from "@/types/admin";

export interface AchievementData {
  redeemedCouponIds: number[];
  achievementsUnlocked: string[];
  achievementTimestamps: Record<string, number>;
}

// Stamps Progress Sync Functions

/**
 * Sync a single stamp immediately to Supabase
 * This is called directly when a stamp is marked as done (similar to coupon redemption)
 * @param stampItem - The stamp item to sync
 */
export const syncSingleStamp = async (
  stampItem: ItineraryItem
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync stamp");
    return false;
  }

  try {
    const now = new Date().toISOString();
    // If stamp is being checked and doesn't have a checked_at timestamp yet, set it to now
    // Otherwise preserve existing timestamp or set to null if unchecked
    const checkedAt = stampItem.isPast 
      ? (stampItem.checkedAt || now) // Preserve existing timestamp or set to now if newly checked
      : null; // Set to null when unchecked
    
    const stampRecord = {
      user_id: user.id,
      stamp_key: `${stampItem.time}-${stampItem.title}`,
      is_active: stampItem.isActive,
      is_past: stampItem.isPast,
      checked_at: checkedAt,
      image_url: stampItem.imageUrl || null, // Include image URL from Supabase Storage
      updated_at: now,
    };

    console.log(`Syncing single stamp: ${stampRecord.stamp_key}, is_past=${stampRecord.is_past}, checked_at=${stampRecord.checked_at}`);

    // Use upsert to insert or update the record
    const { data, error } = await supabase
      .from("stamps_progress")
      .upsert([stampRecord], {
        onConflict: "user_id,stamp_key",
      })
      .select();

    if (error) {
      console.error("Error syncing single stamp:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log(`Stamp synced successfully: ${stampRecord.stamp_key}, is_past=${data?.[0]?.is_past}`);
    return true;
  } catch (error) {
    console.error("Error in syncSingleStamp:", error);
    return false;
  }
};

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
    const now = new Date().toISOString();
    // Convert itineraryState to individual stamp records
    const stampRecords = itineraryState.map((item) => ({
      user_id: user.id,
      stamp_key: `${item.time}-${item.title}`,
      is_active: item.isActive,
      is_past: item.isPast,
      checked_at: item.isPast ? (item.checkedAt || now) : null, // Preserve existing checked_at or set to now if newly checked
      image_url: item.imageUrl || null, // Include image URL from Supabase Storage
      updated_at: now,
    }));

    // Log what we're syncing
    const checkedStamps = stampRecords.filter(r => r.is_past);
    console.log(`Syncing ${stampRecords.length} stamps (${checkedStamps.length} checked):`, 
      checkedStamps.map(r => `${r.stamp_key} (is_past=${r.is_past})`));

    // Remove duplicates based on stamp_key to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time" error
    const uniqueStampRecords = Array.from(
      new Map(stampRecords.map((record) => [record.stamp_key, record])).values()
    );

    console.log(`After deduplication: ${uniqueStampRecords.length} unique stamps to sync`);

    // Use upsert to insert or update records
    const { data, error } = await supabase
      .from("stamps_progress")
      .upsert(uniqueStampRecords, {
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

    const syncedChecked = data?.filter(r => r.is_past).length || 0;
    console.log(`Stamps synced successfully: ${data?.length || 0} records (${syncedChecked} checked)`);
    
    // Verify the data was saved correctly
    if (data && data.length > 0) {
      const sampleRecord = data[0];
      console.log(`Sample synced record: ${sampleRecord.stamp_key}, is_past=${sampleRecord.is_past}, is_active=${sampleRecord.is_active}`);
    }

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
    // Add timestamp to query to prevent browser caching and ensure fresh data
    const timestamp = Date.now();
    const { data, error } = await supabase
      .from("stamps_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      // Force fresh data by adding a timestamp parameter (Supabase ignores unknown params but browser won't cache)
      .limit(1000); // Explicit limit to ensure we get all records

    if (error) {
      console.error("Error loading stamps progress:", error);
      return baseItinerary;
    }

    if (!data || data.length === 0) {
      console.log("No stamps found in Supabase for user, using base itinerary");
      return baseItinerary;
    }

    console.log(`Loaded ${data.length} stamp records from Supabase:`, data.map(r => ({ key: r.stamp_key, isPast: r.is_past, isActive: r.is_active })));

    // Create a map of stamp_key -> stamp data from Supabase
    const supabaseStampsMap = new Map(
      data.map((record) => [
        record.stamp_key,
        {
          isActive: record.is_active,
          isPast: record.is_past,
          checkedAt: record.checked_at || null, // Include checked_at timestamp from database
          imageUrl: record.image_url || null, // Include image URL from Supabase Storage
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
        console.log(`Merging stamp ${stampKey}: isPast=${supabaseData.isPast}, isActive=${supabaseData.isActive}, checkedAt=${supabaseData.checkedAt}, imageUrl=${supabaseData.imageUrl}`);
        return {
          ...item,
          isActive: supabaseData.isActive,
          isPast: supabaseData.isPast,
          checkedAt: supabaseData.checkedAt || null, // Include checked_at from database
          imageUrl: supabaseData.imageUrl || null, // Include image URL from database
        };
      }

      return item;
    });

    const completedCount = mergedItinerary.filter(item => item.isPast).length;
    console.log(`Merged itinerary: ${completedCount} completed stamps out of ${mergedItinerary.length} total`);

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

// Admin Settings Sync Functions

/**
 * Sync admin settings to Supabase
 * @param settings - Admin settings to sync
 */
export const syncAdminSettings = async (
  settings: AdminSettings
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync admin settings");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          user_id: user.id,
          use_custom_stamps: settings.useCustomStamps,
          use_custom_coupons: settings.useCustomCoupons,
          disabled_default_stamps: settings.disabledDefaultStamps,
          disabled_default_coupons: settings.disabledDefaultCoupons,
          last_modified: new Date(settings.lastModified).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select();

    if (error) {
      if (error.code === "PGRST205") {
        // Table doesn't exist - admin_settings table hasn't been created yet
        console.warn("admin_settings table doesn't exist yet. Settings will be stored locally only. Please create the table in Supabase for cross-device sync.");
        return false;
      }
      console.error("Error syncing admin settings:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log("Admin settings synced successfully");
    return true;
  } catch (error) {
    console.error("Error in syncAdminSettings:", error);
    return false;
  }
};

/**
 * Load admin settings from Supabase
 */
export const loadAdminSettings = async (): Promise<AdminSettings | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to load admin settings");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user hasn't synced yet
        return null;
      }
      if (error.code === "PGRST205") {
        // Table doesn't exist - admin_settings table hasn't been created yet
        console.warn("admin_settings table doesn't exist yet. Please create it in Supabase.");
        return null;
      }
      console.error("Error loading admin settings:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      useCustomStamps: data.use_custom_stamps ?? true,
      useCustomCoupons: data.use_custom_coupons ?? true,
      disabledDefaultStamps: data.disabled_default_stamps || [],
      disabledDefaultCoupons: data.disabled_default_coupons || [],
      lastModified: new Date(data.last_modified).getTime(),
    };
  } catch (error) {
    console.error("Error in loadAdminSettings:", error);
    return null;
  }
};

// Global Admin Settings Sync Functions
// These settings apply to ALL visitors, not per-user

/**
 * Sync global admin settings to Supabase
 * These settings control visibility of default stamps/coupons for all users
 * @param disabledDefaultStamps - Array of default stamp titles to hide
 * @param disabledDefaultCoupons - Array of default coupon IDs to hide
 */
export const syncGlobalAdminSettings = async (
  disabledDefaultStamps: string[],
  disabledDefaultCoupons: number[]
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  // Get current user (admin must be authenticated)
  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync global admin settings");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("global_admin_settings")
      .upsert(
        {
          id: "global",
          disabled_default_stamps: disabledDefaultStamps,
          disabled_default_coupons: disabledDefaultCoupons,
          last_modified: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      )
      .select();

    if (error) {
      if (error.code === "PGRST205") {
        // Table doesn't exist - global_admin_settings table hasn't been created yet
        console.warn("global_admin_settings table doesn't exist yet. Settings will be stored locally only. Please run CREATE_GLOBAL_ADMIN_SETTINGS.sql in Supabase.");
        return false;
      }
      console.error("Error syncing global admin settings:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log("Global admin settings synced successfully");
    return true;
  } catch (error) {
    console.error("Error in syncGlobalAdminSettings:", error);
    return false;
  }
};

/**
 * Load global admin settings from Supabase
 * This function does NOT require authentication - anyone can read global settings
 * Returns null if table doesn't exist or on error
 */
export const loadGlobalAdminSettings = async (): Promise<{
  disabledDefaultStamps: string[];
  disabledDefaultCoupons: number[];
  lastModified: number;
} | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("global_admin_settings")
      .select("*")
      .eq("id", "global")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - settings haven't been set yet
        return null;
      }
      if (error.code === "PGRST205") {
        // Table doesn't exist - global_admin_settings table hasn't been created yet
        console.warn("global_admin_settings table doesn't exist yet. Please run CREATE_GLOBAL_ADMIN_SETTINGS.sql in Supabase.");
        return null;
      }
      console.error("Error loading global admin settings:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      disabledDefaultStamps: data.disabled_default_stamps || [],
      disabledDefaultCoupons: data.disabled_default_coupons || [],
      lastModified: new Date(data.last_modified).getTime(),
    };
  } catch (error) {
    console.error("Error in loadGlobalAdminSettings:", error);
    return null;
  }
};

// Real-time Subscription Functions

/**
 * Subscribe to real-time changes in stamps_progress table for a specific user
 * @param userId - The user ID to listen for changes
 * @param callback - Callback function that will be called when changes are detected
 *                  The component should reload stamps progress using loadStampsProgress
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToStampsProgress = (
  userId: string,
  callback: () => void
): (() => void) => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase not available for realtime subscriptions");
    return () => {};
  }

  // Subscribe to changes in stamps_progress table for this user
  const channel = supabase
    .channel(`stamps-progress:${userId}`, {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      "postgres_changes",
      {
        event: "*", // Listen to INSERT, UPDATE, DELETE
        schema: "public",
        table: "stamps_progress",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("Realtime stamps_progress change detected:", payload.eventType);
        // Trigger callback - component will handle reloading with its base itinerary
        callback();
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log("Subscribed to stamps_progress realtime changes");
      } else if (status === "CHANNEL_ERROR") {
        console.error("Error subscribing to stamps_progress realtime changes", err);
      } else if (status === "TIMED_OUT") {
        console.warn("Realtime subscription timed out - retrying...");
        // Subscription will be re-established on next user change
      } else if (status === "CLOSED") {
        console.log("Realtime subscription closed");
      }
    });

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribing from stamps_progress realtime changes");
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to real-time changes in coupon_achievements table for a specific user
 * @param userId - The user ID to listen for changes
 * @param callback - Callback function that receives the updated achievement data
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToCouponAchievements = (
  userId: string,
  callback: (updatedData: AchievementData) => void
): (() => void) => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase not available for realtime subscriptions");
    return () => {};
  }

  // Subscribe to changes in coupon_achievements table for this user
  const channel = supabase
    .channel(`coupon-achievements:${userId}`, {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      "postgres_changes",
      {
        event: "*", // Listen to INSERT, UPDATE, DELETE
        schema: "public",
        table: "coupon_achievements",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log("Realtime coupon_achievements change detected:", payload.eventType);
        
        try {
          // Load the updated achievement data from Supabase
          const result = await loadCouponAchievements();
          if (result) {
            callback(result.data);
          }
        } catch (error) {
          console.error("Error handling realtime coupon achievements update:", error);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log("Subscribed to coupon_achievements realtime changes");
      } else if (status === "CHANNEL_ERROR") {
        console.error("Error subscribing to coupon_achievements realtime changes", err);
      } else if (status === "TIMED_OUT") {
        console.warn("Realtime subscription timed out - retrying...");
      } else if (status === "CLOSED") {
        console.log("Realtime subscription closed");
      }
    });

  // Return unsubscribe function
  return () => {
    console.log("Unsubscribing from coupon_achievements realtime changes");
    supabase.removeChannel(channel);
  };
};





