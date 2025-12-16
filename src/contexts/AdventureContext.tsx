import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { initialItinerary, type ItineraryItem, type Photo } from "@/components/TimelineSection";
import * as photoStorage from "@/utils/photoStorage";

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
}

const AdventureContext = createContext<AdventureContextType | undefined>(undefined);

export const AdventureProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or use initial itinerary
  const [itineraryState, setItineraryState] = useState<ItineraryItem[]>(() => {
    return loadItineraryFromStorage() || initialItinerary;
  });
  
  // Photos state
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Load photos on mount
  useEffect(() => {
    refreshPhotos();
  }, []);

  // Save to localStorage whenever itineraryState changes
  useEffect(() => {
    saveItineraryToStorage(itineraryState);
  }, [itineraryState]);

  // Refresh photos from IndexedDB
  const refreshPhotos = async () => {
    try {
      const allPhotos = await photoStorage.getAllPhotos();
      setPhotos(allPhotos);
    } catch (error) {
      console.error("Error refreshing photos:", error);
    }
  };

  // Add a photo
  const addPhoto = async (checkpointId: string, photoData: Omit<Photo, "id" | "timestamp">) => {
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
  };

  // Get photos by checkpoint
  const getPhotosByCheckpoint = async (checkpointId: string): Promise<Photo[]> => {
    try {
      return await photoStorage.getPhotosByCheckpoint(checkpointId);
    } catch (error) {
      console.error("Error getting photos by checkpoint:", error);
      return [];
    }
  };

  // Get all photos
  const getAllPhotos = async (): Promise<Photo[]> => {
    try {
      return await photoStorage.getAllPhotos();
    } catch (error) {
      console.error("Error getting all photos:", error);
      return [];
    }
  };

  // Delete a photo
  const deletePhoto = async (photoId: string) => {
    try {
      await photoStorage.deletePhoto(photoId);
      await refreshPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      throw error;
    }
  };

  // Reset progress function
  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(STORAGE_KEY);
        }
        setItineraryState(initialItinerary);
        // Optionally clear photos too
        photoStorage.clearAllPhotos().then(() => {
          refreshPhotos();
        }).catch(console.error);
      } catch (error) {
        console.error("Error resetting progress:", error);
      }
    }
  };

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

