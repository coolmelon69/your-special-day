import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { initialItinerary, type ItineraryItem, type Photo } from "@/components/TimelineSection";
import * as photoStorage from "@/utils/photoStorage";
import { getAllCustomStamps, getAllCustomCoupons, getAdminSettings, saveCustomStampsToIndexedDB, saveCustomCouponsToIndexedDB } from "@/utils/adminStorage";
import type { CustomStamp, CustomCoupon } from "@/types/admin";
import { syncStampsProgress, loadStampsProgress, loadCustomStampsResult, loadCustomCouponsResult, loadCheckpointPhotosResult, subscribeToStampsProgress, deleteCheckpointPhoto } from "@/utils/supabaseSync";
import { getCurrentUser, onAuthStateChange } from "@/utils/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { deletePhotoFromStorage } from "@/utils/photoUpload";

// localStorage key for saving progress
const STORAGE_KEY = "birthday-adventure-progress";

// Utility functions for localStorage operations
const loadItineraryFromStorage = (): ItineraryItem[] | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }
    
    const parsed = JSON.parse(saved) as ItineraryItem[];
    
    // Validate the loaded data structure
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }
    
    // Validate each item has required fields
    const isValid = parsed.every(item => 
      typeof item === "object" &&
      typeof item.time === "string" &&
      typeof item.title === "string" &&
      typeof item.description === "string" &&
      typeof item.sprite === "string" &&
      typeof item.isActive === "boolean" &&
      typeof item.isPast === "boolean"
    );
    
    if (!isValid) {
      console.warn("Invalid itinerary data in localStorage, resetting to initial state");
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error("Error loading itinerary from localStorage:", error);
    return null;
  }
};

const saveItineraryToStorage = (itinerary: ItineraryItem[]): void => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
  } catch (error) {
    console.error("Error saving itinerary to localStorage:", error);
    // Handle quota exceeded error gracefully
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded, progress not saved");
    }
  }
};

