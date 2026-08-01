import type { CafePlace } from "@/types/cafes";

export interface RankedPlace {
  place: CafePlace;
  average: number | null;
  rank: number;
}

/**
 * Mean of whichever ratings exist. One rating still counts, so a place ranks
 * as soon as either of them has an opinion. Both missing is `null`.
 */
export const averageScore = (
  place: Pick<CafePlace, "rating_him" | "rating_her">
): number | null => {
  const scores = [place.rating_him, place.rating_her].filter(
    (score): score is number => score !== null && score !== undefined
  );
  if (scores.length === 0) return null;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
};

export const splitByStatus = (places: CafePlace[]) => ({
  visited: places.filter((place) => place.status === "visited"),
  wishlist: places.filter((place) => place.status === "wishlist"),
});

/**
 * Visited places, best first. Unrated ones sink to the bottom. Equal averages
 * break by earliest visit (the place you found first keeps the higher rank),
 * then by name so the order never wobbles between renders.
 */
export const rankPlaces = (places: CafePlace[]): RankedPlace[] => {
  const { visited } = splitByStatus(places);

  return visited
    .map((place) => ({ place, average: averageScore(place) }))
    .sort((a, b) => {
      if (a.average !== b.average) {
        if (a.average === null) return 1;
        if (b.average === null) return -1;
        return b.average - a.average;
      }
      const aDate = a.place.visited_on;
      const bDate = b.place.visited_on;
      if (aDate !== bDate) {
        if (aDate === null) return 1;
        if (bDate === null) return -1;
        return aDate < bDate ? -1 : 1;
      }
      return a.place.name.localeCompare(b.place.name);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Appends -2, -3, ... until the slug is free. Falls back when a name slugs to nothing. */
export const uniqueSlug = (name: string, existing: string[]): string => {
  const base = slugify(name) || "category";
  if (!existing.includes(base)) return base;
  let suffix = 2;
  while (existing.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};
