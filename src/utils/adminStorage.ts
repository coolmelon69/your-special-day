// IndexedDB storage for admin data (custom stamps, coupons, settings)

import type { CustomStamp, CustomCoupon, AdminSettings, CustomWrappedSlide, WrappedTemplateCopy } from "@/types/admin";
import {
  syncCustomStamps,
  deleteCustomStampFromSupabase,
  syncCustomCoupons,
  deleteCustomCouponFromSupabase,
  syncAdminSettings,
  loadAdminSettings,
  syncGlobalAdminSettings,
  loadGlobalAdminSettings,
  syncCustomWrappedSlides,
  deleteCustomWrappedSlideFromSupabase,
  syncWrappedTemplateCopy,
  loadWrappedTemplateCopy,
} from "./supabaseSync";
import { getCurrentUser } from "./auth";
import { WRAPPED_TEMPLATE_DEFAULTS } from "@/components/wrapped/copy";
import { mergeWrappedTemplateCopy } from "./wrappedTemplate";

const DB_NAME = "admin-data-db";
const DB_VERSION = 4;
const STORES = {
  STAMPS: "customStamps",
  COUPONS: "customCoupons",
  SETTINGS: "adminSettings",
  PHOTOS: "cameraPhotos",
  WRAPPED_SLIDES: "customWrappedSlides",
  WRAPPED_TEMPLATE: "wrappedTemplateCopy",
};

let db: IDBDatabase | null = null;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains(STORES.STAMPS)) {
        const stampStore = database.createObjectStore(STORES.STAMPS, { keyPath: "id" });
        stampStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      
      if (!database.objectStoreNames.contains(STORES.COUPONS)) {
        const couponStore = database.createObjectStore(STORES.COUPONS, { keyPath: "id" });
        couponStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: "id" });
      }
      
      if (!database.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = database.createObjectStore(STORES.PHOTOS, { keyPath: "id" });
        photoStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.WRAPPED_SLIDES)) {
        const wrappedSlidesStore = database.createObjectStore(STORES.WRAPPED_SLIDES, { keyPath: "id" });
        wrappedSlidesStore.createIndex("order", "order", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.WRAPPED_TEMPLATE)) {
        database.createObjectStore(STORES.WRAPPED_TEMPLATE, { keyPath: "id" });
      }
    };
  });
};

// Get database instance
const getDB = async (): Promise<IDBDatabase> => {
  if (!db) {
    db = await initDB();
  }
  return db;
};

// ========== Custom Stamps ==========

/**
 * Save custom stamps to IndexedDB (used when loading from Supabase)
 */
export const saveCustomStampsToIndexedDB = async (stamps: CustomStamp[]): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.STAMPS], "readwrite");
    const store = transaction.objectStore(STORES.STAMPS);
    
    // Clear existing stamps
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(new Error("Failed to clear custom stamps"));
    });

    // Add new stamps
    for (const stamp of stamps) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(stamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to save stamp ${stamp.id}`));
      });
    }
  } catch (error) {
    console.error("Error saving custom stamps to IndexedDB:", error);
    throw error;
  }
};

export const getAllCustomStamps = async (): Promise<CustomStamp[]> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.STAMPS], "readonly");
    const store = transaction.objectStore(STORES.STAMPS);
    return new Promise<CustomStamp[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const stamps = request.result.sort((a, b) => a.createdAt - b.createdAt);
        resolve(stamps);
      };
      request.onerror = () => reject(new Error("Failed to get custom stamps"));
    });
  } catch (error) {
    console.error("Error getting custom stamps:", error);
    return [];
  }
};

export const addCustomStamp = async (stamp: Omit<CustomStamp, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.STAMPS], "readwrite");
    const store = transaction.objectStore(STORES.STAMPS);
    
    const newStamp: CustomStamp = {
      ...stamp,
      id: `stamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return new Promise<string>(async (resolve, reject) => {
      const request = store.add(newStamp);
      request.onsuccess = async () => {
        // Sync all stamps to Supabase after successful IndexedDB save
        const user = await getCurrentUser();
        if (user) {
          try {
            // Load all stamps and sync them all to ensure consistency
            const allStamps = await getAllCustomStamps();
            await syncCustomStamps(allStamps);
          } catch (syncError) {
            console.error("Error syncing custom stamps to Supabase:", syncError);
            // Don't fail the operation if sync fails
          }
        }
        resolve(newStamp.id);
      };
      request.onerror = () => reject(new Error("Failed to add custom stamp"));
    });
  } catch (error) {
    console.error("Error adding custom stamp:", error);
    throw error;
  }
};

