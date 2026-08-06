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
  is_secret?: boolean;
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
  /** Order of stamps: "default:Title" or "custom:uuid". Defines journey order. */
  stampOrder?: string[];
  /** Order of coupons: "default:1" (numeric id) or "custom:uuid". Defines display order. */
  couponOrder?: string[];
};

export const WRAPPED_SLIDE_ICONS = ["trophy", "heart", "star", "camera", "sparkles"] as const;
export type WrappedSlideIcon = (typeof WRAPPED_SLIDE_ICONS)[number];

export type CustomWrappedSlide = {
  id: string;
  eyebrow: string;
  icon?: WrappedSlideIcon;
  heading: string;
  emphasis?: string;
  body: string;
  order: number;
  createdAt: number;
  updatedAt: number;
};
