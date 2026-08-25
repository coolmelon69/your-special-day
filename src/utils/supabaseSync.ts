import { supabase, isSupabaseAvailable } from "./supabaseClient";
import { getCurrentUser } from "./auth";
import type { ItineraryItem } from "@/components/TimelineSection";
import type { Photo } from "@/components/TimelineSection";
import type { CustomStamp, CustomCoupon, AdminSettings } from "@/types/admin";
import type { CustomWrappedSlide, WrappedTemplateCopy } from "@/types/admin";
import type { TrainerCardConfig } from "./trainerCard";

export interface AchievementData {
  redeemedCouponIds: number[];
  achievementsUnlocked: string[];
  achievementTimestamps: Record<string, number>;
}

export type LoadResult<T> = { ok: true; data: T } | { ok: false };

// ---------------------------------------------------------------------------
// Couple scope — see docs/superpowers/specs/2026-08-09-couples-pairing-design.md
//
// Every shared table (stamps_progress, checkpoint_photos, coupon_achievements,
// custom_stamps, custom_coupons, custom_wrapped_slides, admin_settings) gains
// a nullable `couple_id`. RLS permits exactly two read/write shapes:
//   - linked:  couple_id = <the couple's id>
//   - solo:    user_id = auth.uid() AND couple_id IS NULL
// The helpers below make every query below match one of those shapes exactly
// — drifting from them doesn't error, it just silently returns nothing.
// Global tables (global_admin_settings, trainer_card_config,
// wrapped_template_copy) and personal paths (profiles, record_drop, buy_sku,
// buy_item) are untouched — they stay keyed by user_id / are singleton rows.
// ---------------------------------------------------------------------------

// The pure half of the scope rule lives in `coupleScope.ts` so its self-check
// can import the real functions rather than a copy — see the note there.
// Re-exported here because every call site in this file already reaches for
// them through this module.
export type { Scope } from "./coupleScope";
export { applyScope, scopeColumns, scopeConflict } from "./coupleScope";

import type { Scope } from "./coupleScope";
import { applyScope, scopeColumns, scopeConflict } from "./coupleScope";

/**
 * Resolve the caller's scope for one shared-table call: couple-wide if their
 * `profiles.couple_id` is set, solo otherwise. Returns null when signed out
 * (or the profile read itself fails), so every caller's existing
 * `if (!user) return ...` early-out keeps working unchanged.
 *
 * Deliberately NOT cached in a module-level variable. A cache that survives
 * across calls would keep serving a freshly-linked user's old solo scope (or
 * a stale scope after logout) until a hard refresh — exactly the
 * "half-migrated" bug the fresh-start requirement in the design doc warns
 * about. Re-resolving costs one extra `profiles` select per call, which is
 * cheap next to that risk: these functions run on user actions and debounced
 * syncs, not in a tight loop. A function that needs scope for several
 * queries resolves it once into a local variable and reuses that local —
 * fine, since a local can't outlive the call and go stale.
 */
export const currentScope = async (): Promise<Scope | null> => {
  if (!isSupabaseAvailable() || !supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error resolving couple scope:", error);
      // ponytail: ambiguous whether this is "no profile row yet" or a
      // transient network error. Treating it as signed-out (null) is safer
      // than guessing solo and reading/writing the wrong rows.
      return null;
    }

    const coupleId = (data as { couple_id?: string | null } | null)?.couple_id ?? null;
    return coupleId ? { coupleId, userId: user.id } : { coupleId: null, userId: user.id };
  } catch (error) {
    console.error("Error resolving couple scope:", error);
    return null;
  }
};

// Checkpoint Photos Sync Functions (Memory Book cross-device sync)

/**
 * Upsert a single checkpoint photo metadata row to Supabase.
 * The file itself should already be uploaded to Supabase Storage; we store the public URL here.
 */