interface AdventureContextType {
  itineraryState: ItineraryItem[];
  setItineraryState: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  resetProgress: () => void;
  photos: Photo[];
  addPhoto: (checkpointId: string, photoData: Omit<Photo, "id" | "timestamp">) => Promise<void>;
  upsertPhoto: (photo: Photo) => Promise<void>;
  getPhotosByCheckpoint: (checkpointId: string) => Promise<Photo[]>;
  getAllPhotos: () => Promise<Photo[]>;
  deletePhoto: (photoId: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;
  coupons: Array<{ id: number | string; title: string; description: string; emoji: string; color: string; requiredStamps: number; category?: string }>;
  refreshCoupons: () => Promise<void>;
  reloadStampsFromCloud: () => Promise<void>;
  reloadPhotosFromCloud: () => Promise<void>;
  user: SupabaseUser | null;
}

const AdventureContext = createContext<AdventureContextType | undefined>(undefined);

type CouponType = {
  id: number | string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  requiredStamps: number;
  category?: string;
};

export const AdventureProvider = ({ children }: { children: ReactNode }) => {
  // Always start with fresh initial itinerary - don't load from localStorage initially
  // We'll load from Supabase first, then use localStorage only as a fallback if user is not authenticated
  const [itineraryState, setItineraryState] = useState<ItineraryItem[]>(initialItinerary);
  
  // Photos state
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // Coupons state - initialize with defaults
  const [coupons, setCoupons] = useState<CouponType[]>(() => [
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
  ]);

  // User auth state
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Track if initial load from Supabase has completed to prevent infinite loops
  const hasLoadedFromSupabase = useRef(false);
  // Track the initial state to detect if changes are from user actions vs initial load
  const initialItineraryStateRef = useRef<ItineraryItem[]>(initialItinerary);

  // Initialize user auth state and listen for changes
  useEffect(() => {
    // Get initial user
    getCurrentUser().then(setUser);

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser((previousUser) => {
        const previousUserId = previousUser?.id ?? null;
        const nextUserId = authUser?.id ?? null;
        const userChanged = previousUserId !== nextUserId;

        // Reset the load flag when user changes
        hasLoadedFromSupabase.current = false;

        // Safety reset: ensure no per-user data bleeds across accounts
        if (userChanged) {
          // Clear per-user caches (fire-and-forget)
          saveCustomStampsToIndexedDB([]).catch((err) =>
            console.warn("Failed to clear custom stamps cache on user change:", err)
          );
          saveCustomCouponsToIndexedDB([]).catch((err) =>
            console.warn("Failed to clear custom coupons cache on user change:", err)
          );
          photoStorage.clearAllPhotos().catch((err) =>
            console.warn("Failed to clear photos cache on user change:", err)
          );

          // Reset in-memory state immediately (prevents old user UI flash)
          setPhotos([]);
          setCoupons([]);
          setItineraryState(initialItinerary);
          initialItineraryStateRef.current = [...initialItinerary];
        }
        
        // If user logged out, reset to defaults (fresh initial itinerary)
        if (previousUser && !authUser) {
          console.log("User logged out - resetting to defaults");
          setItineraryState(initialItinerary);
          // Coupons will be refreshed automatically via the useEffect that depends on user
        }
        
        return authUser;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load custom stamps, merge with defaults, then sync from Supabase
  // Only run once when user becomes available, not on every user change
  useEffect(() => {
    // Skip if already loaded or no user
    if (hasLoadedFromSupabase.current || !user) {
      console.log("Load effect skipped - hasLoaded:", hasLoadedFromSupabase.current, "user:", !!user);
      return;
    }

    console.log("Load effect running - loading from Supabase");

    const loadCustomStamps = async () => {
      try {
        // Load settings to get disabled default stamps and optional stamp order
        let disabledTitles: string[] = [];
        let stampOrder: string[] = [];
        try {
          const settings = await getAdminSettings();
          disabledTitles = settings.disabledDefaultStamps || [];
          stampOrder = settings.stampOrder ?? [];
        } catch (settingsError) {
          console.warn("Could not load admin settings, using defaults:", settingsError);
          // Continue with empty disabled list
        }
        
        // Filter out disabled default stamps
        // When user is authenticated, use initialItinerary (fresh defaults) as base
        // Supabase data will override these values. Only use localStorage as fallback when not authenticated.
        const baseItinerary = initialItinerary.filter(
          (stamp) => !disabledTitles.includes(stamp.title)
        );
        
        // If all default stamps are disabled, that's fine - we'll show only custom stamps (if any)
        // Don't fall back to showing all stamps - respect the admin's decision
        if (baseItinerary.length === 0) {
          console.log("All default stamps are disabled by admin settings");
        }
        
        // Load custom stamps ONLY if user is authenticated
        // When logged out, show only default stamps
        let customStamps: any[] = [];
        if (user) {
          try {
            if (!hasLoadedFromSupabase.current) {
              // Load from Supabase and sync to IndexedDB (even if empty to clear stale cache)
              const stampsResult = await loadCustomStampsResult();
              if (stampsResult.ok) {
                await saveCustomStampsToIndexedDB(stampsResult.data);
                customStamps = stampsResult.data;
              } else {
                // Supabase error/unavailable -> fallback to IndexedDB
                customStamps = await getAllCustomStamps();
              }
            } else {
              // Load from IndexedDB
              customStamps = await getAllCustomStamps();
            }
          } catch (customError) {
            console.warn("Could not load custom stamps:", customError);
            // Try to load from IndexedDB as fallback
            try {
              customStamps = await getAllCustomStamps();
            } catch (fallbackError) {
              console.warn("Could not load custom stamps from IndexedDB:", fallbackError);
            }
          }
        } else {
          // User not logged in - don't load custom stamps
          console.log("User not logged in - showing default stamps only");
        }
        
        let mergedItinerary: ItineraryItem[];
        const convertedCustomStamps: ItineraryItem[] = customStamps.map((stamp) => ({
          time: stamp.time,
          title: stamp.title,
          description: stamp.description,
          sprite: stamp.sprite,
          isActive: false,
          isPast: stamp.isPast,
          location: stamp.location,
        }));

        if (stampOrder.length > 0) {
          // Build itinerary in admin-defined order (stampOrder: "default:Title" | "custom:id")
          const baseByTitle = new Map(baseItinerary.map((s) => [s.title, s]));
          const convertedById = new Map(customStamps.map((s, i) => [s.id, convertedCustomStamps[i]]));
          const seen = new Set<string>();
          mergedItinerary = [];
          for (const key of stampOrder) {
            if (key.startsWith("default:")) {
              const title = key.slice(8);
              const stamp = baseByTitle.get(title);
              if (stamp) {
                mergedItinerary.push(stamp);
                seen.add(key);
              }
            } else if (key.startsWith("custom:")) {
              const id = key.slice(7);
              const stamp = convertedById.get(id);
              if (stamp) {
                mergedItinerary.push(stamp);
                seen.add(key);
              }
            }
          }
          // Append any stamps not in stampOrder (defaults first, then custom)
          for (const s of baseItinerary) {
            if (!seen.has(`default:${s.title}`)) mergedItinerary.push(s);
          }
          for (let i = 0; i < convertedCustomStamps.length; i++) {
            const id = customStamps[i]?.id;
            if (id != null && !seen.has(`custom:${id}`)) mergedItinerary.push(convertedCustomStamps[i]);
          }
        } else if (convertedCustomStamps.length > 0) {
          // Legacy: defaults first, then custom (no stampOrder)
          const existingStampsMap = new Map<string, ItineraryItem>();
          baseItinerary.forEach((stamp) => {
            existingStampsMap.set(`${stamp.time}-${stamp.title}`, stamp);
          });
          convertedCustomStamps.forEach((stamp) => {
            const key = `${stamp.time}-${stamp.title}`;
            if (!existingStampsMap.has(key)) existingStampsMap.set(key, stamp);
          });
          mergedItinerary = Array.from(existingStampsMap.values());
        } else {
          mergedItinerary = baseItinerary;
        }

        // Load from Supabase and merge (Supabase takes precedence - last-write-wins)
        // Only load if user is authenticated
        if (user) {
          // User is authenticated - load from Supabase
          if (!hasLoadedFromSupabase.current) {
            try {
              console.log("Loading stamps progress from Supabase for user:", user.email);
              const supabaseItinerary = await loadStampsProgress(mergedItinerary);
              console.log("Loaded stamps from Supabase, applying state. Found", supabaseItinerary.length, "stamps");
              
              // Set flag BEFORE setting state to prevent other effects from interfering
              hasLoadedFromSupabase.current = true;
              
              // Update the initial state ref to the loaded state BEFORE setting state
              // This ensures sync effect knows this is the baseline
              initialItineraryStateRef.current = [...supabaseItinerary];
              
              // Use functional update to ensure we're setting the correct state
              setItineraryState(() => {
                console.log("Setting state from Supabase load");
                return supabaseItinerary;
              });
            } catch (error) {
              console.error("Error loading from Supabase, using local data:", error);
              // Only set flag on error too, so we don't retry endlessly
              hasLoadedFromSupabase.current = true;
              initialItineraryStateRef.current = [...mergedItinerary];
              setItineraryState(mergedItinerary);
            }
          } else {
            // Already loaded from Supabase - DO NOT update state
            // This prevents overwriting user changes
            console.log("Already loaded from Supabase - skipping to preserve user changes");
          }
        } else {
          // No user yet - don't set state (keep initial state)
          // When user becomes available, we'll load from Supabase
          console.log("No user yet, keeping initial state");
        }
      } catch (error) {
        console.error("Error loading custom stamps:", error);
        // On error, try to load settings and use fresh defaults (respecting disabled stamps)
        try {
          const settings = await getAdminSettings();
          const disabledTitles = settings.disabledDefaultStamps || [];
          const fallbackItinerary = initialItinerary.filter(
            (stamp) => !disabledTitles.includes(stamp.title)
          );
          setItineraryState(fallbackItinerary.length > 0 ? fallbackItinerary : []);
        } catch (fallbackError) {
          console.error("Error in fallback, using empty array:", fallbackError);
          // Last resort - empty array (respects admin decision to hide all)
          setItineraryState([]);
        }
      }
    };

    loadCustomStamps();
  }, [user]); // Only run when user changes from null to a user (initial load)

  // Debounce timer for Supabase sync
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Realtime subscription cleanup ref
  const unsubscribeStampsRef = useRef<(() => void) | null>(null);

  // Subscribe to realtime stamps progress changes
  useEffect(() => {
    if (!user) {
      // Unsubscribe if user logs out
      if (unsubscribeStampsRef.current) {
        unsubscribeStampsRef.current();
        unsubscribeStampsRef.current = null;
      }
      return;
    }

    // Subscribe to realtime changes
    console.log("Setting up realtime subscription for stamps progress");
    const unsubscribe = subscribeToStampsProgress(user.id, async () => {
      console.log("Realtime stamps update received, reloading...");
      
      try {
        // Reload stamps similar to how we do in the initial load
        // Load settings to get disabled default stamps
        let disabledTitles: string[] = [];
        try {
          const settings = await getAdminSettings();
          disabledTitles = settings.disabledDefaultStamps || [];
        } catch (settingsError) {
          console.warn("Could not load admin settings:", settingsError);
        }

        // Filter out disabled default stamps
        // Use initialItinerary (fresh defaults) as base - Supabase will override state
        const baseItinerary = initialItinerary.filter(
          (stamp) => !disabledTitles.includes(stamp.title)
        );

        // Load custom stamps
        let customStamps: any[] = [];
        try {
          const stampsResult = await loadCustomStampsResult();
          if (stampsResult.ok) {
            await saveCustomStampsToIndexedDB(stampsResult.data);
            customStamps = stampsResult.data;
          } else {
            customStamps = await getAllCustomStamps();
          }
        } catch (customError) {
          console.warn("Could not load custom stamps:", customError);
          try {
            customStamps = await getAllCustomStamps();
          } catch (fallbackError) {
            console.warn("Could not load custom stamps from IndexedDB:", fallbackError);
          }
        }

        // Merge base itinerary with custom stamps
        let mergedItinerary: ItineraryItem[];
        if (customStamps.length > 0) {
          const convertedCustomStamps: ItineraryItem[] = customStamps.map((stamp) => ({
            time: stamp.time,
            title: stamp.title,
            description: stamp.description,
            sprite: stamp.sprite,
            isActive: false,
            isPast: stamp.isPast,
            location: stamp.location,
          }));
          
          const existingStampsMap = new Map<string, ItineraryItem>();
          baseItinerary.forEach(stamp => {
            const key = `${stamp.time}-${stamp.title}`;
            existingStampsMap.set(key, stamp);
          });
          
          convertedCustomStamps.forEach(stamp => {
            const key = `${stamp.time}-${stamp.title}`;
            if (!existingStampsMap.has(key)) {
              existingStampsMap.set(key, stamp);
            }
          });
          
          mergedItinerary = Array.from(existingStampsMap.values());
        } else {
          mergedItinerary = baseItinerary;
        }

        // Load progress from Supabase (this will merge with base)
        const supabaseItinerary = await loadStampsProgress(mergedItinerary);
        setItineraryState(supabaseItinerary);
        
        // Update localStorage with default portion
        const defaultPortion = supabaseItinerary.slice(0, initialItinerary.length);
        if (defaultPortion.length === initialItinerary.length) {
          saveItineraryToStorage(defaultPortion);
        }
      } catch (error) {
        console.error("Error reloading stamps from realtime update:", error);
      }
    });

    unsubscribeStampsRef.current = unsubscribe;

    // Cleanup on unmount or user change
    return () => {
      if (unsubscribeStampsRef.current) {
        unsubscribeStampsRef.current();
        unsubscribeStampsRef.current = null;
      }
    };
  }, [user]);

  // Save to localStorage and sync to Supabase whenever itineraryState changes
  // Note: Only saves default stamps progress, custom stamps state is managed separately
  useEffect(() => {
    // Only save the default stamps portion (first N items matching initialItinerary length)
    const defaultPortion = itineraryState.slice(0, initialItinerary.length);
    if (defaultPortion.length === initialItinerary.length) {
      // Always save to localStorage (immediate, always succeeds)
      saveItineraryToStorage(defaultPortion);
      
      // Only sync if user is authenticated
      if (!user) {
        return;
      }
      
      // Check if this is a user action (state changed from what we last synced)
      // Compare the checked stamps count, not the full state (more reliable)
      const currentCheckedCount = itineraryState.filter(item => item.isPast).length;
      const lastSyncedCheckedCount = initialItineraryStateRef.current.filter(item => item.isPast).length;
      const isUserAction = currentCheckedCount !== lastSyncedCheckedCount || 
                          JSON.stringify(itineraryState.map(i => ({ time: i.time, title: i.title, isPast: i.isPast, isActive: i.isActive }))) !== 
                          JSON.stringify(initialItineraryStateRef.current.map(i => ({ time: i.time, title: i.title, isPast: i.isPast, isActive: i.isActive })));
      
      console.log(`Sync effect: checkedCount=${currentCheckedCount}, lastSynced=${lastSyncedCheckedCount}, isUserAction=${isUserAction}, hasLoaded=${hasLoadedFromSupabase.current}`);
      
      // Don't sync initial state to Supabase (prevents overwriting with old localStorage data)
      // But DO sync if it's a user action, even if initial load hasn't completed yet
      if (!isUserAction && !hasLoadedFromSupabase.current) {
        console.log("Skipping Supabase sync - this is initial state, waiting for load from Supabase");
        // Update ref to track this as the new initial state (but don't sync)
        initialItineraryStateRef.current = [...itineraryState];
        return;
      }
      
      // Only update ref AFTER we've determined we're going to sync
      // This way, if sync fails, we can retry
      
      // Debounce Supabase sync (500ms delay to avoid too many requests)
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      
      syncTimerRef.current = setTimeout(async () => {
        try {
          // Capture current state at sync time (in case it changes during debounce)
          const stateToSync = [...itineraryState];
          
          // Count how many stamps are checked
          const checkedCount = stateToSync.filter(item => item.isPast).length;
          console.log(`Syncing ${stateToSync.length} stamps to Supabase (${checkedCount} checked) - isUserAction: ${isUserAction}`);
          
          // Sync full itineraryState (including custom stamps) to Supabase
          const success = await syncStampsProgress(stateToSync);
          if (success) {
            console.log("Stamps synced successfully to Supabase");
            // Only update ref AFTER successful sync
            initialItineraryStateRef.current = [...stateToSync];
          } else {
            console.warn("Stamps sync returned false - not updating ref, will retry on next change");
          }
        } catch (error) {
          console.error("Error syncing stamps to Supabase:", error);
          // Non-blocking: continue even if sync fails
          // Don't update ref on error, so we can retry
        }
      }, 500);
    }

    // Cleanup timer on unmount
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [itineraryState, user]);

  // Refresh photos from IndexedDB - memoized to prevent infinite loops
  const refreshPhotos = useCallback(async () => {
    try {
      const allPhotos = await photoStorage.getAllPhotos();
      setPhotos(allPhotos);
    } catch (error) {
      console.error("Error refreshing photos:", error);
    }
  }, []);

  // Load photos on mount
  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  // Add a photo - memoized to prevent infinite loops
  const addPhoto = useCallback(async (checkpointId: string, photoData: Omit<Photo, "id" | "timestamp">) => {
    try {
      const photo: Photo = {
        ...photoData,
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      await photoStorage.addPhoto(photo);
      await refreshPhotos();
    } catch (error) {
      console.error("Error adding photo:", error);
      throw error;
    }
  }, [refreshPhotos]);

  // Upsert a photo (used for cloud merges and for keeping stable IDs across devices)
  const upsertPhoto = useCallback(async (photo: Photo) => {
    try {
      await photoStorage.upsertPhoto(photo);
      await refreshPhotos();
    } catch (error) {
      console.error("Error upserting photo:", error);
      throw error;
    }
  }, [refreshPhotos]);

  // Get photos by checkpoint - memoized to prevent infinite loops
  const getPhotosByCheckpoint = useCallback(async (checkpointId: string): Promise<Photo[]> => {
    try {
      return await photoStorage.getPhotosByCheckpoint(checkpointId);
    } catch (error) {
      console.error("Error getting photos by checkpoint:", error);
      return [];
    }
  }, []);

  // Get all photos - memoized to prevent infinite loops
  const getAllPhotos = useCallback(async (): Promise<Photo[]> => {
    try {
      return await photoStorage.getAllPhotos();
    } catch (error) {
      console.error("Error getting all photos:", error);
      return [];
    }
  }, []);

  // Delete a photo - memoized to prevent infinite loops
  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      // Best-effort: delete cloud metadata + storage object (if logged in)
      const existing = await photoStorage.getPhoto(photoId);
      if (user) {
        try {
          await deleteCheckpointPhoto(photoId);
        } catch (err) {
          console.warn("Failed to delete checkpoint photo from Supabase:", err);
        }
        if (existing?.storageUrl) {
          try {
            await deletePhotoFromStorage(existing.storageUrl);
          } catch (err) {
            console.warn("Failed to delete photo from Storage:", err);
          }
        }
      }

      await photoStorage.deletePhoto(photoId);
      await refreshPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw error;
    }
  }, [refreshPhotos, user]);

  // Load photos from Supabase and merge into IndexedDB (cross-device sync)
  const reloadPhotosFromCloud = useCallback(async () => {
    if (!user) return;
    try {
      const photosResult = await loadCheckpointPhotosResult();
      if (photosResult.ok) {
        // Supabase is authoritative (even empty) -> clear old cache
        await photoStorage.clearAllPhotos();
        await photoStorage.upsertPhotos(photosResult.data);
      }
      await refreshPhotos();
    } catch (error) {
      console.error("Error reloading photos from cloud:", error);
    }
  }, [user, refreshPhotos]);

  // Pull latest photos whenever a user logs in
  useEffect(() => {
    if (!user) return;
    reloadPhotosFromCloud();
  }, [user, reloadPhotosFromCloud]);

  // Refresh coupons - memoized to prevent infinite loops
  // Only load custom coupons if user is authenticated
  const refreshCoupons = useCallback(async () => {
    try {
      let disabledIds: number[] = [];
      let couponOrder: string[] = [];
      try {
        const settings = await getAdminSettings();
        disabledIds = settings.disabledDefaultCoupons || [];
        couponOrder = settings.couponOrder ?? [];
      } catch (settingsError) {
        console.warn("Could not load admin settings for coupons, using defaults:", settingsError);
      }

      const defaultCoupons: CouponType[] = [
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
      ].filter((coupon) => !disabledIds.includes(coupon.id as number));

      let customCoupons: any[] = [];
      if (user) {
        console.log("Loading custom coupons for user:", user.email);
        try {
          const couponsResult = await loadCustomCouponsResult();
          if (couponsResult.ok) {
            await saveCustomCouponsToIndexedDB(couponsResult.data);
            customCoupons = couponsResult.data;
            console.log("Using Supabase coupons:", customCoupons.length);
          } else {
            customCoupons = await getAllCustomCoupons();
            console.log("Supabase unavailable, using IndexedDB coupons:", customCoupons.length);
          }
        } catch (customError) {
          console.warn("Could not load custom coupons from Supabase:", customError);
          try {
            customCoupons = await getAllCustomCoupons();
            console.log("Fallback to IndexedDB coupons:", customCoupons.length);
          } catch (fallbackError) {
            console.warn("Could not load custom coupons from IndexedDB:", fallbackError);
          }
        }
      } else {
        console.log("User not logged in - showing default coupons only");
      }

      const convertedCustomCoupons: CouponType[] = customCoupons.map((coupon) => ({
        id: coupon.id,
        title: coupon.title,
        description: coupon.description,
        emoji: coupon.emoji,
        color: coupon.color,
        requiredStamps: coupon.requiredStamps,
        category: coupon.category,
      }));

      let mergedCoupons: CouponType[];
      if (couponOrder.length > 0) {
        const defaultById = new Map(defaultCoupons.map((c) => [String(c.id), c]));
        const customById = new Map(convertedCustomCoupons.map((c) => [c.id as string, c]));
        const seen = new Set<string>();
        mergedCoupons = [];
        for (const key of couponOrder) {
          if (key.startsWith("default:")) {
            const idStr = key.slice(8);
            const c = defaultById.get(idStr);
            if (c) {
              mergedCoupons.push(c);
              seen.add(key);
            }
          } else if (key.startsWith("custom:")) {
            const id = key.slice(7);
            const c = customById.get(id);
            if (c) {
              mergedCoupons.push(c);
              seen.add(key);
            }
          }
        }
        for (const c of defaultCoupons) {
          if (!seen.has(`default:${c.id}`)) mergedCoupons.push(c);
        }
        for (let i = 0; i < convertedCustomCoupons.length; i++) {
          const id = customCoupons[i]?.id;
          if (id != null && !seen.has(`custom:${id}`)) mergedCoupons.push(convertedCustomCoupons[i]);
        }
      } else {
        mergedCoupons = [...defaultCoupons, ...convertedCustomCoupons];
      }
      setCoupons(mergedCoupons);
    } catch (error) {
      console.error("Error refreshing coupons:", error);
      // Fallback to defaults only
      setCoupons([
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
      ]);
    }
  }, [user]);

  // Load coupons on mount and when user changes
  // Use a ref to prevent multiple simultaneous calls
  const couponsLoadingRef = useRef(false);
  useEffect(() => {
    if (couponsLoadingRef.current) {
      return; // Already loading, skip
    }
    couponsLoadingRef.current = true;
    refreshCoupons().finally(() => {
      couponsLoadingRef.current = false;
    });
  }, [user]); // Only depend on user, not refreshCoupons to avoid multiple calls

  // Reset progress function - memoized to prevent infinite loops
  const resetProgress = useCallback(async () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(STORAGE_KEY);
        }
        
        // Load settings to get disabled default stamps
        let disabledTitles: string[] = [];
        try {
          const settings = await getAdminSettings();
          disabledTitles = settings.disabledDefaultStamps || [];
        } catch (settingsError) {
          console.warn("Could not load admin settings for reset, using defaults:", settingsError);
        }
        
        // Reset defaults and reload custom stamps
        getAllCustomStamps().then(async (customStamps) => {
          // Filter out disabled default stamps
          const resetDefaults = initialItinerary
            .filter((stamp) => !disabledTitles.includes(stamp.title))
            .map((item, index) => ({
              ...item,
              isActive: index === 0,
              isPast: false,
            }));
          
          let resetItinerary: ItineraryItem[];
          if (customStamps.length > 0) {
            const convertedCustomStamps: ItineraryItem[] = customStamps.map((stamp) => ({
              time: stamp.time,
              title: stamp.title,
              description: stamp.description,
              sprite: stamp.sprite,
              isActive: false,
              isPast: false,
              location: stamp.location,
            }));
            resetItinerary = [...resetDefaults, ...convertedCustomStamps];
          } else {
            resetItinerary = resetDefaults;
          }
          
          setItineraryState(resetItinerary);
          
          // Sync reset state to Supabase
          if (user) {
            try {
              await syncStampsProgress(resetItinerary);
            } catch (error) {
              console.error("Error syncing reset to Supabase:", error);
              // Non-blocking
            }
          }
        }).catch(() => {
          // If error loading custom stamps, just reset defaults (filtered by disabled stamps)
          const resetDefaults = initialItinerary
            .filter((stamp) => !disabledTitles.includes(stamp.title))
            .map((item, index) => ({
              ...item,
              isActive: index === 0,
              isPast: false,
            }));
          setItineraryState(resetDefaults);
          
          // Sync reset state to Supabase
          if (user) {
            syncStampsProgress(resetDefaults).catch((error) => {
              console.error("Error syncing reset to Supabase:", error);
            });
          }
        });
        
        // Optionally clear photos too
        photoStorage.clearAllPhotos().then(() => {
          refreshPhotos();
        }).catch(console.error);
      } catch (error) {
        console.error("Error resetting progress:", error);
      }
    }
  }, [refreshPhotos]);

