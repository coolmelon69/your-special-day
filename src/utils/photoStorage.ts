import type { Photo } from "@/components/TimelineSection";

const DB_NAME = "adventure-photos-db";
const DB_VERSION = 1;
const STORE_NAME = "photos";

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
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("checkpointId", "checkpointId", { unique: false });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
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

// Add a photo
export const addPhoto = async (photo: Photo): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.add(photo);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to add photo"));
    });
  } catch (error) {
    console.error("Error adding photo:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please delete some photos.");
    }
    throw error;
  }
};

// Upsert (insert or replace) a photo by ID
// Use this for cloud sync merges to avoid duplicate key errors.
export const upsertPhoto = async (photo: Photo): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(photo);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to upsert photo"));
    });
  } catch (error) {
    console.error("Error upserting photo:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please delete some photos.");
    }
    throw error;
  }
};

// Upsert multiple photos in a single transaction (best for bulk cloud merges)
export const upsertPhotos = async (photos: Photo[]): Promise<void> => {
  if (photos.length === 0) return;

  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      let completed = 0;
      let failed = false;

      const onDone = () => {
        completed += 1;
        if (!failed && completed >= photos.length) {
          resolve();
        }
      };

      for (const photo of photos) {
        const request = store.put(photo);
        request.onsuccess = () => onDone();
        request.onerror = () => {
          failed = true;
          reject(new Error("Failed to upsert photos"));
        };
      }
    });
  } catch (error) {
    console.error("Error upserting photos:", error);
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please delete some photos.");
    }
    throw error;
  }
};

// Get all photos
export const getAllPhotos = async (): Promise<Photo[]> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    return new Promise<Photo[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const photos = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(photos);
      };
      request.onerror = () => reject(new Error("Failed to get photos"));
    });
  } catch (error) {
    console.error("Error getting photos:", error);
    return [];
  }
};

// Get photos by checkpoint
export const getPhotosByCheckpoint = async (checkpointId: string): Promise<Photo[]> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("checkpointId");
    return new Promise<Photo[]>((resolve, reject) => {
      const request = index.getAll(checkpointId);
      request.onsuccess = () => {
        const photos = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(photos);
      };
      request.onerror = () => reject(new Error("Failed to get photos by checkpoint"));
    });
  } catch (error) {
    console.error("Error getting photos by checkpoint:", error);
    return [];
  }
};

// Get a single photo by ID
export const getPhoto = async (photoId: string): Promise<Photo | null> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    return new Promise<Photo | null>((resolve, reject) => {
      const request = store.get(photoId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error("Failed to get photo"));
    });
  } catch (error) {
    console.error("Error getting photo:", error);
    return null;
  }
};

// Delete a photo
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(photoId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete photo"));
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
};

// Clear all photos
export const clearAllPhotos = async (): Promise<void> => {
  try {
    const database = await getDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear photos"));
    });
  } catch (error) {
    console.error("Error clearing photos:", error);
    throw error;
  }
};

// Get storage usage estimate
export const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch (error) {
      console.error("Error getting storage estimate:", error);
    }
  }
  return null;
};

