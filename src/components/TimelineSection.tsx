import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Camera, Trash2 } from "lucide-react";
import { useAdventure } from "@/contexts/AdventureContext";
import PhotoCaptureModal from "./PhotoCaptureModal";
import PhotoEditor from "./PhotoEditor";
import type { Photo as PhotoType } from "./TimelineSection";
import { sparkleBurst } from "../utils/particles";

// Utility function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Utility function to proactively request location permission
// This should be called when clicking a stamp to trigger the permission prompt
// Works across all browsers including Chrome and iOS Safari
export const requestLocationAccess = (): void => {
  if (!navigator.geolocation) {
    return;
  }
  
  // Use Permissions API if available to check current status
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'prompt') {
        // Permission hasn't been asked yet, trigger the prompt
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          {
            enableHighAccuracy: false,
            timeout: 1000,
            maximumAge: 0,
          }
        );
      }
    }).catch(() => {
      // Permissions API not supported, fall back to direct call
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        {
          enableHighAccuracy: false,
          timeout: 1000,
          maximumAge: 0,
        }
      );
    });
  } else {
    // Permissions API not available, directly request location
    // This will trigger the prompt on first call
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
      {
        enableHighAccuracy: false,
        timeout: 1000,
        maximumAge: 0,
      }
    );
  }
};

// Utility function to check if user is at the correct location
// IMPORTANT: This must be called directly from a user gesture handler (like onClick) 
// to trigger the location permission prompt on all browsers, especially iOS Safari and Chrome
export const checkLocation = (
  targetLocation: { latitude: number; longitude: number; radius: number }
): Promise<{ isAtLocation: boolean; distance?: number; error?: string }> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        isAtLocation: false,
        error: "Geolocation is not supported by your browser. Please enable location services.",
      });
      return;
    }

    // Check if we're on HTTPS or localhost (required for geolocation in Chrome)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      resolve({
        isAtLocation: false,
        error: "Location access requires HTTPS. Please access this site over HTTPS or localhost.",
      });
      return;
    }

    // Use options that work best across all browsers
    // Chrome: prefers enableHighAccuracy: false for initial prompt
    // iOS Safari: needs maximumAge: 0 to trigger prompt
    const options: PositionOptions = {
      enableHighAccuracy: false, // Start with false - Chrome shows prompt faster this way
      timeout: 15000, // Longer timeout for slower connections
      maximumAge: 0, // Always get fresh location - required for iOS Safari to show prompt
    };

    // Call getCurrentPosition immediately - this must be called synchronously from user gesture
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const distance = calculateDistance(
          userLat,
          userLon,
          targetLocation.latitude,
          targetLocation.longitude
        );

        const isAtLocation = distance <= targetLocation.radius;

        resolve({
          isAtLocation,
          distance: Math.round(distance),
        });
      },
      (error) => {
        let errorMessage = "Unable to get your location. ";
        const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/.test(navigator.userAgent);
        const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
        const isMacChrome = /Macintosh/.test(navigator.userAgent) && isChrome;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            if (isMobileSafari) {
              errorMessage += "Please go to Settings > Safari > Location Services and allow location access for this website, then try again.";
            } else if (isMacChrome) {
              errorMessage += "Please click the lock icon (🔒) in the address bar, then click 'Location' and select 'Allow', then try again.";
            } else if (isChrome) {
              errorMessage += "Please click the lock icon in the address bar and allow location access, then try again.";
            } else {
              errorMessage += "Please allow location access in your browser settings to check in.";
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please ensure location services are enabled on your device.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        resolve({
          isAtLocation: false,
          error: errorMessage,
        });
      },
      options
    );
  });
};

// Photo and Sticker types
export type Sticker = {
  id: string;
  type: string; // 'heart', 'star', 'pixel-art-icon', etc.
  x: number; // Position percentage
  y: number;
  scale: number;
};

export type Photo = {
  id: string;
  checkpointId: string; // References checkpoint title/time
  src: string; // Data URL or blob URL
  timestamp: number;
  filter?: string; // Filter preset name
  frame?: string; // Frame preset name
  stickers?: Sticker[]; // Array of sticker overlays
  caption?: string;
};

// Export types for use in other components
export type ItineraryItem = {
  time: string;
  title: string;
  description: string;
  sprite: string;
  isActive: boolean;
  isPast: boolean;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // radius in meters
  };
  photos?: Photo[]; // Photos captured at this checkpoint
};

export const initialItinerary: ItineraryItem[] = [
  {
    time: "9:00 AM",
    title: "Breakfast Quest",
    description: "Wake up to your favorite breakfast with fresh flowers and orange juice",
    sprite: "coffee",
    isActive: true,
    isPast: false,
    location: {
      latitude: 3.1264380531781195,
      longitude: 101.46812048003719,
      radius: 100, // 100 meters radius
    },
  },
  {
    time: "11:00 AM",
    title: "Flower Gathering",
    description: "Pick out the most beautiful bouquet from the local flower market",
    sprite: "flower",
    isActive: false,
    isPast: false,
    location: {
      latitude: 3.1453037807694812,
      longitude: 101.69544687421923,
      radius: 100, // 100 meters radius
    },
  },
  {
    time: "1:00 PM",
    title: "Feast Time",
    description: "Your favorite restaurant with a special birthday menu",
    sprite: "food",
    isActive: false,
    isPast: false,
    location: {
      latitude: 3.1390, // Example: Kuala Lumpur coordinates - update with actual restaurant location
      longitude: 101.6869,
      radius: 100, // 100 meters radius
    },
  },
  {
    time: "3:30 PM",
    title: "Memory Capture",
    description: "Capturing beautiful moments at our favorite spot in the park",
    sprite: "camera",
    isActive: false,
    isPast: false,
    location: {
      latitude: 3.1390, // Example: Kuala Lumpur coordinates - update with actual park location
      longitude: 101.6869,
      radius: 100, // 100 meters radius
    },
  },
  {
    time: "6:00 PM",
    title: "Melody Hour",
    description: "Live music at the rooftop venue with the best views",
    sprite: "music",
    isActive: false,
    isPast: false,
    location: {
      latitude: 3.1390, // Example: Kuala Lumpur coordinates - update with actual venue location
      longitude: 101.6869,
      radius: 100, // 100 meters radius
    },
  },
  {
    time: "9:00 PM",
    title: "Starlight Banquet",
    description: "Elegant candlelit dinner with a stunning city view",
    sprite: "dinner",
    isActive: false,
    isPast: false,
    location: {
      latitude: 3.1390, // Example: Kuala Lumpur coordinates - update with actual restaurant location
      longitude: 101.6869,
      radius: 100, // 100 meters radius
    },
  },
];

// Pixel art sprite components
const PixelCoffee = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Steam */}
    {isActive && (
      <>
        <rect x="5" y="1" width="1" height="1" fill="hsl(var(--muted-foreground))" className="animate-pulse" />
        <rect x="7" y="0" width="1" height="1" fill="hsl(var(--muted-foreground))" className="animate-pulse" />
        <rect x="9" y="1" width="1" height="1" fill="hsl(var(--muted-foreground))" className="animate-pulse" />
      </>
    )}
    {/* Cup */}
    <rect x="3" y="4" width="10" height="8" fill="hsl(var(--primary))" />
    <rect x="4" y="5" width="8" height="6" fill="hsl(45 60% 35%)" />
    {/* Handle */}
    <rect x="13" y="5" width="2" height="1" fill="hsl(var(--primary))" />
    <rect x="14" y="6" width="1" height="3" fill="hsl(var(--primary))" />
    <rect x="13" y="9" width="2" height="1" fill="hsl(var(--primary))" />
    {/* Base */}
    <rect x="2" y="12" width="12" height="2" fill="hsl(var(--primary))" />
  </svg>
);