export const updateCustomStamp = async (stamp: CustomStamp): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.STAMPS], "readwrite");
    const store = transaction.objectStore(STORES.STAMPS);
    
    const updatedStamp: CustomStamp = {
      ...stamp,
      updatedAt: Date.now(),
    };

    return new Promise<void>(async (resolve, reject) => {
      const request = store.put(updatedStamp);
      request.onsuccess = async () => {
        // Sync all stamps to Supabase after successful IndexedDB update
        const user = await getCurrentUser();
        if (user) {
          try {
            // Load all stamps and sync them all to ensure consistency
            const allStamps = await getAllCustomStamps();
            await syncCustomStamps(allStamps);
          } catch (syncError) {
            console.error("Error syncing custom stamps to Supabase:", syncError);
            // Don't fail the operation if sync fails
          }
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to update custom stamp"));
    });
  } catch (error) {
    console.error("Error updating custom stamp:", error);
    throw error;
  }
};

export const deleteCustomStamp = async (stampId: string): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.STAMPS], "readwrite");
    const store = transaction.objectStore(STORES.STAMPS);
    
    return new Promise<void>(async (resolve, reject) => {
      const request = store.delete(stampId);
      request.onsuccess = async () => {
        // Delete from Supabase after successful IndexedDB delete
        const user = await getCurrentUser();
        if (user) {
          try {
            // First delete from Supabase
            await deleteCustomStampFromSupabase(stampId);
            // Then sync all remaining stamps to ensure consistency
            const remainingStamps = await getAllCustomStamps();
            await syncCustomStamps(remainingStamps);
          } catch (syncError) {
            console.error("Error deleting custom stamp from Supabase:", syncError);
            // Don't fail the operation if sync fails
          }
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to delete custom stamp"));
    });
  } catch (error) {
    console.error("Error deleting custom stamp:", error);
    throw error;
  }
};

// ========== Custom Coupons ==========

/**
 * Save custom coupons to IndexedDB (used when loading from Supabase)
 */
export const saveCustomCouponsToIndexedDB = async (coupons: CustomCoupon[]): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.COUPONS], "readwrite");
    const store = transaction.objectStore(STORES.COUPONS);
    
    // Clear existing coupons
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(new Error("Failed to clear custom coupons"));
    });

    // Add new coupons
    for (const coupon of coupons) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(coupon);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to save coupon ${coupon.id}`));
      });
    }
  } catch (error) {
    console.error("Error saving custom coupons to IndexedDB:", error);
    throw error;
  }
};

export const getAllCustomCoupons = async (): Promise<CustomCoupon[]> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.COUPONS], "readonly");
    const store = transaction.objectStore(STORES.COUPONS);
    return new Promise<CustomCoupon[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const coupons = request.result.sort((a, b) => a.createdAt - b.createdAt);
        resolve(coupons);
      };
      request.onerror = () => reject(new Error("Failed to get custom coupons"));
    });
  } catch (error) {
    console.error("Error getting custom coupons:", error);
    return [];
  }
};

export const addCustomCoupon = async (coupon: Omit<CustomCoupon, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.COUPONS], "readwrite");
    const store = transaction.objectStore(STORES.COUPONS);
    
    const newCoupon: CustomCoupon = {
      ...coupon,
      id: `coupon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return new Promise<string>(async (resolve, reject) => {
      const request = store.add(newCoupon);
      request.onsuccess = async () => {
        // Sync all coupons to Supabase after successful IndexedDB save
        const user = await getCurrentUser();
        if (user) {
          try {
            // Load all coupons and sync them all to ensure consistency
            const allCoupons = await getAllCustomCoupons();
            await syncCustomCoupons(allCoupons);
          } catch (syncError) {
            console.error("Error syncing custom coupons to Supabase:", syncError);
            // Don't fail the operation if sync fails
          }
        }
        resolve(newCoupon.id);
      };
      request.onerror = () => reject(new Error("Failed to add custom coupon"));
    });
  } catch (error) {
    console.error("Error adding custom coupon:", error);
    throw error;
  }
};