  // Reload stamps from cloud (useful when user logs in)
  const reloadStampsFromCloud = useCallback(async () => {
    if (!user) {
      console.warn("User must be authenticated to reload from cloud");
      return;
    }

    try {
      // Load settings to get disabled default stamps and stamp order
      let disabledTitles: string[] = [];
      let stampOrder: string[] = [];
      try {
        const settings = await getAdminSettings();
        disabledTitles = settings.disabledDefaultStamps || [];
        stampOrder = settings.stampOrder ?? [];
      } catch (settingsError) {
        console.warn("Could not load admin settings, using defaults:", settingsError);
      }

      const baseItinerary = initialItinerary.filter(
        (stamp) => !disabledTitles.includes(stamp.title)
      );

      // Load custom stamps from Supabase (overwrite local when user logs in)
      let customStamps: any[] = [];
      try {
        const stampsResult = await loadCustomStampsResult();
        if (stampsResult.ok) {
          await saveCustomStampsToIndexedDB(stampsResult.data);
          customStamps = stampsResult.data;
        } else {
          customStamps = await getAllCustomStamps();
        }
      } catch (customError) {
        console.warn("Could not load custom stamps from Supabase:", customError);
        try {
          customStamps = await getAllCustomStamps();
        } catch (fallbackError) {
          console.warn("Could not load custom stamps from IndexedDB:", fallbackError);
        }
      }

      const convertedCustomStamps: ItineraryItem[] = customStamps.map((stamp) => ({
        time: stamp.time,
        title: stamp.title,
        description: stamp.description,
        sprite: stamp.sprite,
        isActive: false,
        isPast: stamp.isPast,
        location: stamp.location,
      }));

      let mergedItinerary: ItineraryItem[];
      if (stampOrder.length > 0) {
        const baseByTitle = new Map(baseItinerary.map((s) => [s.title, s]));
        const convertedById = new Map(customStamps.map((s, i) => [s.id, convertedCustomStamps[i]]));
        const seen = new Set<string>();
        mergedItinerary = [];
        for (const key of stampOrder) {
          if (key.startsWith("default:")) {
            const title = key.slice(8);
            const stamp = baseByTitle.get(title);
            if (stamp) {
              mergedItinerary.push(stamp);
              seen.add(key);
            }
          } else if (key.startsWith("custom:")) {
            const id = key.slice(7);
            const stamp = convertedById.get(id);
            if (stamp) {
              mergedItinerary.push(stamp);
              seen.add(key);
            }
          }
        }
        for (const s of baseItinerary) {
          if (!seen.has(`default:${s.title}`)) mergedItinerary.push(s);
        }
        for (let i = 0; i < convertedCustomStamps.length; i++) {
          const id = customStamps[i]?.id;
          if (id != null && !seen.has(`custom:${id}`)) mergedItinerary.push(convertedCustomStamps[i]);
        }
      } else if (convertedCustomStamps.length > 0) {
        mergedItinerary = [...baseItinerary, ...convertedCustomStamps];
      } else {
        mergedItinerary = baseItinerary;
      }

      // Load from Supabase for the current user
      const supabaseItinerary = await loadStampsProgress(mergedItinerary);
      setItineraryState(supabaseItinerary);

      // Update localStorage with the loaded data (overwrite local)
      const defaultPortion = supabaseItinerary.slice(0, initialItinerary.length);
      if (defaultPortion.length === initialItinerary.length) {
        saveItineraryToStorage(defaultPortion);
      }
    } catch (error) {
      console.error("Error reloading stamps from cloud:", error);
    }
  }, [user]);

  return (
    <AdventureContext.Provider
      value={{
        itineraryState,
        setItineraryState,
        resetProgress,
        photos,
        addPhoto,
        upsertPhoto,
        getPhotosByCheckpoint,
        getAllPhotos,
        deletePhoto,
        refreshPhotos,
        coupons,
        refreshCoupons,
        reloadStampsFromCloud,
        reloadPhotosFromCloud,
        user,
      }}
    >
      {children}
    </AdventureContext.Provider>
  );
};

export const useAdventure = () => {
  const context = useContext(AdventureContext);
  if (context === undefined) {
    throw new Error("useAdventure must be used within an AdventureProvider");
  }
  return context;
};