const PixelFlower = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Petals */}
    <rect x="7" y="1" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="4" y="3" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="10" y="3" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="5" y="6" width="2" height="2" fill="hsl(var(--primary))" />
    <rect x="9" y="6" width="2" height="2" fill="hsl(var(--primary))" />
    {/* Center */}
    <rect x="7" y="4" width="2" height="2" fill="hsl(45 80% 60%)" />
    {/* Stem */}
    <rect x="7" y="8" width="2" height="5" fill="hsl(142 50% 40%)" />
    {/* Leaves */}
    <rect x="5" y="10" width="2" height="1" fill="hsl(142 50% 40%)" />
    <rect x="9" y="11" width="2" height="1" fill="hsl(142 50% 40%)" />
    {/* Pot */}
    <rect x="5" y="13" width="6" height="2" fill="hsl(25 60% 45%)" />
  </svg>
);

const PixelFood = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Plate */}
    <rect x="1" y="11" width="14" height="3" fill="hsl(var(--muted))" />
    <rect x="2" y="10" width="12" height="1" fill="hsl(var(--border))" />
    {/* Fork */}
    <rect x="2" y="2" width="1" height="8" fill="hsl(var(--muted-foreground))" />
    <rect x="1" y="2" width="1" height="3" fill="hsl(var(--muted-foreground))" />
    <rect x="3" y="2" width="1" height="3" fill="hsl(var(--muted-foreground))" />
    {/* Knife */}
    <rect x="12" y="2" width="2" height="8" fill="hsl(var(--muted-foreground))" />
    <rect x="13" y="1" width="1" height="1" fill="hsl(var(--muted-foreground))" />
    {/* Food */}
    <rect x="5" y="6" width="6" height="4" fill="hsl(var(--primary))" />
    <rect x="6" y="5" width="4" height="1" fill="hsl(15 70% 50%)" />
  </svg>
);

const PixelCamera = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Body */}
    <rect x="2" y="5" width="12" height="8" fill="hsl(var(--foreground))" />
    <rect x="3" y="6" width="10" height="6" fill="hsl(var(--muted))" />
    {/* Lens */}
    <rect x="5" y="7" width="6" height="4" fill="hsl(var(--foreground))" />
    <rect x="6" y="8" width="4" height="2" fill="hsl(200 70% 50%)" />
    {/* Flash */}
    <rect x="11" y="6" width="2" height="2" fill="hsl(45 80% 60%)" className={isActive ? "animate-pulse" : ""} />
    {/* Top */}
    <rect x="5" y="3" width="4" height="2" fill="hsl(var(--foreground))" />
    {/* Button */}
    <rect x="12" y="4" width="2" height="1" fill="hsl(var(--primary))" />
  </svg>
);

const PixelMusic = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <img 
    src="/images/gallery/marhsal.png" 
    alt="Marshal Lee"
    className={`w-full h-full object-cover ${isPast ? "opacity-50 grayscale" : ""}`}
    style={{ imageRendering: "pixelated" }}
  />
);

const PixelDinner = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Candle */}
    <rect x="7" y="4" width="2" height="6" fill="hsl(var(--muted))" />
    {/* Flame */}
    <rect x="7" y="2" width="2" height="2" fill="hsl(45 90% 55%)" className={isActive ? "animate-pulse" : ""} />
    <rect x="8" y="1" width="1" height="1" fill="hsl(25 90% 50%)" />
    {/* Plate */}
    <rect x="2" y="10" width="12" height="2" fill="hsl(var(--muted))" />
    <rect x="3" y="12" width="10" height="2" fill="hsl(var(--border))" />
    {/* Wine glass */}
    <rect x="12" y="5" width="2" height="1" fill="hsl(var(--muted-foreground))" />
    <rect x="12" y="6" width="2" height="3" fill="hsl(var(--primary))" />
    <rect x="13" y="9" width="1" height="2" fill="hsl(var(--muted-foreground))" />
    {/* Stars */}
    {isActive && (
      <>
        <rect x="1" y="1" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
        <rect x="14" y="0" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
        <rect x="3" y="2" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
      </>
    )}
  </svg>
);

const PixelGift = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Box */}
    <rect x="3" y="6" width="10" height="8" fill="hsl(var(--primary))" />
    <rect x="4" y="7" width="8" height="6" fill="hsl(0 70% 50%)" />
    {/* Ribbon vertical */}
    <rect x="7" y="6" width="2" height="8" fill="hsl(142 50% 40%)" />
    {/* Ribbon horizontal */}
    <rect x="3" y="9" width="10" height="2" fill="hsl(142 50% 40%)" />
    {/* Bow top */}
    <rect x="6" y="4" width="4" height="2" fill="hsl(142 50% 40%)" />
    <rect x="5" y="5" width="1" height="1" fill="hsl(142 50% 40%)" />
    <rect x="10" y="5" width="1" height="1" fill="hsl(142 50% 40%)" />
    {/* Sparkles */}
    {isActive && (
      <>
        <rect x="2" y="2" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
        <rect x="13" y="1" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
      </>
    )}
  </svg>
);

const PixelCake = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Base layer */}
    <rect x="2" y="11" width="12" height="3" fill="hsl(25 60% 45%)" />
    {/* Middle layer */}
    <rect x="3" y="8" width="10" height="3" fill="hsl(25 60% 50%)" />
    {/* Top layer */}
    <rect x="4" y="5" width="8" height="3" fill="hsl(25 60% 55%)" />
    {/* Frosting */}
    <rect x="3" y="7" width="10" height="1" fill="hsl(0 80% 90%)" />
    <rect x="4" y="4" width="8" height="1" fill="hsl(0 80% 90%)" />
    {/* Candles */}
    <rect x="5" y="2" width="1" height="3" fill="hsl(var(--primary))" />
    <rect x="7" y="1" width="1" height="4" fill="hsl(var(--primary))" />
    <rect x="9" y="2" width="1" height="3" fill="hsl(var(--primary))" />
    {/* Flames */}
    {isActive && (
      <>
        <rect x="5" y="1" width="1" height="1" fill="hsl(45 90% 55%)" className="animate-pulse" />
        <rect x="7" y="0" width="1" height="1" fill="hsl(45 90% 55%)" className="animate-pulse" />
        <rect x="9" y="1" width="1" height="1" fill="hsl(45 90% 55%)" className="animate-pulse" />
      </>
    )}
  </svg>
);

const PixelHeart = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Heart shape */}
    <rect x="4" y="4" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="6" y="3" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="8" y="4" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="5" y="5" width="4" height="2" fill="hsl(0 70% 50%)" />
    <rect x="6" y="6" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="4" y="7" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="8" y="7" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="5" y="9" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="7" y="9" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="6" y="11" width="2" height="2" fill="hsl(0 70% 50%)" />
    {/* Pulse effect */}
    {isActive && (
      <rect x="6" y="6" width="2" height="2" fill="hsl(0 90% 70%)" className="animate-pulse" />
    )}
  </svg>
);

