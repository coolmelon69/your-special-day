import { useMemo } from "react";
import { useAdventure } from "@/contexts/AdventureContext";
import { computeWrappedStats } from "@/utils/wrappedStats";
import type { WrappedStats } from "@/types/wrapped";

/**
 * The single point where /wrapped touches app data. Slides receive the result
 * as props and never read context themselves, which keeps each slide
 * independently viewable and safe to restyle.
 *
 * ItineraryItem and Photo satisfy StampLike and PhotoLike structurally, so
 * they pass through without a cast.
 */
export const useWrappedStats = (redeemedCount = 0): WrappedStats => {
  const { itineraryState, photos } = useAdventure();

  return useMemo(
    () => computeWrappedStats(itineraryState, photos, redeemedCount),
    [itineraryState, photos, redeemedCount],
  );
};