export const updateCustomCoupon = async (coupon: CustomCoupon): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.COUPONS], "readwrite");
    const store = transaction.objectStore(STORES.COUPONS);
    
    const updatedCoupon: CustomCoupon = {
      ...coupon,
      updatedAt: Date.now(),
    };

    return new Promise<void>(async (resolve, reject) => {
      const request = store.put(updatedCoupon);
      request.onsuccess = async () => {
        // Sync all coupons to Supabase after successful IndexedDB update
        const user = await getCurrentUser();
        if (user) {
          try {
            // Load all coupons and sync them all to ensure consistency
            const allCoupons = await getAllCustomCoupons();
            await syncCustomCoupons(allCoupons);
          } catch (syncError) {
            console.error("Error syncing custom coupons to Supabase:", syncError);
            // Don't fail the operation if sync fails
          }
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to update custom coupon"));
    });
  } catch (error) {
    console.error("Error updating custom coupon:", error);
    throw error;
  }
};

export const deleteCustomCoupon = async (couponId: string): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.COUPONS], "readwrite");
    const store = transaction.objectStore(STORES.COUPONS);
    
    return new Promise<void>(async (resolve, reject) => {
      const request = store.delete(couponId);
      request.onsuccess = async () => {
        // Delete from Supabase after successful IndexedDB delete
        const user = await getCurrentUser();
        if (user) {
          try {
            // First delete from Supabase
            await deleteCustomCouponFromSupabase(couponId);
            // Then sync all remaining coupons to ensure consistency
            const remainingCoupons = await getAllCustomCoupons();
            await syncCustomCoupons(remainingCoupons);
          } catch (syncError) {
            console.error("Error deleting custom coupon from Supabase:", syncError);
            // Don't fail the operation if sync fails
          }
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to delete custom coupon"));
    });
  } catch (error) {
    console.error("Error deleting custom coupon:", error);
    throw error;
  }
};

// ========== Admin Settings ==========

