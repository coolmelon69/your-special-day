import type { CafeCategory, CafePlace } from "@/types/cafes";

export interface CafeStats {
  visitedCount: number;
  totalCount: number;
  completionPct: number;
  avgRatingHim: number | null;
  avgRatingHer: number | null;
  topCategory: { name: string; icon: string | null } | null;
}

const average = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

/** Category with the most visited places. Ties break by sort_order. */
const findTopCategory = (
  categories: CafeCategory[],
  visited: CafePlace[]
): CafeStats["topCategory"] => {
  const counts = new Map<string, number>();
  for (const place of visited) {
    counts.set(place.category_id, (counts.get(place.category_id) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  const ranked = [...categories]
    .filter((category) => (counts.get(category.id) ?? 0) > 0)
    .sort((a, b) => {
      const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.sort_order - b.sort_order;
    });

  const top = ranked[0];
  return top ? { name: top.name, icon: top.icon } : null;
};

export const computeCafeStats = (
  categories: CafeCategory[],
  places: CafePlace[]
): CafeStats => {
  const visited = places.filter((place) => place.status === "visited");

  return {
    visitedCount: visited.length,
    totalCount: places.length,
    completionPct:
      places.length === 0 ? 0 : Math.round((visited.length / places.length) * 100),
    avgRatingHim: average(
      visited
        .map((place) => place.rating_him)
        .filter((rating): rating is number => rating !== null)
    ),
    avgRatingHer: average(
      visited
        .map((place) => place.rating_her)
        .filter((rating): rating is number => rating !== null)
    ),
    topCategory: findTopCategory(categories, visited),
  };
};
