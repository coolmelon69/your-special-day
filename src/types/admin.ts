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
  /** Global switch: show the trainer card onboarding + page to logged-in users. */
  trainerCardEnabled: boolean;
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

/**
 * A heading split into three parts so the emphasized (italic) middle word
 * can carry a `{token}` while the surrounding text stays plain.
 */
export type WrappedHeadingTemplate = {
  before: string;
  emphasis: string;
  after: string;
};

/**
 * Admin-editable copy for the built-in /wrapped slides. Every heading's
 * `emphasis` field may contain `{token}` placeholders (e.g. `{duration}`)
 * that get filled in from live stats at render time — see
 * src/utils/wrappedTemplate.ts. Falls back to WRAPPED_TEMPLATE_DEFAULTS
 * (src/components/wrapped/copy.ts) for any empty field.
 */
export type WrappedTemplateCopy = {
  intro: {
    eyebrow: string;
    heading: WrappedHeadingTemplate;
    hint: string;
    mockHint: string;
  };
  numbers: {
    eyebrow: string;
    heading: WrappedHeadingTemplate;
    statLabels: {
      stamps: string;
      photos: string;
      coupons: string;
      distance: string;
    };
  };
  time: {
    eyebrow: string;
    heading: WrappedHeadingTemplate;
    firstStampLabel: string;
    lastStampLabel: string;
    longestGapLabel: string;
  };
  route: {
    eyebrow: string;
    heading: WrappedHeadingTemplate;
    checkpointsLabel: string;
  };
  topMoment: {
    eyebrow: string;
    heading: WrappedHeadingTemplate;
    photosLabel: string;
    caption: string;
  };
  photoStats: {
    eyebrow: string;
    heading: WrappedHeadingTemplate;
    photosLabel: string;
    stickersLabel: string;
    filterLabel: string;
  };
  receipt: {
    title: string;
    subtitle: string;
    photosLabel: string;
    stickersLabel: string;
    distanceLabel: string;
    timeOutLabel: string;
    totalLabel: string;
    totalValue: string;
    footer: string;
  };
  updatedAt: number;
};
