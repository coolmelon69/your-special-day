/** Shared achievement engine for the Cafés section. Pure — no I/O, no storage. */
import type { CafeCategory, CafePlace } from "@/types/cafes";

export type AchievementTier = "bronze" | "silver" | "gold";

export interface AchievementTierProgress {
  id: string;
  trackId: string;
  tier: AchievementTier;
  title: string;
  description: string;
  icon: string;
  current: number;
  threshold: number;
  unlocked: boolean;
}

interface TrackDefinition {
  trackId: string;
  icon: string;
  name: string;
  /** Human description per tier, in bronze/silver/gold order. */
  tierDescriptions: [string, string, string];
  /** current/threshold, given the raw categories+places. Threshold may depend on data (Cartographer gold). */
  measure: (
    categories: CafeCategory[],
    places: CafePlace[]
  ) => { current: number; thresholds: [number, number, number] };
}

const visitedPlaces = (places: CafePlace[]) => places.filter((p) => p.status === "visited");

const fullyClearedCategoryCount = (categories: CafeCategory[], places: CafePlace[]): number => {
  let cleared = 0;
  for (const category of categories) {
    const inCategory = places.filter((p) => p.category_id === category.id);
    if (inCategory.length === 0) continue;
    if (inCategory.every((p) => p.status === "visited")) cleared += 1;
  }
  return cleared;
};

const TRACKS: TrackDefinition[] = [
  {
    trackId: "explorer",
    icon: "Compass",
    name: "Explorer",
    tierDescriptions: [
      "Visit 3 places together.",
      "Visit 10 places together.",
      "Visit 25 places together.",
    ],
    measure: (_categories, places) => ({
      current: visitedPlaces(places).length,
      thresholds: [3, 10, 25],
    }),
  },
  {
    trackId: "cartographer",
    icon: "Map",
    name: "Cartographer",
    tierDescriptions: [
      "Fully clear 1 category.",
      "Fully clear 3 categories.",
      "Fully clear every category.",
    ],
    measure: (categories, places) => ({
      current: fullyClearedCategoryCount(categories, places),
      thresholds: [1, 3, categories.length],
    }),
  },
  {
    trackId: "critics-circle",
    icon: "Star",
    name: "Critics' Circle",
    tierDescriptions: [
      "Give 10 ratings between you.",
      "Give 30 ratings between you.",
      "Give 60 ratings between you.",
    ],
    measure: (_categories, places) => {
      const visited = visitedPlaces(places);
      const current = visited.reduce(
        (total, p) => total + (p.rating_him !== null ? 1 : 0) + (p.rating_her !== null ? 1 : 0),
        0
      );
      return { current, thresholds: [10, 30, 60] };
    },
  },
  {
    trackId: "storytellers",
    icon: "PenLine",
    name: "Storytellers",
    tierDescriptions: [
      "Write a note for 5 visited places.",
      "Write a note for 15 visited places.",
      "Write a note for 30 visited places.",
    ],
    measure: (_categories, places) => ({
      current: visitedPlaces(places).filter((p) => (p.note ?? "").trim().length > 0).length,
      thresholds: [5, 15, 30],
    }),
  },
  {
    trackId: "shutterbugs",
    icon: "Camera",
    name: "Shutterbugs",
    tierDescriptions: [
      "Add a photo for 5 visited places.",
      "Add a photo for 15 visited places.",
      "Add a photo for 30 visited places.",
    ],
    measure: (_categories, places) => ({
      current: visitedPlaces(places).filter((p) => p.photo_url !== null).length,
      thresholds: [5, 15, 30],
    }),
  },
  {
    trackId: "keepers",
    icon: "Heart",
    name: "Keepers",
    tierDescriptions: [
      "Mark 5 places you'd return to.",
      "Mark 15 places you'd return to.",
      "Mark 30 places you'd return to.",
    ],
    measure: (_categories, places) => ({
      current: visitedPlaces(places).filter((p) => p.would_return === true).length,
      thresholds: [5, 15, 30],
    }),
  },
  {
    trackId: "perfect-dates",
    icon: "Sparkles",
    name: "Perfect Dates",
    tierDescriptions: [
      "Land 1 place you both rated 4.5+.",
      "Land 3 places you both rated 4.5+.",
      "Land 7 places you both rated 4.5+.",
    ],
    measure: (_categories, places) => ({
      current: visitedPlaces(places).filter(
        (p) =>
          p.rating_him !== null && p.rating_her !== null && p.rating_him >= 4.5 && p.rating_her >= 4.5
      ).length,
      thresholds: [1, 3, 7],
    }),
  },
];

const TIERS: AchievementTier[] = ["bronze", "silver", "gold"];

export const computeAchievements = (
  categories: CafeCategory[],
  places: CafePlace[]
): AchievementTierProgress[] => {
  const result: AchievementTierProgress[] = [];
  for (const track of TRACKS) {
    const { current, thresholds } = track.measure(categories, places);
    TIERS.forEach((tier, index) => {
      const threshold = thresholds[index];
      result.push({
        id: `${track.trackId}-${tier}`,
        trackId: track.trackId,
        tier,
        title: `${track.name} ${["I", "II", "III"][index]}`,
        description: track.tierDescriptions[index],
        icon: track.icon,
        current,
        threshold,
        unlocked: threshold > 0 && current >= threshold,
      });
    });
  }
  return result;
};