const DEFAULT_SETTINGS: AdminSettings = {
  useCustomStamps: false,
  useCustomCoupons: false,
  lastModified: Date.now(),
  disabledDefaultStamps: [],
  disabledDefaultCoupons: [],
  stampOrder: [],
  couponOrder: [],
  trainerCardEnabled: true,
  siteLockEnabled: true,
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  try {
    // Load from IndexedDB first (fast, local) - don't wait for Supabase
    const database = await getDB();
    const transaction = database.transaction([STORES.SETTINGS], "readonly");
    const store = transaction.objectStore(STORES.SETTINGS);
    
    const localSettings = await new Promise<AdminSettings>((resolve, reject) => {
      const request = store.get("settings");
      request.onsuccess = () => {
        const settings = request.result;
        if (settings) {
          // Ensure all fields are present, merge with defaults for missing fields
          const mergedSettings: AdminSettings = {
            ...DEFAULT_SETTINGS,
            ...settings,
            disabledDefaultStamps: settings.disabledDefaultStamps || [],
            disabledDefaultCoupons: settings.disabledDefaultCoupons || [],
            stampOrder: settings.stampOrder ?? [],
            couponOrder: settings.couponOrder ?? [],
            trainerCardEnabled: settings.trainerCardEnabled ?? true,
            siteLockEnabled: settings.siteLockEnabled ?? true,
          };
          resolve(mergedSettings);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      request.onerror = () => reject(new Error("Failed to get admin settings"));
    });

    // Load global visibility settings from Supabase (no auth required)
    // This applies to ALL users, not just the current user
    let globalVisibilitySettings: { disabledDefaultStamps: string[]; disabledDefaultCoupons: number[]; trainerCardEnabled: boolean; siteLockEnabled: boolean } | null = null;
    try {
      const globalSettings = await loadGlobalAdminSettings();
      if (globalSettings) {
        globalVisibilitySettings = {
          disabledDefaultStamps: globalSettings.disabledDefaultStamps,
          disabledDefaultCoupons: globalSettings.disabledDefaultCoupons,
          trainerCardEnabled: globalSettings.trainerCardEnabled,
          siteLockEnabled: globalSettings.siteLockEnabled,
        };

        // Update IndexedDB with global settings for faster access next time
        getDB().then((db) => {
          const writeTransaction = db.transaction([STORES.SETTINGS], "readwrite");
          const writeStore = writeTransaction.objectStore(STORES.SETTINGS);
          const updatedLocalSettings: AdminSettings = {
            ...localSettings,
            disabledDefaultStamps: globalSettings.disabledDefaultStamps,
            disabledDefaultCoupons: globalSettings.disabledDefaultCoupons,
            trainerCardEnabled: globalSettings.trainerCardEnabled,
            siteLockEnabled: globalSettings.siteLockEnabled,
            lastModified: Math.max(localSettings.lastModified, globalSettings.lastModified),
          };
          writeStore.put({ id: "settings", ...updatedLocalSettings });
        }).catch((err) => {
          console.warn("Failed to save global settings to IndexedDB:", err);
        });
      }
    } catch (globalError) {
      // Silently fail - use local settings if global load fails
      console.warn("Failed to load global admin settings:", globalError);
    }

    // Merge local settings with global visibility settings
    // Global visibility settings take precedence for disabled stamps/coupons
    const mergedSettings: AdminSettings = {
      ...localSettings,
      disabledDefaultStamps: globalVisibilitySettings?.disabledDefaultStamps ?? localSettings.disabledDefaultStamps,
      disabledDefaultCoupons: globalVisibilitySettings?.disabledDefaultCoupons ?? localSettings.disabledDefaultCoupons,
      trainerCardEnabled: globalVisibilitySettings?.trainerCardEnabled ?? localSettings.trainerCardEnabled,
      siteLockEnabled: globalVisibilitySettings?.siteLockEnabled ?? localSettings.siteLockEnabled,
    };

    // Sync user-specific settings from Supabase in the background (non-blocking)
    // This updates IndexedDB if Supabase has newer data, but doesn't block the UI
    const user = await getCurrentUser();
    if (user) {
      // Don't await - let it run in background
      loadAdminSettings().then((supabaseSettings) => {
        if (supabaseSettings) {
          // Check if Supabase has newer data for user-specific settings
          // Note: visibility settings come from global table, not user table
          if (supabaseSettings.lastModified > localSettings.lastModified) {
            // Save to IndexedDB for next time (but keep global visibility settings)
            getDB().then((db) => {
              const writeTransaction = db.transaction([STORES.SETTINGS], "readwrite");
              const writeStore = writeTransaction.objectStore(STORES.SETTINGS);
              const userSpecificSettings: AdminSettings = {
                ...supabaseSettings,
                // Keep global visibility settings, not user-specific ones
                disabledDefaultStamps: globalVisibilitySettings?.disabledDefaultStamps ?? supabaseSettings.disabledDefaultStamps,
                disabledDefaultCoupons: globalVisibilitySettings?.disabledDefaultCoupons ?? supabaseSettings.disabledDefaultCoupons,
                trainerCardEnabled: globalVisibilitySettings?.trainerCardEnabled ?? mergedSettings.trainerCardEnabled,
                siteLockEnabled: globalVisibilitySettings?.siteLockEnabled ?? mergedSettings.siteLockEnabled,
              };
              writeStore.put({ id: "settings", ...userSpecificSettings });
            }).catch((err) => {
              console.warn("Failed to save synced settings to IndexedDB:", err);
            });
          }
        }
      }).catch((supabaseError) => {
        // Silently fail - we already have local settings
        console.warn("Background sync of admin settings failed:", supabaseError);
      });
    }

    // Return merged settings (local + global visibility)
    return mergedSettings;
  } catch (error) {
    console.error("Error getting admin settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const updateAdminSettings = async (settings: Partial<AdminSettings>): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.SETTINGS], "readwrite");
    const store = transaction.objectStore(STORES.SETTINGS);
    
    // Get current settings within the same transaction
    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get("settings");
      
      getRequest.onsuccess = async () => {
        const currentSettings = getRequest.result;
        const baseSettings = currentSettings || DEFAULT_SETTINGS;
        
        // Ensure all fields are present
        const mergedCurrentSettings: AdminSettings = {
          ...DEFAULT_SETTINGS,
          ...baseSettings,
          disabledDefaultStamps: baseSettings.disabledDefaultStamps || [],
          disabledDefaultCoupons: baseSettings.disabledDefaultCoupons || [],
          stampOrder: baseSettings.stampOrder ?? [],
          couponOrder: baseSettings.couponOrder ?? [],
          trainerCardEnabled: baseSettings.trainerCardEnabled ?? true,
          siteLockEnabled: baseSettings.siteLockEnabled ?? true,
        };
        
        const updatedSettings: AdminSettings = {
          ...mergedCurrentSettings,
          ...settings,
          lastModified: Date.now(),
        };

        const putRequest = store.put({ id: "settings", ...updatedSettings });
        putRequest.onsuccess = async () => {
          // Sync to Supabase after successful IndexedDB save
          const user = await getCurrentUser();
          if (user) {
            try {
              // If visibility settings are being updated, sync to global table
              if (
                settings.disabledDefaultStamps !== undefined ||
                settings.disabledDefaultCoupons !== undefined ||
                settings.trainerCardEnabled !== undefined ||
                settings.siteLockEnabled !== undefined
              ) {
                await syncGlobalAdminSettings(
                  updatedSettings.disabledDefaultStamps,
                  updatedSettings.disabledDefaultCoupons,
                  updatedSettings.trainerCardEnabled,
                  updatedSettings.siteLockEnabled
                );
              }
              
              // Sync user-specific settings (useCustomStamps, useCustomCoupons) to user table
              // Note: We don't sync visibility settings to user table anymore
              await syncAdminSettings({
                useCustomStamps: updatedSettings.useCustomStamps,
                useCustomCoupons: updatedSettings.useCustomCoupons,
                lastModified: updatedSettings.lastModified,
                disabledDefaultStamps: [], // Not synced to user table
                disabledDefaultCoupons: [], // Not synced to user table
                stampOrder: updatedSettings.stampOrder ?? [],
                couponOrder: updatedSettings.couponOrder ?? [],
              });
            } catch (syncError) {
              console.error("Error syncing admin settings to Supabase:", syncError);
              // Don't fail the operation if sync fails
            }
          }
          resolve();
        };
        putRequest.onerror = () => reject(new Error("Failed to update admin settings"));
      };
      
      getRequest.onerror = () => reject(new Error("Failed to get current admin settings"));
    });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    throw error;
  }
};

// ========== Camera Photos ==========

export interface CameraPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  isDeveloped: boolean;
}