export const syncCheckpointPhoto = async (photo: Photo): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync checkpoint photo");
    return false;
  }

  const storageUrl = photo.storageUrl || photo.src;
  if (!storageUrl) {
    console.warn("No storageUrl/src available to sync checkpoint photo");
    return false;
  }

  try {
    const createdAtIso =
      typeof photo.timestamp === "number" ? new Date(photo.timestamp).toISOString() : new Date().toISOString();

    const record = {
      ...scopeColumns(scope),
      photo_id: photo.id,
      checkpoint_id: photo.checkpointId,
      storage_url: storageUrl,
      caption: photo.caption || null,
      filter: photo.filter || null,
      frame: photo.frame || null,
      stickers: photo.stickers || null,
      created_at: createdAtIso,
    };

    const { error } = await supabase
      .from("checkpoint_photos")
      .upsert([record], { onConflict: scopeConflict(scope, "photo_id") });

    if (error) {
      console.error("Error syncing checkpoint photo:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in syncCheckpointPhoto:", err);
    return false;
  }
};

/**
 * Load all checkpoint photos for the current user from Supabase.
 * Returned items are mapped to the app `Photo` type.
 */
export const loadCheckpointPhotos = async (): Promise<Photo[]> => {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load checkpoint photos");
    return [];
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("checkpoint_photos").select("*"),
      scope
    )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      console.error("Error loading checkpoint photos:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => {
      const storageUrl = row.storage_url as string;
      const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();

      return {
        id: row.photo_id as string,
        checkpointId: row.checkpoint_id as string,
        // For cross-device render, use the remote URL as `src` (MemoryBook can also prefer storageUrl).
        src: storageUrl,
        storageUrl,
        timestamp: createdAt,
        caption: row.caption || undefined,
        filter: row.filter || undefined,
        frame: row.frame || undefined,
        stickers: row.stickers || undefined,
      } satisfies Photo;
    });
  } catch (err) {
    console.error("Error in loadCheckpointPhotos:", err);
    return [];
  }
};

/**
 * Load all checkpoint photos for the current user from Supabase.
 * Distinguishes \"empty\" (ok: true, data: []) vs \"error\" (ok: false).
 */
export const loadCheckpointPhotosResult = async (): Promise<LoadResult<Photo[]>> => {
  if (!isSupabaseAvailable() || !supabase) {
    return { ok: false };
  }

  const scope = await currentScope();
  if (!scope) {
    return { ok: false };
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("checkpoint_photos").select("*"),
      scope
    )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      console.error("Error loading checkpoint photos:", error);
      return { ok: false };
    }

    const photos =
      !data || data.length === 0
        ? []
        : data.map((row: any) => {
            const storageUrl = row.storage_url as string;
            const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();

            return {
              id: row.photo_id as string,
              checkpointId: row.checkpoint_id as string,
              src: storageUrl,
              storageUrl,
              timestamp: createdAt,
              caption: row.caption || undefined,
              filter: row.filter || undefined,
              frame: row.frame || undefined,
              stickers: row.stickers || undefined,
            } satisfies Photo;
          });

    return { ok: true, data: photos };
  } catch (err) {
    console.error("Error in loadCheckpointPhotosResult:", err);
    return { ok: false };
  }
};

/**
 * Delete a checkpoint photo metadata row from Supabase.
 */
