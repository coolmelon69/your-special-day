// IndexedDB storage for admin data (custom stamps, coupons, settings)

import type { CustomStamp, CustomCoupon, AdminSettings } from "@/types/admin";
import { syncCustomStamps, deleteCustomStampFromSupabase, syncCustomCoupons, deleteCustomCouponFromSupabase } from "./supabaseSync";
import { getCurrentUser } from "./auth";

const DB_NAME = "admin-data-db";
const DB_VERSION = 1;
const STORES = {
  STAMPS: "customStamps",
  COUPONS: "customCoupons",
  SETTINGS: "adminSettings",
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
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORES.SETTINGS], "readonly");
    const store = transaction.objectStore(STORES.SETTINGS);
    
    return new Promise<AdminSettings>((resolve, reject) => {
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
          };
          resolve(mergedSettings);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      request.onerror = () => reject(new Error("Failed to get admin settings"));
    });
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
      
      getRequest.onsuccess = () => {
        const currentSettings = getRequest.result;
        const baseSettings = currentSettings || DEFAULT_SETTINGS;
        
        // Ensure all fields are present
        const mergedCurrentSettings: AdminSettings = {
          ...DEFAULT_SETTINGS,
          ...baseSettings,
          disabledDefaultStamps: baseSettings.disabledDefaultStamps || [],
          disabledDefaultCoupons: baseSettings.disabledDefaultCoupons || [],
        };
        
        const updatedSettings: AdminSettings = {
          ...mergedCurrentSettings,
          ...settings,
          lastModified: Date.now(),
        };

        const putRequest = store.put({ id: "settings", ...updatedSettings });
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error("Failed to update admin settings"));
      };
      
      getRequest.onerror = () => reject(new Error("Failed to get current admin settings"));
    });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    throw error;
  }
};