export const saveCameraPhoto = async (photoDataUrl: string): Promise<string> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.PHOTOS], "readwrite");
    const store = transaction.objectStore(STORES.PHOTOS);
    
    const newPhoto: CameraPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dataUrl: photoDataUrl,
      timestamp: Date.now(),
      isDeveloped: false,
    };

    return new Promise<string>((resolve, reject) => {
      const request = store.add(newPhoto);
      request.onsuccess = () => resolve(newPhoto.id);
      request.onerror = () => reject(new Error("Failed to add camera photo"));
    });
  } catch (error) {
    console.error("Error saving camera photo:", error);
    throw error;
  }
};

export const getAllCameraPhotos = async (): Promise<CameraPhoto[]> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.PHOTOS], "readonly");
    const store = transaction.objectStore(STORES.PHOTOS);
    return new Promise<CameraPhoto[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const photos = (request.result as CameraPhoto[]).sort((a, b) => b.timestamp - a.timestamp);
        resolve(photos);
      };
      request.onerror = () => reject(new Error("Failed to get camera photos"));
    });
  } catch (error) {
    console.error("Error getting camera photos:", error);
    return [];
  }
};

export const deleteCameraPhoto = async (photoId: string): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.PHOTOS], "readwrite");
    const store = transaction.objectStore(STORES.PHOTOS);
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(photoId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete camera photo"));
    });
  } catch (error) {
    console.error("Error deleting camera photo:", error);
    throw error;
  }
};