export const deleteCheckpointPhoto = async (photoId: string): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to delete checkpoint photo");
    return false;
  }

  try {
    const { error } = await applyScope(
      supabase.from("checkpoint_photos").delete().eq("photo_id", photoId),
      scope
    );

    if (error) {
      console.error("Error deleting checkpoint photo:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in deleteCheckpointPhoto:", err);
    return false;
  }
};

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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
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
      ...scopeColumns(scope),
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
        onConflict: scopeConflict(scope, "stamp_key"),
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync stamps");
    return false;
  }

  try {
    const now = new Date().toISOString();
    // Convert itineraryState to individual stamp records
    const stampRecords = itineraryState.map((item) => ({
      ...scopeColumns(scope),
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
        onConflict: scopeConflict(scope, "stamp_key"),
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load stamps");
    return baseItinerary;
  }

  try {
    // Load stamps from Supabase for this scope
    // Add timestamp to query to prevent browser caching and ensure fresh data
    const timestamp = Date.now();
    const { data, error } = await applyScope(
      supabase.from("stamps_progress").select("*"),
      scope
    )
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

/** Un-collect a single stamp, as if never checked. */
export const resetStamp = async (stampKey: string): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) return false;
  const scope = await currentScope();
  if (!scope) return false;

  try {
    const { error } = await applyScope(
      supabase
        .from("stamps_progress")
        .update({ is_past: false, checked_at: null, image_url: null, updated_at: new Date().toISOString() })
        .eq("stamp_key", stampKey),
      scope
    );

    if (error) {
      console.error("Error resetting stamp:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in resetStamp:", error);
    return false;
  }
};

/** Un-collect every stamp for the current user. */
export const resetAllStamps = async (): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) return false;
  const scope = await currentScope();
  if (!scope) return false;

  try {
    const { error } = await applyScope(
      supabase
        .from("stamps_progress")
        .update({ is_past: false, checked_at: null, image_url: null, updated_at: new Date().toISOString() }),
      scope
    );

    if (error) {
      console.error("Error resetting all stamps:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in resetAllStamps:", error);
    return false;
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync coupon achievements");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("coupon_achievements")
      .upsert(
        {
          ...scopeColumns(scope),
          redeemed_coupon_ids: achievementData.redeemedCouponIds,
          achievements_unlocked: achievementData.achievementsUnlocked,
          achievement_timestamps: achievementData.achievementTimestamps,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: scopeConflict(scope),
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load coupon achievements");
    return null;
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("coupon_achievements").select("*"),
      scope
    ).single();

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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync custom stamps");
    return false;
  }

  try {
    // Convert custom stamps to database format
    const stampRecords = stamps.map((stamp) => ({
      id: stamp.id,
      ...scopeColumns(scope),
      time: stamp.time,
      title: stamp.title,
      description: stamp.description,
      sprite: stamp.sprite,
      is_active: stamp.isActive,
      is_past: stamp.isPast,
      hidden: stamp.hidden ?? false,
      location: stamp.location || null,
      updated_at: new Date(stamp.updatedAt).toISOString(),
    }));

    // Use upsert to insert or update records
    const { data, error } = await supabase
      .from("custom_stamps")
      .upsert(stampRecords, {
        onConflict: scopeConflict(scope, "id"),
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load custom stamps");
    return [];
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("custom_stamps").select("*"),
      scope
    ).order("created_at", { ascending: true });

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
      hidden: record.hidden ?? false,
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
 * Load custom stamps from Supabase.
 * Distinguishes \"empty\" (ok: true, data: []) vs \"error\" (ok: false).
 */
export const loadCustomStampsResult = async (): Promise<LoadResult<CustomStamp[]>> => {
  if (!isSupabaseAvailable() || !supabase) {
    return { ok: false };
  }

  const scope = await currentScope();
  if (!scope) {
    return { ok: false };
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("custom_stamps").select("*"),
      scope
    ).order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading custom stamps:", error);
      return { ok: false };
    }

    const stamps: CustomStamp[] =
      !data || data.length === 0
        ? []
        : data.map((record) => ({
            id: record.id,
            time: record.time,
            title: record.title,
            description: record.description,
            sprite: record.sprite,
            isActive: record.is_active,
            isPast: record.is_past,
            hidden: record.hidden ?? false,
            location: record.location || undefined,
            createdAt: new Date(record.created_at).getTime(),
            updatedAt: new Date(record.updated_at).getTime(),
          }));

    return { ok: true, data: stamps };
  } catch (error) {
    console.error("Error in loadCustomStampsResult:", error);
    return { ok: false };
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to delete custom stamps");
    return false;
  }

  try {
    const { error } = await applyScope(
      supabase.from("custom_stamps").delete().eq("id", stampId),
      scope
    );

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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync custom coupons");
    return false;
  }

  try {
    // Convert custom coupons to database format
    const couponRecords = coupons.map((coupon) => ({
      id: coupon.id,
      ...scopeColumns(scope),
      title: coupon.title,
      description: coupon.description,
      emoji: coupon.emoji,
      color: coupon.color,
      required_stamps: coupon.requiredStamps,
      category: coupon.category || null,
      hidden: coupon.hidden ?? false,
      updated_at: new Date(coupon.updatedAt).toISOString(),
    }));

    // Use upsert to insert or update records
    const { data, error } = await supabase
      .from("custom_coupons")
      .upsert(couponRecords, {
        onConflict: scopeConflict(scope, "id"),
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load custom coupons");
    return [];
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("custom_coupons").select("*"),
      scope
    ).order("created_at", { ascending: true });

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
      hidden: record.hidden ?? false,
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
 * Load custom coupons from Supabase.
 * Distinguishes \"empty\" (ok: true, data: []) vs \"error\" (ok: false).
 */
export const loadCustomCouponsResult = async (): Promise<LoadResult<CustomCoupon[]>> => {
  if (!isSupabaseAvailable() || !supabase) {
    return { ok: false };
  }

  const scope = await currentScope();
  if (!scope) {
    return { ok: false };
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("custom_coupons").select("*"),
      scope
    ).order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading custom coupons:", error);
      return { ok: false };
    }

    const coupons: CustomCoupon[] =
      !data || data.length === 0
        ? []
        : data.map((record) => ({
            id: record.id,
            title: record.title,
            description: record.description,
            emoji: record.emoji,
            color: record.color,
            requiredStamps: record.required_stamps,
            category: record.category || undefined,
            hidden: record.hidden ?? false,
            createdAt: new Date(record.created_at).getTime(),
            updatedAt: new Date(record.updated_at).getTime(),
          }));

    return { ok: true, data: coupons };
  } catch (error) {
    console.error("Error in loadCustomCouponsResult:", error);
    return { ok: false };
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to delete custom coupons");
    return false;
  }

  try {
    const { error } = await applyScope(
      supabase.from("custom_coupons").delete().eq("id", couponId),
      scope
    );

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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync admin settings");
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .upsert(
        {
          ...scopeColumns(scope),
          use_custom_stamps: settings.useCustomStamps,
          use_custom_coupons: settings.useCustomCoupons,
          disabled_default_stamps: settings.disabledDefaultStamps,
          disabled_default_coupons: settings.disabledDefaultCoupons,
          stamp_order: settings.stampOrder ?? [],
          coupon_order: settings.couponOrder ?? [],
          last_modified: new Date(settings.lastModified).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: scopeConflict(scope),
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

  // Get current scope (couple-wide when linked, solo otherwise)
  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load admin settings");
    return null;
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("admin_settings").select("*"),
      scope
    ).single();

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
      stampOrder: (data as { stamp_order?: string[] }).stamp_order ?? [],
      couponOrder: (data as { coupon_order?: string[] }).coupon_order ?? [],
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
  disabledDefaultCoupons: number[],
  trainerCardEnabled = true
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
          trainer_card_enabled: trainerCardEnabled,
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
  trainerCardEnabled: boolean;
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
      // Column may not exist yet (migration not run) — default to enabled.
      trainerCardEnabled: data.trainer_card_enabled ?? true,
      lastModified: new Date(data.last_modified).getTime(),
    };
  } catch (error) {
    console.error("Error in loadGlobalAdminSettings:", error);
    return null;
  }
};

// Wrapped Template Copy Sync Functions (single global row, public read)

/**
 * Sync admin-edited copy for the built-in /wrapped slides. Requires auth
 * (admin session); mirrors syncGlobalAdminSettings.
 */
export const syncWrappedTemplateCopy = async (
  copy: WrappedTemplateCopy
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync wrapped template copy");
    return false;
  }

  try {
    const { error } = await supabase
      .from("wrapped_template_copy")
      .upsert(
        {
          id: "global",
          content: copy,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      )
      .select();

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("wrapped_template_copy table doesn't exist yet. Please run sql/2026-08-06-wrapped-template-copy.sql in Supabase.");
        return false;
      }
      console.error("Error syncing wrapped template copy:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in syncWrappedTemplateCopy:", error);
    return false;
  }
};

/**
 * Load the built-in /wrapped slide copy. No auth required — the /wrapped
 * page itself is public.
 */
export const loadWrappedTemplateCopy = async (): Promise<WrappedTemplateCopy | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("wrapped_template_copy")
      .select("*")
      .eq("id", "global")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      if (error.code === "PGRST205") {
        console.warn("wrapped_template_copy table doesn't exist yet. Please run sql/2026-08-06-wrapped-template-copy.sql in Supabase.");
        return null;
      }
      console.error("Error loading wrapped template copy:", error);
      return null;
    }

    if (!data?.content) {
      return null;
    }

    return data.content as WrappedTemplateCopy;
  } catch (error) {
    console.error("Error in loadWrappedTemplateCopy:", error);
    return null;
  }
};

// Trainer Card Config Sync Functions (single global row, public read)

/**
 * Save the admin-tuned trainer levelling config (XP weights + rank ladder).
 * Requires an authenticated admin session; mirrors syncWrappedTemplateCopy.
 */
export const syncTrainerCardConfig = async (config: TrainerCardConfig): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  const user = await getCurrentUser();
  if (!user) {
    console.warn("User must be authenticated to sync trainer card config");
    return false;
  }

  try {
    const { error } = await supabase
      .from("trainer_card_config")
      .upsert(
        {
          id: "global",
          content: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select();

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("trainer_card_config table doesn't exist yet. Please run sql/2026-08-07-trainer-card-config.sql in Supabase.");
        return false;
      }
      console.error("Error syncing trainer card config:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in syncTrainerCardConfig:", error);
    return false;
  }
};

/**
 * Load the global trainer levelling config. No auth required — every logged-in
 * user levels by the same ladder. Returns null if unset or the table is missing.
 */
export const loadTrainerCardConfig = async (): Promise<TrainerCardConfig | null> => {
  if (!isSupabaseAvailable() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("trainer_card_config")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST205") {
        console.warn("trainer_card_config table doesn't exist yet. Please run sql/2026-08-07-trainer-card-config.sql in Supabase.");
        return null;
      }
      console.error("Error loading trainer card config:", error);
      return null;
    }

    if (!data?.content?.tiers?.length) {
      return null;
    }

    return data.content as TrainerCardConfig;
  } catch (error) {
    console.error("Error in loadTrainerCardConfig:", error);
    return null;
  }
};