const PixelStar = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Star shape */}
    <rect x="7" y="2" width="2" height="2" fill="hsl(45 80% 60%)" />
    <rect x="5" y="4" width="2" height="2" fill="hsl(45 80% 60%)" />
    <rect x="9" y="4" width="2" height="2" fill="hsl(45 80% 60%)" />
    <rect x="6" y="5" width="4" height="2" fill="hsl(45 80% 60%)" />
    <rect x="7" y="6" width="2" height="2" fill="hsl(45 80% 60%)" />
    <rect x="4" y="7" width="2" height="2" fill="hsl(45 80% 60%)" />
    <rect x="10" y="7" width="2" height="2" fill="hsl(45 80% 60%)" />
    <rect x="6" y="9" width="4" height="2" fill="hsl(45 80% 60%)" />
    <rect x="7" y="11" width="2" height="2" fill="hsl(45 80% 60%)" />
    {/* Twinkle */}
    {isActive && (
      <>
        <rect x="2" y="1" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
        <rect x="13" y="2" width="1" height="1" fill="hsl(45 80% 70%)" className="animate-pulse" />
      </>
    )}
  </svg>
);

const PixelBalloon = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""} ${isActive ? "animate-bounce" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Balloon */}
    <rect x="5" y="2" width="6" height="8" fill="hsl(0 70% 50%)" />
    <rect x="6" y="3" width="4" height="6" fill="hsl(0 80% 60%)" />
    {/* Highlight */}
    <rect x="6" y="3" width="2" height="2" fill="hsl(0 90% 80%)" />
    {/* String */}
    <rect x="7" y="10" width="2" height="4" fill="hsl(var(--muted-foreground))" />
  </svg>
);

const PixelCar = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Body */}
    <rect x="2" y="7" width="12" height="5" fill="hsl(var(--primary))" />
    <rect x="3" y="8" width="10" height="3" fill="hsl(200 60% 50%)" />
    {/* Windows */}
    <rect x="4" y="8" width="3" height="2" fill="hsl(200 70% 70%)" />
    <rect x="9" y="8" width="3" height="2" fill="hsl(200 70% 70%)" />
    {/* Wheels */}
    <rect x="3" y="11" width="3" height="3" fill="hsl(var(--foreground))" />
    <rect x="10" y="11" width="3" height="3" fill="hsl(var(--foreground))" />
    {/* Headlights */}
    <rect x="1" y="8" width="1" height="1" fill="hsl(45 80% 70%)" className={isActive ? "animate-pulse" : ""} />
    <rect x="1" y="10" width="1" height="1" fill="hsl(45 80% 70%)" className={isActive ? "animate-pulse" : ""} />
  </svg>
);

const PixelMap = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Map paper */}
    <rect x="2" y="3" width="12" height="10" fill="hsl(45 30% 90%)" />
    <rect x="2" y="3" width="12" height="10" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
    {/* Roads */}
    <rect x="3" y="6" width="10" height="1" fill="hsl(var(--muted-foreground))" />
    <rect x="7" y="4" width="1" height="6" fill="hsl(var(--muted-foreground))" />
    {/* Location marker */}
    <rect x="6" y="5" width="3" height="3" fill="hsl(var(--primary))" />
    <rect x="7" y="4" width="1" height="1" fill="hsl(var(--primary))" />
    {/* Compass */}
    <rect x="11" y="4" width="2" height="2" fill="hsl(var(--muted))" />
    <rect x="11" y="4" width="2" height="2" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
    <rect x="11" y="4" width="1" height="1" fill="hsl(0 70% 50%)" />
    <rect x="12" y="5" width="1" height="1" fill="hsl(200 70% 50%)" />
  </svg>
);

const PixelBeach = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Sun */}
    <rect x="10" y="2" width="4" height="4" fill="hsl(45 80% 60%)" />
    {/* Water */}
    <rect x="0" y="10" width="16" height="6" fill="hsl(200 60% 50%)" />
    <rect x="0" y="10" width="16" height="2" fill="hsl(200 70% 60%)" />
    {/* Sand */}
    <rect x="0" y="12" width="16" height="4" fill="hsl(45 50% 70%)" />
    {/* Umbrella */}
    <rect x="6" y="4" width="4" height="4" fill="hsl(0 70% 50%)" />
    <rect x="7" y="5" width="2" height="2" fill="hsl(0 80% 60%)" />
    <rect x="7" y="8" width="2" height="4" fill="hsl(25 60% 45%)" />
  </svg>
);

const PixelShopping = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Bag */}
    <rect x="4" y="6" width="8" height="8" fill="hsl(var(--primary))" />
    <rect x="5" y="7" width="6" height="6" fill="hsl(200 60% 50%)" />
    {/* Handles */}
    <rect x="5" y="5" width="2" height="1" fill="hsl(var(--primary))" />
    <rect x="9" y="5" width="2" height="1" fill="hsl(var(--primary))" />
    {/* Items inside */}
    <rect x="6" y="8" width="4" height="2" fill="hsl(45 80% 60%)" />
    <rect x="7" y="10" width="2" height="2" fill="hsl(0 70% 50%)" />
  </svg>
);

const PixelPlane = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""} ${isActive ? "animate-pulse" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Body */}
    <rect x="3" y="7" width="10" height="2" fill="hsl(var(--primary))" />
    {/* Wings */}
    <rect x="5" y="5" width="2" height="4" fill="hsl(var(--primary))" />
    <rect x="9" y="5" width="2" height="4" fill="hsl(var(--primary))" />
    {/* Tail */}
    <rect x="2" y="6" width="2" height="4" fill="hsl(var(--primary))" />
    {/* Windows */}
    <rect x="6" y="7" width="1" height="1" fill="hsl(200 80% 80%)" />
    <rect x="8" y="7" width="1" height="1" fill="hsl(200 80% 80%)" />
  </svg>
);

const PixelHotel = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Building */}
    <rect x="2" y="4" width="12" height="10" fill="hsl(var(--primary))" />
    {/* Windows */}
    <rect x="4" y="6" width="2" height="2" fill="hsl(45 80% 70%)" />
    <rect x="7" y="6" width="2" height="2" fill="hsl(45 80% 70%)" />
    <rect x="10" y="6" width="2" height="2" fill="hsl(45 80% 70%)" />
    <rect x="4" y="9" width="2" height="2" fill="hsl(45 80% 70%)" />
    <rect x="7" y="9" width="2" height="2" fill="hsl(45 80% 70%)" />
    <rect x="10" y="9" width="2" height="2" fill="hsl(45 80% 70%)" />
    {/* Door */}
    <rect x="7" y="11" width="2" height="3" fill="hsl(30 60% 40%)" />
    {/* Roof */}
    <rect x="1" y="3" width="14" height="2" fill="hsl(0 70% 50%)" />
  </svg>
);

const PixelMovie = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Screen */}
    <rect x="2" y="3" width="12" height="8" fill="hsl(220 60% 20%)" />
    <rect x="3" y="4" width="10" height="6" fill="hsl(220 80% 40%)" />
    {/* Stand */}
    <rect x="7" y="11" width="2" height="3" fill="hsl(var(--primary))" />
    {/* Base */}
    <rect x="4" y="14" width="8" height="1" fill="hsl(var(--primary))" />
  </svg>
);

const PixelBook = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Cover */}
    <rect x="3" y="2" width="10" height="12" fill="hsl(var(--primary))" />
    <rect x="4" y="3" width="8" height="10" fill="hsl(45 80% 90%)" />
    {/* Pages */}
    <rect x="5" y="4" width="6" height="8" fill="hsl(0 0% 100%)" />
    {/* Lines */}
    <rect x="6" y="6" width="4" height="1" fill="hsl(0 0% 70%)" />
    <rect x="6" y="8" width="4" height="1" fill="hsl(0 0% 70%)" />
    <rect x="6" y="10" width="3" height="1" fill="hsl(0 0% 70%)" />
  </svg>
);