/** Stamp a roll frame as developed once it has been promoted into the Memory Book. */
export const markCameraPhotoDeveloped = async (photoId: string): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.PHOTOS], "readwrite");
    const store = transaction.objectStore(STORES.PHOTOS);
    return new Promise<void>((resolve, reject) => {
      const request = store.get(photoId);
      request.onsuccess = () => {
        const photo = request.result as CameraPhoto | undefined;
        if (!photo) return resolve();
        const put = store.put({ ...photo, isDeveloped: true });
        put.onsuccess = () => resolve();
        put.onerror = () => reject(new Error("Failed to mark camera photo developed"));
      };
      request.onerror = () => reject(new Error("Failed to read camera photo"));
    });
  } catch (error) {
    console.error("Error marking camera photo developed:", error);
  }
};

export const getUndevelopedPhotosCount = async (): Promise<number> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.PHOTOS], "readonly");
    const store = transaction.objectStore(STORES.PHOTOS);

    return new Promise<number>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const photos = request.result as CameraPhoto[];
        resolve(photos.filter(p => !p.isDeveloped).length);
      };
      request.onerror = () => reject(new Error("Failed to get photos count"));
    });
  } catch (error) {
    console.error("Error getting photos count:", error);
    return 0;
  }
};

// ========== Custom Wrapped Slides ==========

export const saveCustomWrappedSlidesToIndexedDB = async (slides: CustomWrappedSlide[]): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_SLIDES], "readwrite");
    const store = transaction.objectStore(STORES.WRAPPED_SLIDES);

    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(new Error("Failed to clear custom wrapped slides"));
    });

    for (const slide of slides) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(slide);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to save wrapped slide ${slide.id}`));
      });
    }
  } catch (error) {
    console.error("Error saving custom wrapped slides to IndexedDB:", error);
    throw error;
  }
};

export const getAllCustomWrappedSlides = async (): Promise<CustomWrappedSlide[]> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_SLIDES], "readonly");
    const store = transaction.objectStore(STORES.WRAPPED_SLIDES);
    return new Promise<CustomWrappedSlide[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const slides = request.result.sort((a, b) => a.order - b.order);
        resolve(slides);
      };
      request.onerror = () => reject(new Error("Failed to get custom wrapped slides"));
    });
  } catch (error) {
    console.error("Error getting custom wrapped slides:", error);
    return [];
  }
};

export const addCustomWrappedSlide = async (
  slide: Omit<CustomWrappedSlide, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_SLIDES], "readwrite");
    const store = transaction.objectStore(STORES.WRAPPED_SLIDES);

    const newSlide: CustomWrappedSlide = {
      ...slide,
      id: `wrapped-slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return new Promise<string>(async (resolve, reject) => {
      const request = store.add(newSlide);
      request.onsuccess = async () => {
        const user = await getCurrentUser();
        if (user) {
          try {
            const allSlides = await getAllCustomWrappedSlides();
            await syncCustomWrappedSlides(allSlides);
          } catch (syncError) {
            console.error("Error syncing custom wrapped slides to Supabase:", syncError);
          }
        }
        resolve(newSlide.id);
      };
      request.onerror = () => reject(new Error("Failed to add custom wrapped slide"));
    });
  } catch (error) {
    console.error("Error adding custom wrapped slide:", error);
    throw error;
  }
};

export const updateCustomWrappedSlide = async (slide: CustomWrappedSlide): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_SLIDES], "readwrite");
    const store = transaction.objectStore(STORES.WRAPPED_SLIDES);

    const updatedSlide: CustomWrappedSlide = {
      ...slide,
      updatedAt: Date.now(),
    };

    return new Promise<void>(async (resolve, reject) => {
      const request = store.put(updatedSlide);
      request.onsuccess = async () => {
        const user = await getCurrentUser();
        if (user) {
          try {
            const allSlides = await getAllCustomWrappedSlides();
            await syncCustomWrappedSlides(allSlides);
          } catch (syncError) {
            console.error("Error syncing custom wrapped slides to Supabase:", syncError);
          }
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to update custom wrapped slide"));
    });
  } catch (error) {
    console.error("Error updating custom wrapped slide:", error);
    throw error;
  }
};

