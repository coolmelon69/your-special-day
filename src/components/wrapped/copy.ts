import type { WrappedStats } from "@/types/wrapped";
import type { WrappedTemplateCopy } from "@/types/admin";

/**
 * Every user-editable string and number for /wrapped lives here.
 * Edit this file to change the wording; no need to touch the slides.
 */

export const INTRO = {
  eyebrow: "Year in Review · 2025",
  headingBefore: "Ready to review ",
  headingEmphasis: "our 2025",
  hint: "Tap right to turn the page",
  mockHint: "Nothing collected yet — here's a preview",
} as const;

/**
 * Default copy for every built-in slide, editable from /admin. Any field
 * left blank by the admin falls back to the matching value here. Heading
 * `emphasis` strings may contain `{token}` placeholders filled from live
 * stats — see src/utils/wrappedTemplate.ts for the token list per slide.
 */
export const WRAPPED_TEMPLATE_DEFAULTS: WrappedTemplateCopy = {
  intro: {
    eyebrow: INTRO.eyebrow,
    heading: { before: INTRO.headingBefore, emphasis: INTRO.headingEmphasis, after: "?" },
    hint: INTRO.hint,
    mockHint: INTRO.mockHint,
  },
  numbers: {
    eyebrow: "The Tally",
    heading: { before: "The numbers are ", emphasis: "in", after: "." },
    statLabels: {
      stamps: "Stamps collected",
      photos: "Photos taken",
      coupons: "Coupons redeemed",
      distance: "Ground covered",
    },
  },
  time: {
    eyebrow: "The Day, End To End",
    heading: { before: "You were out for ", emphasis: "{duration}", after: "." },
    firstStampLabel: "First stamp {time}",
    lastStampLabel: "Last stamp {time}",
    longestGapLabel: "Longest stretch between two stamps",
  },
  route: {
    eyebrow: "Where You Went",
    heading: { before: "You covered ", emphasis: "{distance} km", after: "." },
    checkpointsLabel: "Checkpoints on the route",
  },
  topMoment: {
    eyebrow: "Your Top Moment",
    heading: { before: "", emphasis: "{title}", after: "." },
    photosLabel: "{count} photos",
    caption: "The checkpoint you photographed most",
  },
  photoStats: {
    eyebrow: "Behind The Lens",
    heading: { before: "You could not stop ", emphasis: "pressing the button", after: "." },
    photosLabel: "Photos taken",
    stickersLabel: "Stickers stuck on",
    filterLabel: "Favourite filter: {filter}",
  },
  receipt: {
    title: "Your Special Day",
    subtitle: "Itemized receipt",
    photosLabel: "Photos",
    stickersLabel: "Stickers",
    distanceLabel: "Distance",
    timeOutLabel: "Time out",
    totalLabel: "Total",
    totalValue: "priceless",
    footer: "Thank you, come again",
  },
  updatedAt: 0,
};

/**
 * Shown when nothing at all has been collected, so the page is never empty.
 * The coordinates trace a short loop around Klang so the route slide has
 * something to draw.
 */
export const MOCK_STATS: Omit<WrappedStats, "isMock"> = {
  stampsCollected: 6,
  stampsTotal: 6,
  firstStampAt: Date.parse("2026-05-01T09:00:00"),
  lastStampAt: Date.parse("2026-05-01T20:20:00"),
  spanMinutes: 680,
  longestGapMinutes: 150,
  distanceKm: 24.6,
  route: [
    { latitude: 3.1264, longitude: 101.4681 },
    { latitude: 3.1402, longitude: 101.4903 },
    { latitude: 3.1571, longitude: 101.5122 },
    { latitude: 3.1338, longitude: 101.5384 },
  ],
  photosTaken: 42,
  stickersPlaced: 118,
  favouriteFilter: "warm",
  topMoment: { title: "Late night Emart", photoCount: 11 },
  couponsRedeemed: 3,
  receiptItems: [
    { time: "9:00 AM", title: "Breakfast Quest" },
    { time: "11:30 AM", title: "Choc Waffle Run" },
    { time: "2:00 PM", title: "Strawberry And Melon" },
    { time: "5:15 PM", title: "Golden Hour Detour" },
    { time: "7:40 PM", title: "Late Night Emart" },
    { time: "8:20 PM", title: "The Long Way Home" },
  ],
};
