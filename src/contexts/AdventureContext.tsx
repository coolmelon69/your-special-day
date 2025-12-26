import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { initialItinerary, type ItineraryItem, type Photo } from "@/components/TimelineSection";
import * as photoStorage from "@/utils/photoStorage";
import { getAllCustomStamps, getAllCustomCoupons, getAdminSettings, saveCustomStampsToIndexedDB, saveCustomCouponsToIndexedDB } from "@/utils/adminStorage";
import type { CustomStamp, CustomCoupon } from "@/types/admin";
import { syncStampsProgress, loadStampsProgress, loadCustomStamps as loadCustomStampsFromSupabase, loadCustomCoupons as loadCustomCouponsFromSupabase } from "@/utils/supabaseSync";
import { getCurrentUser, onAuthStateChange } from "@/utils/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
  getPhotosByCheckpoint: (checkpointId: string) => Promise<Photo[]>;
  getAllPhotos: () => Promise<Photo[]>;
  deletePhoto: (photoId: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;
  coupons: Array<{ id: number | string; title: string; description: string; emoji: string; color: string; requiredStamps: number; category?: string }>;
  refreshCoupons: () => Promise<void>;
  reloadStampsFromCloud: () => Promise<void>;
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
  // Initialize state from localStorage or use initial itinerary
  // Ensure we always have a valid initial state
  const [itineraryState, setItineraryState] = useState<ItineraryItem[]>(() => {
    try {
      const saved = loadItineraryFromStorage();
      return saved && saved.length > 0 ? saved : initialItinerary;
    } catch (error) {
      console.error("Error loading initial itinerary:", error);
      return initialItinerary;
    }
  });
  
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

  // Initialize user auth state and listen for changes
  useEffect(() => {
    // Get initial user
    getCurrentUser().then(setUser);

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser((previousUser) => {
        // Reset the load flag when user changes
        hasLoadedFromSupabase.current = false;
        
        // If user logged out, reset to defaults
        if (previousUser && !authUser) {
          console.log("User logged out - resetting to defaults");
          // Reset to default itinerary (no custom stamps)
          const saved = loadItineraryFromStorage();
          const defaultItinerary = saved || initialItinerary;
          setItineraryState(defaultItinerary);
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
  useEffect(() => {
    const loadCustomStamps = async () => {
      try {
        // Load settings to get disabled default stamps
        let disabledTitles: string[] = [];
        try {
          const settings = await getAdminSettings();
          disabledTitles = settings.disabledDefaultStamps || [];
        } catch (settingsError) {
          console.warn("Could not load admin settings, using defaults:", settingsError);
          // Continue with empty disabled list
        }
        
        // Filter out disabled default stamps
        // Only use stamps from saved localStorage that match initialItinerary (to avoid duplicates with custom stamps)
        const saved = loadItineraryFromStorage();
        const initialTitles = new Set(initialItinerary.map(s => s.title));
        const savedDefaultStamps = saved 
          ? saved.filter(stamp => initialTitles.has(stamp.title))
          : null;
        const baseItinerary = (savedDefaultStamps || initialItinerary).filter(
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
              // Load from Supabase and sync to IndexedDB
              const supabaseStamps = await loadCustomStampsFromSupabase();
              if (supabaseStamps.length > 0) {
                // Save to IndexedDB for offline access
                await saveCustomStampsToIndexedDB(supabaseStamps);
                customStamps = supabaseStamps;
              } else {
                // No Supabase stamps, fallback to IndexedDB
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
        if (customStamps.length > 0) {
          // Convert CustomStamp to ItineraryItem
          const convertedCustomStamps: ItineraryItem[] = customStamps.map((stamp) => ({
            time: stamp.time,
            title: stamp.title,
            description: stamp.description,
            sprite: stamp.sprite,
            isActive: false, // Will be set based on base itinerary state
            isPast: stamp.isPast,
            location: stamp.location,
          }));
          
          // Create a map to track existing stamps by time+title to prevent duplicates
          const existingStampsMap = new Map<string, ItineraryItem>();
          baseItinerary.forEach(stamp => {
            const key = `${stamp.time}-${stamp.title}`;
            existingStampsMap.set(key, stamp);
          });
          
          // Add custom stamps, skipping any that already exist
          convertedCustomStamps.forEach(stamp => {
            const key = `${stamp.time}-${stamp.title}`;
            if (!existingStampsMap.has(key)) {
              existingStampsMap.set(key, stamp);
            }
          });
          
          // Convert map back to array, preserving order (defaults first, then custom)
          mergedItinerary = Array.from(existingStampsMap.values());
        } else {
          // No custom stamps, use filtered defaults
          mergedItinerary = baseItinerary;
        }

        // Load from Supabase and merge (Supabase takes precedence - last-write-wins)
        // Only load if user is authenticated
        if (!hasLoadedFromSupabase.current) {
          hasLoadedFromSupabase.current = true;
          if (user) {
            try {
              const supabaseItinerary = await loadStampsProgress(mergedItinerary);
              setItineraryState(supabaseItinerary);
            } catch (error) {
              console.error("Error loading from Supabase, using local data:", error);
              setItineraryState(mergedItinerary);
            }
          } else {
            // No user yet, just use local data
            setItineraryState(mergedItinerary);
          }
        } else {
          setItineraryState(mergedItinerary);
        }
      } catch (error) {
        console.error("Error loading custom stamps:", error);
        // On error, try to load settings again and respect disabled stamps
        try {
          const settings = await getAdminSettings();
          const disabledTitles = settings.disabledDefaultStamps || [];
          const saved = loadItineraryFromStorage();
          const initialTitles = new Set(initialItinerary.map(s => s.title));
          const savedDefaultStamps = saved 
            ? saved.filter(stamp => initialTitles.has(stamp.title))
            : null;
          const fallbackItinerary = (savedDefaultStamps || initialItinerary).filter(
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
  }, [user]);

  // Reload from Supabase when user becomes available or changes
  useEffect(() => {
    if (!user || !hasLoadedFromSupabase.current) {
      return;
    }

    // Reload stamps when user changes (e.g., after login)
    const reloadWithUser = async () => {
      try {
        let disabledTitles: string[] = [];
        try {
          const settings = await getAdminSettings();
          disabledTitles = settings.disabledDefaultStamps || [];
        } catch (settingsError) {
          console.warn("Could not load admin settings:", settingsError);
        }

        const saved = loadItineraryFromStorage();
        // Only use stamps from saved localStorage that match initialItinerary (to avoid duplicates with custom stamps)
        const initialTitles = new Set(initialItinerary.map(s => s.title));
        const savedDefaultStamps = saved 
          ? saved.filter(stamp => initialTitles.has(stamp.title))
          : null;
        const baseItinerary = (savedDefaultStamps || initialItinerary).filter(
          (stamp) => !disabledTitles.includes(stamp.title)
        );

        // Load custom stamps ONLY if user is authenticated
        let customStamps: any[] = [];
        if (user) {
          try {
            const supabaseStamps = await loadCustomStampsFromSupabase();
            if (supabaseStamps.length > 0) {
              // Save to IndexedDB for offline access
              await saveCustomStampsToIndexedDB(supabaseStamps);
              customStamps = supabaseStamps;
            } else {
              // No Supabase stamps, fallback to IndexedDB
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
        } else {
          // User not logged in - don't load custom stamps
          console.log("User not logged in - showing default stamps only");
        }

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
          
          // Create a map to track existing stamps by time+title to prevent duplicates
          const existingStampsMap = new Map<string, ItineraryItem>();
          baseItinerary.forEach(stamp => {
            const key = `${stamp.time}-${stamp.title}`;
            existingStampsMap.set(key, stamp);
          });
          
          // Add custom stamps, skipping any that already exist
          convertedCustomStamps.forEach(stamp => {
            const key = `${stamp.time}-${stamp.title}`;
            if (!existingStampsMap.has(key)) {
              existingStampsMap.set(key, stamp);
            }
          });
          
          // Convert map back to array, preserving order (defaults first, then custom)
          mergedItinerary = Array.from(existingStampsMap.values());
        } else {
          mergedItinerary = baseItinerary;
        }

        // Load from Supabase for the current user
        const supabaseItinerary = await loadStampsProgress(mergedItinerary);
        setItineraryState(supabaseItinerary);
      } catch (error) {
        console.error("Error reloading stamps with user:", error);
      }
    };

    reloadWithUser();
  }, [user]);

  // Debounce timer for Supabase sync
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage and sync to Supabase whenever itineraryState changes
  // Note: Only saves default stamps progress, custom stamps state is managed separately
  useEffect(() => {
    // Only save the default stamps portion (first N items matching initialItinerary length)
    const defaultPortion = itineraryState.slice(0, initialItinerary.length);
    if (defaultPortion.length === initialItinerary.length) {
      // Always save to localStorage (immediate, always succeeds)
      saveItineraryToStorage(defaultPortion);
      
      // Debounce Supabase sync (500ms delay to avoid too many requests)
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      
      syncTimerRef.current = setTimeout(async () => {
        if (!user) {
          // User not authenticated, skip sync
          return;
        }
        try {
          // Sync full itineraryState (including custom stamps) to Supabase
          await syncStampsProgress(itineraryState);
        } catch (error) {
          console.error("Error syncing stamps to Supabase:", error);
          // Non-blocking: continue even if sync fails
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
      await photoStorage.deletePhoto(photoId);
      await refreshPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw error;
    }
  }, [refreshPhotos]);

  // Refresh coupons - memoized to prevent infinite loops
  // Only load custom coupons if user is authenticated
  const refreshCoupons = useCallback(async () => {
    try {
      // Load settings to get disabled default coupons
      let disabledIds: number[] = [];
      try {
        const settings = await getAdminSettings();
        disabledIds = settings.disabledDefaultCoupons || [];
      } catch (settingsError) {
        console.warn("Could not load admin settings for coupons, using defaults:", settingsError);
        // Continue with empty disabled list
      }
      
      // Default coupons (filter out disabled ones)
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

      // Load custom coupons ONLY if user is authenticated
      // When logged out, show only default coupons
      let customCoupons: any[] = [];
      if (user) {
        console.log("Loading custom coupons for user:", user.email);
        try {
          // Try to load from Supabase first, then fallback to IndexedDB
          const supabaseCoupons = await loadCustomCouponsFromSupabase();
          console.log("Loaded custom coupons from Supabase:", supabaseCoupons.length);
          if (supabaseCoupons.length > 0) {
            // Save to IndexedDB for offline access
            await saveCustomCouponsToIndexedDB(supabaseCoupons);
            customCoupons = supabaseCoupons;
            console.log("Using Supabase coupons:", customCoupons.length);
          } else {
            // No Supabase coupons, fallback to IndexedDB
            customCoupons = await getAllCustomCoupons();
            console.log("No Supabase coupons, using IndexedDB:", customCoupons.length);
          }
        } catch (customError) {
          console.warn("Could not load custom coupons from Supabase:", customError);
          // Try to load from IndexedDB as fallback
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

      // Merge: defaults first, then custom coupons
      const mergedCoupons = [...defaultCoupons, ...convertedCustomCoupons];
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
      // Load settings to get disabled default stamps
      let disabledTitles: string[] = [];
      try {
        const settings = await getAdminSettings();
        disabledTitles = settings.disabledDefaultStamps || [];
      } catch (settingsError) {
        console.warn("Could not load admin settings, using defaults:", settingsError);
      }

      // Filter out disabled default stamps
        // Only use stamps from saved localStorage that match initialItinerary (to avoid duplicates with custom stamps)
        const saved = loadItineraryFromStorage();
        const initialTitles = new Set(initialItinerary.map(s => s.title));
        const savedDefaultStamps = saved 
          ? saved.filter(stamp => initialTitles.has(stamp.title))
          : null;
        const baseItinerary = (savedDefaultStamps || initialItinerary).filter(
          (stamp) => !disabledTitles.includes(stamp.title)
        );

      // Load custom stamps from Supabase (overwrite local when user logs in)
      let customStamps: any[] = [];
      try {
        const supabaseStamps = await loadCustomStampsFromSupabase();
        if (supabaseStamps.length > 0) {
          // Save to IndexedDB for offline access
          await saveCustomStampsToIndexedDB(supabaseStamps);
          customStamps = supabaseStamps;
        } else {
          // No Supabase stamps, fallback to IndexedDB
          customStamps = await getAllCustomStamps();
        }
      } catch (customError) {
        console.warn("Could not load custom stamps from Supabase:", customError);
        // Try IndexedDB as fallback
        try {
          customStamps = await getAllCustomStamps();
        } catch (fallbackError) {
          console.warn("Could not load custom stamps from IndexedDB:", fallbackError);
        }
      }

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
        getPhotosByCheckpoint,
        getAllPhotos,
        deletePhoto,
        refreshPhotos,
        coupons,
        refreshCoupons,
        reloadStampsFromCloud,
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