const PixelGame = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Controller body */}
    <rect x="3" y="5" width="10" height="6" fill="hsl(var(--primary))" />
    {/* Buttons */}
    <rect x="5" y="6" width="2" height="2" fill="hsl(0 70% 50%)" />
    <rect x="9" y="6" width="2" height="2" fill="hsl(120 70% 50%)" />
    <rect x="7" y="8" width="2" height="2" fill="hsl(240 70% 50%)" />
    {/* D-pad */}
    <rect x="4" y="9" width="1" height="1" fill="hsl(0 0% 30%)" />
    <rect x="5" y="9" width="1" height="1" fill="hsl(0 0% 30%)" />
    <rect x="6" y="9" width="1" height="1" fill="hsl(0 0% 30%)" />
    <rect x="5" y="10" width="1" height="1" fill="hsl(0 0% 30%)" />
  </svg>
);

const PixelPhone = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Phone body */}
    <rect x="4" y="2" width="8" height="12" fill="hsl(0 0% 20%)" />
    <rect x="5" y="3" width="6" height="10" fill="hsl(200 80% 50%)" />
    {/* Screen */}
    <rect x="6" y="5" width="4" height="6" fill="hsl(0 0% 10%)" />
    {/* Home button */}
    <rect x="7" y="12" width="2" height="1" fill="hsl(0 0% 40%)" />
  </svg>
);