// Custom Wrapped Slides Sync Functions

/**
 * Sync custom wrapped slides to Supabase.
 */
export const syncCustomWrappedSlides = async (
  slides: CustomWrappedSlide[]
): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to sync custom wrapped slides");
    return false;
  }

  try {
    const slideRecords = slides.map((slide) => ({
      id: slide.id,
      ...scopeColumns(scope),
      eyebrow: slide.eyebrow,
      icon: slide.icon || null,
      heading: slide.heading,
      emphasis: slide.emphasis || null,
      body: slide.body,
      sort_order: slide.order,
      updated_at: new Date(slide.updatedAt).toISOString(),
    }));

    const { data, error } = await supabase
      .from("custom_wrapped_slides")
      .upsert(slideRecords, {
        onConflict: "id",
      })
      .select();

    if (error) {
      console.error("Error syncing custom wrapped slides:", error);
      return false;
    }

    console.log("Custom wrapped slides synced successfully:", data?.length || 0, "records");
    return true;
  } catch (error) {
    console.error("Error in syncCustomWrappedSlides:", error);
    return false;
  }
};

/**
 * Load custom wrapped slides from Supabase.
 */
export const loadCustomWrappedSlides = async (): Promise<CustomWrappedSlide[]> => {
  if (!isSupabaseAvailable() || !supabase) {
    return [];
  }

  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to load custom wrapped slides");
    return [];
  }

  try {
    const { data, error } = await applyScope(
      supabase.from("custom_wrapped_slides").select("*"),
      scope
    ).order("sort_order", { ascending: true });

    if (error) {
      console.error("Error loading custom wrapped slides:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const slides: CustomWrappedSlide[] = data.map((record) => ({
      id: record.id,
      eyebrow: record.eyebrow,
      icon: record.icon || undefined,
      heading: record.heading,
      emphasis: record.emphasis || undefined,
      body: record.body,
      order: record.sort_order,
      createdAt: new Date(record.created_at).getTime(),
      updatedAt: new Date(record.updated_at).getTime(),
    }));

    return slides;
  } catch (error) {
    console.error("Error in loadCustomWrappedSlides:", error);
    return [];
  }
};

