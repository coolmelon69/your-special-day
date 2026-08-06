import { useEffect, useState } from "react";
import { getAllCustomWrappedSlides, saveCustomWrappedSlidesToIndexedDB } from "@/utils/adminStorage";
import { loadCustomWrappedSlides } from "@/utils/supabaseSync";
import { getCurrentUser } from "@/utils/auth";
import type { CustomWrappedSlide } from "@/types/admin";

/**
 * Loads admin-authored custom slides for /wrapped: IndexedDB first for an
 * instant list, then a non-blocking Supabase refresh, matching the pattern
 * StampsManager/CouponsManager use for custom stamps and coupons.
 */
export const useCustomWrappedSlides = (): CustomWrappedSlide[] => {
  const [slides, setSlides] = useState<CustomWrappedSlide[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const local = await getAllCustomWrappedSlides();
      if (!cancelled) setSlides(local);

      const user = await getCurrentUser();
      if (!user) return;

      try {
        const remote = await loadCustomWrappedSlides();
        await saveCustomWrappedSlidesToIndexedDB(remote);
        if (!cancelled) setSlides(remote);
      } catch (error) {
        console.warn("Background sync of custom wrapped slides failed:", error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return slides;
};
