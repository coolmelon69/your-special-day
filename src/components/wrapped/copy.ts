import type { WrappedStats } from "@/types/wrapped";

/**
 * Every user-editable string and number for /wrapped lives here.
 * Edit this file to change the wording; no need to touch the slides.
 */

export interface Award {
  eyebrow: string;
  title: string;
  recipient: string;
  note: string;
}

export const INTRO = {
  eyebrow: "Year in Review · 2025",
  headingBefore: "Ready to review ",
  headingEmphasis: "our 2025",
  hint: "Tap right to turn the page",
  mockHint: "Nothing collected yet — here's a preview",
} as const;

/**
 * TODO(user): write the real award copy. These are placeholders, carried over
 * from the joke list in the old slideData.ts. Two awards render, in order.
 */
export const AWARDS: Award[] = [
  {
    eyebrow: "Award Nº 01",
    title: "Most Likely To Cari Pintu",
    recipient: "TODO(user): who won this one",
    note: "TODO(user): one line on why",
  },
  {
    eyebrow: "Award Nº 02",
    title: "Most Quoted Line Of The Year",
    recipient: "Wa wa wa, nyenyenye, kucukucu",
    note: "TODO(user): one line on why",
  },
];

/**
 * Archive only — nothing renders this. Carried over from the deleted
 * slideData.ts as raw material for writing the AWARDS copy above. Delete it
 * once the awards are written.
 */
export const GENRES = [
  "choc waffle",
  "Most Random Couple",
  "Late night Emart",
  "Kene pressure tunang",
  "strawberry and melon",
  "non-celen",
  "minecrafter",
  "acah2 software engineer",
  "ayammm",
] as const;

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