/**
 * Delete a custom wrapped slide from Supabase.
 */
export const deleteCustomWrappedSlideFromSupabase = async (slideId: string): Promise<boolean> => {
  if (!isSupabaseAvailable() || !supabase) {
    return false;
  }

  const scope = await currentScope();
  if (!scope) {
    console.warn("User must be authenticated to delete custom wrapped slides");
    return false;
  }

  try {
    const { error } = await applyScope(
      supabase.from("custom_wrapped_slides").delete().eq("id", slideId),
      scope
    );

    if (error) {
      console.error("Error deleting custom wrapped slide:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteCustomWrappedSlideFromSupabase:", error);
    return false;
  }
};

// Real-time Subscription Functions

/**
 * Subscribe to real-time changes in stamps_progress table for the caller's
 * scope — couple-wide when linked, this user only when solo.
 * @param scope - `{ coupleId, userId }` from `currentScope()`, or the
 *                equivalent already held by the caller (e.g. AdventureContext's
 *                `couple`/`user` state). `coupleId` null means solo.
 * @param callback - Callback function that will be called when changes are detected
 *                  The component should reload stamps progress using loadStampsProgress
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToStampsProgress = (
  scope: { coupleId: string | null; userId: string },
  callback: () => void
): (() => void) => {
  if (!isSupabaseAvailable() || !supabase) {
    console.warn("Supabase not available for realtime subscriptions");
    return () => {};
  }

  // Channel/filter key by couple when linked so both partners' writes (which
  // may carry either partner's user_id) fire this subscription — filtering
  // on user_id alone would silently miss the partner's rows.
  const scopeKey = scope.coupleId ?? scope.userId;
  const filter = scope.coupleId ? `couple_id=eq.${scope.coupleId}` : `user_id=eq.${scope.userId}`;

  // Subscribe to changes in stamps_progress table for this scope
  const channel = supabase
    .channel(`stamps-progress:${scopeKey}`, {
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
        filter,
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

// ponytail: unlike `subscribeToStampsProgress`, this one is still hardcoded
// to `user_id=eq.<id>` and its only caller — `GiftCouponsSection.tsx` — still
// passes plain `user.id`. Making it couple-aware needs that component to pass
// `couple?.id` too, and `GiftCouponsSection.tsx` is out of this slice's file
// scope (only supabaseSync.ts and AdventureContext.tsx's realtime filter are
// in bounds here). `loadCouponAchievements` itself IS scope-aware above, so a
// manual refresh/reload already picks up a linked partner's writes — only the
// *live* push notification is still solo-only until that component is edited.

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