export const deleteCustomWrappedSlide = async (slideId: string): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_SLIDES], "readwrite");
    const store = transaction.objectStore(STORES.WRAPPED_SLIDES);

    return new Promise<void>(async (resolve, reject) => {
      const request = store.delete(slideId);
      request.onsuccess = async () => {
        const user = await getCurrentUser();
        if (user) {
          try {
            await deleteCustomWrappedSlideFromSupabase(slideId);
            const remainingSlides = await getAllCustomWrappedSlides();
            await syncCustomWrappedSlides(remainingSlides);
          } catch (syncError) {
            console.error("Error deleting custom wrapped slide from Supabase:", syncError);
          }
        }
        resolve();
      };
      request.onerror = () => reject(new Error("Failed to delete custom wrapped slide"));
    });
  } catch (error) {
    console.error("Error deleting custom wrapped slide:", error);
    throw error;
  }
};

export const reorderCustomWrappedSlides = async (orderedIds: string[]): Promise<void> => {
  try {
    const slides = await getAllCustomWrappedSlides();
    const byId = new Map(slides.map((s) => [s.id, s]));
    const reordered = orderedIds
      .map((id, index) => {
        const slide = byId.get(id);
        return slide ? { ...slide, order: index, updatedAt: Date.now() } : null;
      })
      .filter((s): s is CustomWrappedSlide => s !== null);

    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_SLIDES], "readwrite");
    const store = transaction.objectStore(STORES.WRAPPED_SLIDES);

    for (const slide of reordered) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(slide);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to reorder wrapped slide ${slide.id}`));
      });
    }

    const user = await getCurrentUser();
    if (user) {
      try {
        await syncCustomWrappedSlides(reordered);
      } catch (syncError) {
        console.error("Error syncing reordered wrapped slides to Supabase:", syncError);
      }
    }
  } catch (error) {
    console.error("Error reordering custom wrapped slides:", error);
    throw error;
  }
};

// ========== Wrapped Template Copy ==========

/**
 * Get admin-edited copy for the built-in /wrapped slides, merged over the
 * defaults. Reads IndexedDB first (fast, local), then refreshes from the
 * public Supabase row in the background — same shape as getAdminSettings,
 * but the remote read needs no auth since /wrapped is public.
 */
export const getWrappedTemplateCopy = async (): Promise<WrappedTemplateCopy> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.WRAPPED_TEMPLATE], "readonly");
    const store = transaction.objectStore(STORES.WRAPPED_TEMPLATE);

    const local = await new Promise<WrappedTemplateCopy | null>((resolve, reject) => {
      const request = store.get("template");
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(new Error("Failed to get wrapped template copy"));
    });

    try {
      const remote = await loadWrappedTemplateCopy();
      if (remote && (!local || remote.updatedAt > local.updatedAt)) {
        getDB().then((db) => {
          const writeTransaction = db.transaction([STORES.WRAPPED_TEMPLATE], "readwrite");
          writeTransaction.objectStore(STORES.WRAPPED_TEMPLATE).put({ id: "template", ...remote });
        }).catch((err) => {
          console.warn("Failed to save synced wrapped template copy to IndexedDB:", err);
        });
        return mergeWrappedTemplateCopy(remote);
      }
    } catch (syncError) {
      console.warn("Background sync of wrapped template copy failed:", syncError);
    }

    return mergeWrappedTemplateCopy(local);
  } catch (error) {
    console.error("Error getting wrapped template copy:", error);
    return WRAPPED_TEMPLATE_DEFAULTS;
  }
};

/**
 * Save admin-edited copy for the built-in /wrapped slides. Persists to
 * IndexedDB immediately, then syncs to Supabase (requires an authenticated
 * admin session).
 */
export const updateWrappedTemplateCopy = async (
  copy: Partial<WrappedTemplateCopy>
): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORES.WRAPPED_TEMPLATE], "readwrite");
  const store = transaction.objectStore(STORES.WRAPPED_TEMPLATE);

  const current = await new Promise<WrappedTemplateCopy | null>((resolve, reject) => {
    const request = store.get("template");
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(new Error("Failed to get current wrapped template copy"));
  });

  const merged = mergeWrappedTemplateCopy({ ...current, ...copy });
  const updated: WrappedTemplateCopy = { ...merged, updatedAt: Date.now() };

  await new Promise<void>((resolve, reject) => {
    const request = store.put({ id: "template", ...updated });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to update wrapped template copy"));
  });

  const user = await getCurrentUser();
  if (user) {
    try {
      await syncWrappedTemplateCopy(updated);
    } catch (syncError) {
      console.error("Error syncing wrapped template copy to Supabase:", syncError);
    }
  }
};
