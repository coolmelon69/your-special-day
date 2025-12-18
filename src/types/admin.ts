// Admin panel type definitions

export type CustomStamp = {
  id: string;
  time: string;
  title: string;
  description: string;
  sprite: string; // Must match existing sprite names
  isActive: boolean;
  isPast: boolean;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // radius in meters
  };
  createdAt: number;
  updatedAt: number;
};

export type CustomCoupon = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string; // Tailwind gradient class
  requiredStamps: number;
  category?: string;
  createdAt: number;
  updatedAt: number;
};

export type AdminSettings = {
  useCustomStamps: boolean;
  useCustomCoupons: boolean;
  lastModified: number;
  disabledDefaultStamps: string[]; // Array of default stamp titles to hide
  disabledDefaultCoupons: number[]; // Array of default coupon IDs to hide
};
