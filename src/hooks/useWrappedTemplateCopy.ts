import { useEffect, useState } from "react";
import { getWrappedTemplateCopy } from "@/utils/adminStorage";
import { WRAPPED_TEMPLATE_DEFAULTS } from "@/components/wrapped/copy";
import type { WrappedTemplateCopy } from "@/types/admin";

/**
 * Loads admin-edited copy for the built-in /wrapped slides: IndexedDB
 * first for an instant render, then a non-blocking Supabase refresh.
 * Matches the pattern useCustomWrappedSlides uses for custom slides.
 */
export const useWrappedTemplateCopy = (): WrappedTemplateCopy => {
  const [copy, setCopy] = useState<WrappedTemplateCopy>(WRAPPED_TEMPLATE_DEFAULTS);

  useEffect(() => {
    let cancelled = false;

    getWrappedTemplateCopy().then((loaded) => {
      if (!cancelled) setCopy(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return copy;
};