const PixelSun = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""} ${isActive ? "animate-spin" : ""}`} style={{ imageRendering: "pixelated", animationDuration: "3s" }}>
    {/* Center */}
    <rect x="7" y="7" width="2" height="2" fill="hsl(45 100% 60%)" />
    {/* Rays */}
    <rect x="7" y="2" width="2" height="1" fill="hsl(45 100% 60%)" />
    <rect x="7" y="13" width="2" height="1" fill="hsl(45 100% 60%)" />
    <rect x="2" y="7" width="1" height="2" fill="hsl(45 100% 60%)" />
    <rect x="13" y="7" width="1" height="2" fill="hsl(45 100% 60%)" />
    <rect x="4" y="4" width="1" height="1" fill="hsl(45 100% 60%)" />
    <rect x="11" y="4" width="1" height="1" fill="hsl(45 100% 60%)" />
    <rect x="4" y="11" width="1" height="1" fill="hsl(45 100% 60%)" />
    <rect x="11" y="11" width="1" height="1" fill="hsl(45 100% 60%)" />
  </svg>
);

const PixelMoon = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Moon shape */}
    <rect x="4" y="4" width="8" height="8" fill="hsl(45 60% 80%)" />
    <rect x="6" y="4" width="6" height="8" fill="hsl(220 40% 30%)" />
    {/* Craters */}
    <rect x="6" y="6" width="1" height="1" fill="hsl(45 40% 60%)" />
    <rect x="9" y="8" width="1" height="1" fill="hsl(45 40% 60%)" />
    <rect x="7" y="10" width="1" height="1" fill="hsl(45 40% 60%)" />
  </svg>
);

const PixelUmbrella = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Canopy */}
    <rect x="2" y="3" width="12" height="4" fill="hsl(200 80% 50%)" />
    <rect x="3" y="4" width="10" height="2" fill="hsl(200 90% 60%)" />
    {/* Ribs */}
    <rect x="8" y="3" width="1" height="4" fill="hsl(0 0% 30%)" />
    <rect x="4" y="4" width="1" height="2" fill="hsl(0 0% 30%)" />
    <rect x="11" y="4" width="1" height="2" fill="hsl(0 0% 30%)" />
    {/* Handle */}
    <rect x="7" y="7" width="2" height="6" fill="hsl(30 60% 40%)" />
    <rect x="8" y="13" width="1" height="2" fill="hsl(30 60% 40%)" />
  </svg>
);

const PixelBike = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Wheels */}
    <rect x="2" y="9" width="4" height="4" fill="hsl(0 0% 20%)" />
    <rect x="10" y="9" width="4" height="4" fill="hsl(0 0% 20%)" />
    <rect x="3" y="10" width="2" height="2" fill="hsl(0 0% 50%)" />
    <rect x="11" y="10" width="2" height="2" fill="hsl(0 0% 50%)" />
    {/* Frame */}
    <rect x="6" y="6" width="4" height="1" fill="hsl(var(--primary))" />
    <rect x="6" y="11" width="4" height="1" fill="hsl(var(--primary))" />
    <rect x="9" y="7" width="1" height="4" fill="hsl(var(--primary))" />
    {/* Seat */}
    <rect x="5" y="5" width="2" height="1" fill="hsl(var(--primary))" />
    {/* Handlebars */}
    <rect x="10" y="6" width="1" height="1" fill="hsl(var(--primary))" />
  </svg>
);

const PixelTrain = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Train body */}
    <rect x="1" y="6" width="14" height="6" fill="hsl(var(--primary))" />
    {/* Windows */}
    <rect x="3" y="7" width="2" height="2" fill="hsl(200 80% 80%)" />
    <rect x="6" y="7" width="2" height="2" fill="hsl(200 80% 80%)" />
    <rect x="9" y="7" width="2" height="2" fill="hsl(200 80% 80%)" />
    <rect x="12" y="7" width="2" height="2" fill="hsl(200 80% 80%)" />
    {/* Wheels */}
    <rect x="2" y="12" width="2" height="2" fill="hsl(0 0% 20%)" />
    <rect x="6" y="12" width="2" height="2" fill="hsl(0 0% 20%)" />
    <rect x="10" y="12" width="2" height="2" fill="hsl(0 0% 20%)" />
    <rect x="14" y="12" width="2" height="2" fill="hsl(0 0% 20%)" />
  </svg>
);

const PixelPark = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Tree trunk */}
    <rect x="7" y="10" width="2" height="4" fill="hsl(30 60% 40%)" />
    {/* Tree top */}
    <rect x="5" y="6" width="6" height="5" fill="hsl(120 70% 40%)" />
    <rect x="6" y="5" width="4" height="3" fill="hsl(120 80% 50%)" />
    {/* Ground */}
    <rect x="0" y="14" width="16" height="2" fill="hsl(120 40% 50%)" />
  </svg>
);

const PixelFireworks = ({ isActive, isPast }: { isActive: boolean; isPast: boolean }) => (
  <svg viewBox="0 0 16 16" className={`w-full h-full ${isPast ? "opacity-50 grayscale" : ""}`} style={{ imageRendering: "pixelated" }}>
    {/* Center */}
    <rect x="7" y="7" width="2" height="2" fill="hsl(45 100% 60%)" />
    {/* Explosion */}
    {isActive && (
      <>
        <rect x="7" y="2" width="2" height="1" fill="hsl(0 100% 60%)" />
        <rect x="7" y="13" width="2" height="1" fill="hsl(120 100% 60%)" />
        <rect x="2" y="7" width="1" height="2" fill="hsl(240 100% 60%)" />
        <rect x="13" y="7" width="1" height="2" fill="hsl(45 100% 60%)" />
        <rect x="4" y="4" width="1" height="1" fill="hsl(0 100% 60%)" />
        <rect x="11" y="4" width="1" height="1" fill="hsl(120 100% 60%)" />
        <rect x="4" y="11" width="1" height="1" fill="hsl(240 100% 60%)" />
        <rect x="11" y="11" width="1" height="1" fill="hsl(45 100% 60%)" />
      </>
    )}
  </svg>
);

// "You are here" chat bubble
const PixelAvatar = () => (
  <svg viewBox="0 0 90 45" className="w-24 h-12 md:w-28 md:h-14" style={{ imageRendering: "pixelated" }}>
    {/* Chat bubble shadow */}
    <ellipse cx="45" cy="43" rx="28" ry="1" fill="hsl(0 0% 0%)" opacity="0.2" />
    {/* Chat bubble body - rounded rectangle */}
    <rect x="5" y="3" width="80" height="32" rx="3" ry="3" fill="hsl(0 80% 55%)" />
    {/* Chat bubble border */}
    <rect x="5" y="3" width="80" height="32" rx="3" ry="3" fill="none" stroke="hsl(0 60% 40%)" strokeWidth="1.5" />
    {/* Inner highlight */}
    <rect x="7" y="5" width="76" height="28" rx="2" ry="2" fill="hsl(0 85% 60%)" opacity="0.3" />
    {/* Chat bubble pointer/tail pointing down */}
    <path d="M 35 35 L 45 43 L 55 35 Z" fill="hsl(0 80% 55%)" />
    <path d="M 35 35 L 45 43 L 55 35 Z" fill="none" stroke="hsl(0 60% 40%)" strokeWidth="1.5" />
    {/* Text "You are here" - bold white text */}
    <text 
      x="45" 
      y="22" 
      fontSize="9" 
      fontFamily="'Courier New', monospace" 
      fill="hsl(0 0% 100%)" 
      textAnchor="middle" 
      fontWeight="bold"
      style={{ 
        imageRendering: "pixelated",
        textShadow: "1px 1px 0px hsl(0 60% 40%)",
        letterSpacing: "0.5px"
      }}
    >
      You are here
    </text>
  </svg>
);

export const sprites: Record<string, React.FC<{ isActive: boolean; isPast: boolean }>> = {
  coffee: PixelCoffee,
  flower: PixelFlower,
  food: PixelFood,
  camera: PixelCamera,
  music: PixelMusic,
  dinner: PixelDinner,
  gift: PixelGift,
  cake: PixelCake,
  heart: PixelHeart,
  star: PixelStar,
  balloon: PixelBalloon,
  car: PixelCar,
  map: PixelMap,
  beach: PixelBeach,
  shopping: PixelShopping,
  plane: PixelPlane,
  hotel: PixelHotel,
  movie: PixelMovie,
  book: PixelBook,
  game: PixelGame,
  phone: PixelPhone,
  sun: PixelSun,
  moon: PixelMoon,
  umbrella: PixelUmbrella,
  bike: PixelBike,
  train: PixelTrain,
  park: PixelPark,
  fireworks: PixelFireworks,
};

// Pixel border pattern - Pasar Seni art market theme
const PixelBorder = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Outer border - warm wood tone */}
    <div className="absolute inset-0 bg-[hsl(30_40%_60%)]" style={{ imageRendering: "pixelated" }} />
    {/* Inner border - decorative frame */}
    <div className="absolute inset-1 bg-[hsl(15_60%_50%)]" />
    {/* Content area - warm background */}
    <div className="absolute inset-2 bg-[hsl(35_35%_88%)]" />
    {/* Corner decorations - colorful accents */}
    <div className="absolute top-0 left-0 w-3 h-3 bg-[hsl(0_70%_60%)]" />
    <div className="absolute top-0 right-0 w-3 h-3 bg-[hsl(45_80%_65%)]" />
    <div className="absolute bottom-0 left-0 w-3 h-3 bg-[hsl(200_60%_55%)]" />
    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[hsl(120_50%_50%)]" />
    {/* Content */}
    <div className="relative z-10 p-4">{children}</div>
  </div>
);

interface TimelineSectionProps {
  itineraryState: ItineraryItem[];
  setItineraryState: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  selectedEvent: ItineraryItem | null;
  setSelectedEvent: React.Dispatch<React.SetStateAction<ItineraryItem | null>>;
}

const TimelineSection = ({ 
  itineraryState, 
  setItineraryState, 
  selectedEvent, 
  setSelectedEvent 
}: TimelineSectionProps) => {
  const activeIndex = itineraryState.findIndex(item => item.isActive);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [capturedPhotoSrc, setCapturedPhotoSrc] = useState<string>("");
  const [checkpointPhotos, setCheckpointPhotos] = useState<PhotoType[]>([]);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  
  const { addPhoto, getPhotosByCheckpoint, deletePhoto } = useAdventure();

  // Load photos for selected checkpoint
  useEffect(() => {
    if (selectedEvent) {
      const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
      getPhotosByCheckpoint(checkpointId).then(setCheckpointPhotos);
    }
  }, [selectedEvent, getPhotosByCheckpoint]);
  
  // Find the latest completed activity index (or current active if none completed)
  const getCurrentLocationIndex = () => {
    // Find the last completed activity
    let lastCompletedIndex = -1;
    for (let i = itineraryState.length - 1; i >= 0; i--) {
      if (itineraryState[i].isPast) {
        lastCompletedIndex = i;
        break;
      }
    }
    // If there are completed activities, return the last one
    // Otherwise, return the active index (or 0 if no active)
    return lastCompletedIndex >= 0 ? lastCompletedIndex : (activeIndex >= 0 ? activeIndex : 0);
  };
  
  const currentLocationIndex = getCurrentLocationIndex();

  // Path coordinates for the flowing wave pattern
  // Generate path points dynamically based on itinerary length
  const generatePathPoints = (count: number) => {
    if (count === 0) return [];
    if (count === 1) return [{ x: 50, y: 50 }];
    
    const points: { x: number; y: number }[] = [];
    const basePoints = [
      { x: 15, y: 80 },  // Start: Bottom-left area - gentle entry point
      { x: 25, y: 65 },  // Wave up: First crest
      { x: 40, y: 75 },  // Wave down: First trough
      { x: 55, y: 60 },  // Wave up: Second crest
      { x: 70, y: 70 },  // Wave down: Second trough
      { x: 85, y: 45 },  // End: Top-right area - gentle exit point
    ];
    
    if (count <= basePoints.length) {
      // Use first N points from base
      return basePoints.slice(0, count);
    } else {
      // Use all base points, then generate additional points
      const additional = count - basePoints.length;
      const lastPoint = basePoints[basePoints.length - 1];
      const spacing = (100 - lastPoint.x) / (additional + 1);
      
      for (let i = 0; i < basePoints.length; i++) {
        points.push(basePoints[i]);
      }
      
      // Generate additional points in a pattern
      for (let i = 1; i <= additional; i++) {
        const x = lastPoint.x + (spacing * i);
        const y = lastPoint.y + (Math.sin(i * 0.5) * 10); // Slight wave pattern
        points.push({ x: Math.min(95, x), y: Math.max(10, Math.min(90, y)) });
      }
    }
    
    return points;
  };
  
  const pathPoints = generatePathPoints(itineraryState.length);

  const handleStampClick = (item: ItineraryItem) => {
    // Clear any previous errors when clicking a new stamp
    setLocationError(null);
    setSelectedEvent(item);
    
    // Trigger sparkle effect at stamp position
    const index = itineraryState.findIndex(i => 
      i.time === item.time && 
      i.title === item.title && 
      i.sprite === item.sprite
    );
    if (index >= 0 && pathPoints[index] && pathPoints[index].x !== undefined && pathPoints[index].y !== undefined) {
      const pos = pathPoints[index];
      // Convert percentage to pixel coordinates
      const x = (pos.x / 100) * window.innerWidth;
      const y = (pos.y / 100) * window.innerHeight;
      
      sparkleBurst({
        x,
        y,
        particleCount: 15,
      });
    }
  };

  const handlePhotoCapture = (dataURL: string) => {
    setCapturedPhotoSrc(dataURL);
    setShowPhotoCapture(false);
    setShowPhotoEditor(true);
  };

  const handlePhotoSave = async (photoData: Omit<PhotoType, "id" | "timestamp">) => {
    try {
      await addPhoto(photoData.checkpointId, photoData);
      if (selectedEvent) {
        const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
        const photos = await getPhotosByCheckpoint(checkpointId);
        setCheckpointPhotos(photos);
      }
      setShowPhotoEditor(false);
      setCapturedPhotoSrc("");
    } catch (error) {
      console.error("Error saving photo:", error);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    try {
      setDeletingPhotoId(photoId);
      await deletePhoto(photoId);
      if (selectedEvent) {
        const checkpointId = `${selectedEvent.time}-${selectedEvent.title}`;
        const photos = await getPhotosByCheckpoint(checkpointId);
        setCheckpointPhotos(photos);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleMarkAsDone = (eventIndex: number) => {
    const item = itineraryState[eventIndex];
    
    // If no location is set for this item, allow marking as done without location check
    if (!item.location) {
      setItineraryState(prev => {
        const updated = [...prev];
        const wasActive = prev[eventIndex].isActive; // Check state BEFORE modification
        updated[eventIndex] = { ...updated[eventIndex], isPast: true, isActive: false };
        // If this was the active event, activate the next one
        if (wasActive) {
          const nextIndex = eventIndex + 1;
          if (nextIndex < updated.length) {
            updated[nextIndex] = { ...updated[nextIndex], isActive: true };
          }
        }
        return updated;
      });
      setSelectedEvent(null);
      setLocationError(null);
      return;
    }

    // IMPORTANT: Call checkLocation directly from click handler (not async)
    // This ensures the user gesture chain is preserved for iOS Safari and Chrome
    setIsCheckingLocation(true);
    setLocationError(null);

    // Call checkLocation synchronously to preserve user gesture for permission prompt
    checkLocation(item.location).then((locationResult) => {
      if (!locationResult.isAtLocation) {
        setIsCheckingLocation(false);
        if (locationResult.distance !== undefined) {
          setLocationError(
            `You are ${locationResult.distance}m away from the location. Please go to ${item.title} location to check in.`
          );
        } else {
          setLocationError(locationResult.error || "Unable to verify your location. Please try again.");
        }
        return;
      }

      // Location check passed, mark as done
      setIsCheckingLocation(false);
      setLocationError(null);
      setItineraryState(prev => {
        const updated = [...prev];
        const wasActive = prev[eventIndex].isActive; // Check state BEFORE modification
        updated[eventIndex] = { ...updated[eventIndex], isPast: true, isActive: false };
        // If this was the active event, activate the next one
        if (wasActive) {
          const nextIndex = eventIndex + 1;
          if (nextIndex < updated.length) {
            updated[nextIndex] = { ...updated[nextIndex], isActive: true };
          }
        }
        return updated;
      });
      setSelectedEvent(null);
    });
  };

  return (
    <section className="py-12 md:py-20 bg-[hsl(35_40%_85%)] relative overflow-hidden">
      {/* Pixel UI Border Frame */}
      <div className="container px-4 md:px-6">
        <PixelBorder className="min-h-[600px] md:min-h-[700px]">
          {/* Section Header */}
          <motion.div
            className="text-center mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-pixel text-xs md:text-sm text-[hsl(15_70%_40%)] mb-2 tracking-wider">
              ~ ADVENTURE MAP ~
            </h2>
            <p className="font-pixel text-[8px] md:text-[10px] text-[hsl(15_60%_35%)]">
              Click a checkpoint to view details
            </p>
          </motion.div>

          {/* Pixel Map Container */}
          <div 
            className="relative w-full h-[400px] md:h-[500px] rounded overflow-hidden"
            style={{ imageRendering: "pixelated" }}
          >
            {/* Pasar Seni sky - warm daytime atmosphere */}
            <div 
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, hsl(45 50% 90%) 0%, hsl(35 45% 88%) 50%, hsl(30 40% 85%) 100%)",
              }}
            />
            
            {/* Decorative clouds */}
            {[
              { x: 10, y: 8, size: 20 }, { x: 40, y: 5, size: 25 }, { x: 70, y: 10, size: 18 },
              { x: 85, y: 6, size: 22 },
            ].map((cloud, i) => (
              <div
                key={`cloud-${i}`}
                className="absolute opacity-30"
                style={{
                  left: `${cloud.x}%`,
                  top: `${cloud.y}%`,
                  width: `${cloud.size}px`,
                  height: `${cloud.size * 0.6}px`,
                }}
              >
                <svg viewBox="0 0 20 12" className="w-full h-full" style={{ imageRendering: "pixelated" }}>
                  <ellipse cx="6" cy="6" rx="5" ry="4" fill="hsl(0 0% 95%)" />
                  <ellipse cx="12" cy="5" rx="6" ry="5" fill="hsl(0 0% 95%)" />
                  <ellipse cx="15" cy="7" rx="4" ry="3" fill="hsl(0 0% 95%)" />
                </svg>
              </div>
            ))}

            {/* Art market stalls with colorful umbrellas - positioned to complement wave path */}
            {[
              { x: 5, y: 20, color: "hsl(0 70% 60%)" },    // Red stall - top left
              { x: 18, y: 15, color: "hsl(30 80% 65%)" },   // Orange stall - above first crest
              { x: 32, y: 25, color: "hsl(200 60% 55%)" }, // Blue stall - between crests
              { x: 48, y: 20, color: "hsl(120 50% 50%)" },  // Green stall - above second crest
              { x: 62, y: 25, color: "hsl(280 60% 60%)" },  // Purple stall - between crests
              { x: 78, y: 20, color: "hsl(15 75% 60%)" },   // Red-orange stall - top right
              { x: 10, y: 50, color: "hsl(45 70% 65%)" },   // Yellow stall - left side
              { x: 35, y: 55, color: "hsl(0 65% 55%)" },    // Dark red stall - near first trough
              { x: 50, y: 50, color: "hsl(180 55% 55%)" },  // Teal stall - middle area
              { x: 68, y: 55, color: "hsl(45 80% 70%)" },   // Light yellow stall - near second trough
              { x: 20, y: 85, color: "hsl(200 70% 60%)" }, // Light blue stall - bottom left
              { x: 45, y: 82, color: "hsl(120 60% 55%)" },  // Light green stall - bottom middle
            ].map((stall, i) => (
              <div key={`stall-${i}`} className="absolute" style={{ left: `${stall.x}%`, top: `${stall.y}%` }}>
                <svg viewBox="0 0 16 20" className="w-8 h-10 md:w-10 md:h-12" style={{ imageRendering: "pixelated" }}>
                  {/* Umbrella/tent top */}
                  <path d="M 2 4 L 8 0 L 14 4 L 14 10 L 2 10 Z" fill={stall.color} />
                  {/* Umbrella stripes */}
                  <rect x="2" y="6" width="12" height="1" fill="hsl(0 0% 100%)" opacity="0.3" />
                  <rect x="2" y="8" width="12" height="1" fill="hsl(0 0% 100%)" opacity="0.3" />
                  {/* Stall base/table */}
                  <rect x="3" y="10" width="10" height="2" fill="hsl(30 40% 50%)" />
                  {/* Legs */}
                  <rect x="4" y="12" width="1" height="6" fill="hsl(30 30% 40%)" />
                  <rect x="11" y="12" width="1" height="6" fill="hsl(30 30% 40%)" />
                  {/* Art display on table */}
                  <rect x="6" y="9" width="4" height="3" fill="hsl(45 60% 70%)" />
                  <rect x="7" y="8" width="2" height="1" fill="hsl(15 70% 60%)" />
                </svg>
              </div>
            ))}

            {/* Decorative art displays and banners */}
            {[
              { x: 15, y: 15, type: "banner" },
              { x: 55, y: 12, type: "art" },
              { x: 85, y: 18, type: "banner" },
            ].map((item, i) => (
              <div key={`art-${i}`} className="absolute" style={{ left: `${item.x}%`, top: `${item.y}%` }}>
                <svg viewBox="0 0 12 16" className="w-6 h-8 md:w-8 md:h-10" style={{ imageRendering: "pixelated" }}>
                  {item.type === "banner" ? (
                    <>
                      {/* Banner pole */}
                      <rect x="5" y="0" width="2" height="16" fill="hsl(30 40% 45%)" />
                      {/* Banner cloth */}
                      <rect x="2" y="2" width="8" height="6" fill="hsl(0 70% 65%)" />
                      <rect x="2" y="8" width="8" height="6" fill="hsl(45 80% 70%)" />
                    </>
                  ) : (
                    <>
                      {/* Art frame */}
                      <rect x="1" y="3" width="10" height="10" fill="hsl(30 50% 60%)" stroke="hsl(30 30% 40%)" strokeWidth="1" />
                      {/* Art canvas */}
                      <rect x="2" y="4" width="8" height="8" fill="hsl(200 50% 70%)" />
                      {/* Art pattern */}
                      <circle cx="6" cy="7" r="2" fill="hsl(0 70% 60%)" />
                    </>
                  )}
                </svg>
              </div>
            ))}

            {/* Pasar Seni market path connecting checkpoints */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ imageRendering: "pixelated" }}>
              <defs>
                <pattern id="pathPattern" patternUnits="userSpaceOnUse" width="16" height="16">
                  <rect width="16" height="16" fill="hsl(30 35% 75%)" />
                  <rect x="0" y="7" width="16" height="2" fill="hsl(30 40% 70%)" />
                  <circle cx="4" cy="8" r="1" fill="hsl(30 25% 60%)" />
                  <circle cx="12" cy="8" r="1" fill="hsl(30 25% 60%)" />
                </pattern>
                <pattern id="groundPattern" patternUnits="userSpaceOnUse" width="12" height="12">
                  <rect width="12" height="12" fill="hsl(35 30% 80%)" />
                  <rect x="0" y="0" width="12" height="1" fill="hsl(35 25% 75%)" />
                </pattern>
              </defs>
              
              {/* Ground/base layer */}
              <rect x="0" y="0" width="100%" height="100%" fill="url(#groundPattern)" />
              
              {/* Main market path - wider and more visible */}
              {pathPoints.length > 0 && (
                <>
                  <path
                    d={`M ${pathPoints.filter(p => p && p.x !== undefined && p.y !== undefined).map(p => `${p.x},${p.y}`).join(" L ")}`}
                    stroke="hsl(30 30% 70%)"
                    strokeWidth="28"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  />
                  
                  {/* Path surface with pattern */}
                  <path
                    d={`M ${pathPoints.filter(p => p && p.x !== undefined && p.y !== undefined).map(p => `${p.x},${p.y}`).join(" L ")}`}
                    stroke="url(#pathPattern)"
                    strokeWidth="24"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Path border/edge */}
                  <path
                    d={`M ${pathPoints.filter(p => p && p.x !== undefined && p.y !== undefined).map(p => `${p.x},${p.y}`).join(" L ")}`}
                    stroke="hsl(30 25% 60%)"
                    strokeWidth="26"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.4"
                  />
                  
                  {/* Path center line - decorative */}
                  <path
                    d={`M ${pathPoints.filter(p => p && p.x !== undefined && p.y !== undefined).map(p => `${p.x},${p.y}`).join(" L ")}`}
                    stroke="hsl(15 60% 50%)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                  />
                </>
              )}
            </svg>

            {/* Market ground texture */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-[35%]"
              style={{
                background: "linear-gradient(to top, hsl(30 35% 75%) 0%, hsl(35 30% 80%) 100%)",
                backgroundImage: `
                  repeating-linear-gradient(90deg, 
                    transparent 0px, 
                    transparent 10px, 
                    hsl(30 25% 70%) 10px, 
                    hsl(30 25% 70%) 11px
                  ),
                  repeating-linear-gradient(0deg, 
                    transparent 0px, 
                    transparent 10px, 
                    hsl(30 25% 70%) 10px, 
                    hsl(30 25% 70%) 11px
                  )
                `,
                backgroundSize: "20px 20px",
                opacity: 0.3,
              }}
            />

            {/* Connecting lines between checkpoints with direction indicators - positioned below checkpoints */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ imageRendering: "pixelated", zIndex: 1 }}>
              {pathPoints.map((point, index) => {
                if (!point || index === pathPoints.length - 1) return null; // Skip last point or invalid point
                const nextPoint = pathPoints[index + 1];
                if (!nextPoint) return null; // Skip if next point doesn't exist
                const currentItem = itineraryState[index];
                const isPast = currentItem?.isPast || false;
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                // Offset arrow slightly before reaching checkpoint to avoid overlap
                const arrowOffset = 3; // percentage offset
                const arrowX = nextPoint.x - (dx / distance) * arrowOffset;
                const arrowY = nextPoint.y - (dy / distance) * arrowOffset;
                
                return (
                  <g key={`connection-${index}`}>
                    {/* Main connecting line - stops just before checkpoints */}
                    <line
                      x1={point.x}
                      y1={point.y}
                      x2={arrowX}
                      y2={arrowY}
                      stroke="hsl(15 70% 50%)"
                      strokeWidth="5"
                      strokeDasharray={isPast ? "0" : "10 5"}
                      opacity={isPast ? 0.4 : 0.85}
                      strokeLinecap="round"
                    />
                    {/* Arrow head pointing to next checkpoint - positioned before checkpoint */}
                    <g
                      transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}
                      opacity={isPast ? 0.4 : 0.85}
                    >
                      <path
                        d="M -12 -6 L 0 0 L -12 6 Z"
                        fill="hsl(15 70% 50%)"
                        stroke="hsl(15 60% 40%)"
                        strokeWidth="2"
                      />
                    </g>
                    {/* Progress dots along the line - show direction, avoiding checkpoint areas */}
                    {Array.from({ length: Math.max(2, Math.floor(distance / 15)) }).map((_, dotIndex) => {
                      const t = (dotIndex + 1) / (Math.max(2, Math.floor(distance / 15)) + 2); // Stop before checkpoint
                      const dotX = point.x + dx * t;
                      const dotY = point.y + dy * t;
                      return (
                        <circle
                          key={`dot-${index}-${dotIndex}`}
                          cx={dotX}
                          cy={dotY}
                          r="3"
                          fill="hsl(15 70% 50%)"
                          opacity={isPast ? 0.3 : 0.6}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            {/* Checkpoint sprites */}
            {itineraryState.map((item, index) => {
              const SpriteComponent = sprites[item.sprite];
              const pos = pathPoints[index];
              
              // Skip if position doesn't exist
              if (!pos || pos.x === undefined || pos.y === undefined) {
                return null;
              }
              
              return (
                <motion.button
                  key={index}
                  className={`absolute w-10 h-10 md:w-14 md:h-14 cursor-pointer focus:outline-none ${
                    item.isActive ? "z-20" : "z-10"
                  }`}
                  style={{ 
                    left: `${pos.x}%`, 
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => handleStampClick(item)}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  animate={item.isActive ? {
                    y: [0, -5, 0],
                    transition: { repeat: Infinity, duration: 0.8 }
                  } : {}}
                >
                  {/* Warm glow effect for active item - pasar seni style */}
                  {item.isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[hsl(15_70%_60%)]"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.6, 0.2, 0.6],
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                  <SpriteComponent isActive={item.isActive} isPast={item.isPast} />
                </motion.button>
              );
            })}

            {/* "You are here" chat bubble on current location - follows latest completed activity */}
            {currentLocationIndex >= 0 && pathPoints[currentLocationIndex] && pathPoints[currentLocationIndex].x !== undefined && (
              <motion.div
                className="absolute z-30"
                key={currentLocationIndex} // Force re-render when location changes
                style={{
                  left: `${pathPoints[currentLocationIndex].x}%`,
                  top: `${pathPoints[currentLocationIndex].y}%`,
                  transform: "translate(-50%, -110%)",
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  y: [0, -3, 0],
                }}
                transition={{ 
                  scale: { duration: 0.3 },
                  opacity: { duration: 0.3 },
                  y: { repeat: Infinity, duration: 0.8 }
                }}
              >
                <PixelAvatar />
              </motion.div>
            )}

            {/* Legend with pasar seni styling */}
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-[hsl(35_40%_85%)] p-2 rounded border-2 border-[hsl(15_60%_50%)]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-[hsl(15_70%_55%)] rounded-full animate-pulse" />
                <span className="font-pixel text-[6px] md:text-[8px] text-[hsl(15_60%_35%)]">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[hsl(var(--muted-foreground))] rounded-full opacity-50" />
                <span className="font-pixel text-[6px] md:text-[8px] text-[hsl(15_60%_35%)]">Completed</span>
              </div>
            </div>
          </div>
        </PixelBorder>
      </div>

      {/* Pixel Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-[hsl(0_0%_0%)] bg-opacity-70"
              onClick={() => {
                setSelectedEvent(null);
                setLocationError(null);
              }}
            />
            
            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              {/* Pixel border frame - Pasar Seni theme */}
              <div className="relative bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1">
                {/* Inner border */}
                <div className="border-2 border-[hsl(30_50%_60%)] p-4">
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      setLocationError(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] hover:bg-[hsl(0_60%_60%)] transition-colors"
                  >
                    <X className="w-4 h-4 text-[hsl(0_0%_100%)]" />
                  </button>

                  {/* Content */}
                  <div className="text-center">
                    {/* Sprite preview */}
                    <div className="w-16 h-16 mx-auto mb-4">
                      {(() => {
                        const eventIndex = itineraryState.findIndex(item => 
                          item.time === selectedEvent.time && 
                          item.title === selectedEvent.title
                        );
                        const currentItem = eventIndex >= 0 ? itineraryState[eventIndex] : selectedEvent;
                        const SpriteComponent = sprites[selectedEvent.sprite];
                        return <SpriteComponent isActive={currentItem.isActive} isPast={currentItem.isPast} />;
                      })()}
                    </div>

                    {/* Time badge */}
                    <div className="inline-block bg-[hsl(var(--primary))] px-3 py-1 mb-3">
                      <span className="font-pixel text-[10px] text-[hsl(var(--primary-foreground))]">
                        {selectedEvent.time}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      className="font-pixel text-sm md:text-base text-[hsl(15_70%_40%)] mb-4"
                      style={{ 
                        textRendering: "optimizeSpeed",
                        WebkitFontSmoothing: "none",
                        MozOsxFontSmoothing: "unset",
                        fontSmooth: "never",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {selectedEvent.title}
                    </h3>

                    {/* Description */}
                    <p 
                      className="font-pixel text-[8px] md:text-[10px] text-[hsl(15_60%_35%)] leading-relaxed mb-4"
                      style={{ 
                        textRendering: "optimizeSpeed",
                        WebkitFontSmoothing: "none",
                        MozOsxFontSmoothing: "unset",
                        fontSmooth: "never",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {selectedEvent.description}
                    </p>

                    {/* Photos section */}
                    {checkpointPhotos.length > 0 && (
                      <div className="mb-4">
                        <p
                          className="font-pixel text-[8px] md:text-[10px] text-[hsl(15_60%_35%)] mb-2"
                          style={{ textRendering: "optimizeSpeed" }}
                        >
                          Memories ({checkpointPhotos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {checkpointPhotos.slice(0, 6).map((photo) => (
                            <div
                              key={photo.id}
                              className="relative aspect-square bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] overflow-hidden group"
                            >
                              <img
                                src={photo.src}
                                alt={photo.caption || "Memory"}
                                className="w-full h-full object-cover"
                                style={{ imageRendering: "pixelated" }}
                              />
                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(photo.id);
                                }}
                                disabled={deletingPhotoId === photo.id}
                                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] text-white hover:bg-[hsl(0_70%_60%)] transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-wait"
                                title="Delete photo"
                              >
                                {deletingPhotoId === photo.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Photo button */}
                    <motion.button
                      onClick={() => setShowPhotoCapture(true)}
                      className="w-full mb-4 px-4 py-2 font-pixel text-xs md:text-sm rounded-lg border-2 bg-[hsl(200_60%_55%)] border-[hsl(200_50%_45%)] text-white hover:bg-[hsl(200_60%_60%)] transition-all flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Camera className="w-4 h-4" />
                      Add Photo
                    </motion.button>

                    {/* Location error message */}
                    {locationError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] rounded-lg"
                      >
                        <p 
                          className="font-pixel text-[8px] md:text-[10px] text-white text-center"
                          style={{ 
                            textRendering: "optimizeSpeed",
                            WebkitFontSmoothing: "none",
                            MozOsxFontSmoothing: "unset",
                            fontSmooth: "never",
                          }}
                        >
                          {locationError}
                        </p>
                      </motion.div>
                    )}

                    {/* Done button */}
                    {(() => {
                      const eventIndex = itineraryState.findIndex(item => 
                        item.time === selectedEvent.time && 
                        item.title === selectedEvent.title
                      );
                      const isAlreadyDone = eventIndex >= 0 && itineraryState[eventIndex].isPast;
                      const hasLocation = eventIndex >= 0 && itineraryState[eventIndex].location;
                      
                      return (
                        <motion.button
                          onClick={() => {
                            if (eventIndex >= 0 && !isAlreadyDone) {
                              handleMarkAsDone(eventIndex);
                            } else {
                              setSelectedEvent(null);
                            }
                          }}
                          className={`w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 transition-all ${
                            isAlreadyDone
                              ? "bg-[hsl(120_50%_50%)] border-[hsl(120_40%_40%)] text-white cursor-default"
                              : isCheckingLocation
                              ? "bg-[hsl(30_50%_60%)] border-[hsl(30_40%_50%)] text-white cursor-wait"
                              : "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] hover:scale-105 active:scale-95"
                          }`}
                          whileHover={!isAlreadyDone && !isCheckingLocation ? { scale: 1.05 } : {}}
                          whileTap={!isAlreadyDone && !isCheckingLocation ? { scale: 0.95 } : {}}
                          disabled={isAlreadyDone || isCheckingLocation}
                        >
                          {isAlreadyDone 
                            ? "✓ Completed" 
                            : isCheckingLocation 
                            ? "Checking Location..." 
                            : hasLocation
                            ? "check in (Location Required)"
                            : "check in"}
                        </motion.button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Capture Modal */}
      {selectedEvent && (
        <PhotoCaptureModal
          isOpen={showPhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
          onCapture={handlePhotoCapture}
          checkpointTitle={selectedEvent.title}
        />
      )}

      {/* Photo Editor */}
      {selectedEvent && capturedPhotoSrc && (
        <PhotoEditor
          photoSrc={capturedPhotoSrc}
          checkpointId={`${selectedEvent.time}-${selectedEvent.title}`}
          onSave={handlePhotoSave}
          onClose={() => {
            setShowPhotoEditor(false);
            setCapturedPhotoSrc("");
          }}
        />
      )}
    </section>
  );
};

export default TimelineSection;
