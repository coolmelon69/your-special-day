import type { WrappedHeadingTemplate, WrappedTemplateCopy } from "@/types/admin";
import { WRAPPED_TEMPLATE_DEFAULTS } from "@/components/wrapped/copy";

/** Replaces `{token}` placeholders in `str` with values from `tokens`. */
export const applyTokens = (str: string, tokens: Record<string, string>): string =>
  str.replace(/\{(\w+)\}/g, (match, key) => tokens[key] ?? match);

/** Applies tokens to all three parts of a heading template. */
export const applyHeadingTokens = (
  heading: WrappedHeadingTemplate,
  tokens: Record<string, string>,
): WrappedHeadingTemplate => ({
  before: applyTokens(heading.before, tokens),
  emphasis: applyTokens(heading.emphasis, tokens),
  after: applyTokens(heading.after, tokens),
});

const isBlankHeading = (heading: WrappedHeadingTemplate | undefined): boolean =>
  !heading || (!heading.before && !heading.emphasis && !heading.after);

/**
 * Merges admin-saved template copy over the defaults, field by field, so a
 * blank string (never edited, or explicitly cleared) always falls back to
 * the default copy instead of rendering empty.
 */
export const mergeWrappedTemplateCopy = (
  saved: Partial<WrappedTemplateCopy> | null | undefined,
): WrappedTemplateCopy => {
  const d = WRAPPED_TEMPLATE_DEFAULTS;
  if (!saved) return d;

  const heading = (
    savedHeading: WrappedHeadingTemplate | undefined,
    fallback: WrappedHeadingTemplate,
  ): WrappedHeadingTemplate => (isBlankHeading(savedHeading) ? fallback : savedHeading!);

  return {
    intro: {
      eyebrow: saved.intro?.eyebrow || d.intro.eyebrow,
      heading: heading(saved.intro?.heading, d.intro.heading),
      hint: saved.intro?.hint || d.intro.hint,
      mockHint: saved.intro?.mockHint || d.intro.mockHint,
    },
    numbers: {
      eyebrow: saved.numbers?.eyebrow || d.numbers.eyebrow,
      heading: heading(saved.numbers?.heading, d.numbers.heading),
      statLabels: {
        stamps: saved.numbers?.statLabels?.stamps || d.numbers.statLabels.stamps,
        photos: saved.numbers?.statLabels?.photos || d.numbers.statLabels.photos,
        coupons: saved.numbers?.statLabels?.coupons || d.numbers.statLabels.coupons,
        distance: saved.numbers?.statLabels?.distance || d.numbers.statLabels.distance,
      },
    },
    time: {
      eyebrow: saved.time?.eyebrow || d.time.eyebrow,
      heading: heading(saved.time?.heading, d.time.heading),
      firstStampLabel: saved.time?.firstStampLabel || d.time.firstStampLabel,
      lastStampLabel: saved.time?.lastStampLabel || d.time.lastStampLabel,
      longestGapLabel: saved.time?.longestGapLabel || d.time.longestGapLabel,
    },
    route: {
      eyebrow: saved.route?.eyebrow || d.route.eyebrow,
      heading: heading(saved.route?.heading, d.route.heading),
      checkpointsLabel: saved.route?.checkpointsLabel || d.route.checkpointsLabel,
    },
    topMoment: {
      eyebrow: saved.topMoment?.eyebrow || d.topMoment.eyebrow,
      heading: heading(saved.topMoment?.heading, d.topMoment.heading),
      photosLabel: saved.topMoment?.photosLabel || d.topMoment.photosLabel,
      caption: saved.topMoment?.caption || d.topMoment.caption,
    },
    photoStats: {
      eyebrow: saved.photoStats?.eyebrow || d.photoStats.eyebrow,
      heading: heading(saved.photoStats?.heading, d.photoStats.heading),
      photosLabel: saved.photoStats?.photosLabel || d.photoStats.photosLabel,
      stickersLabel: saved.photoStats?.stickersLabel || d.photoStats.stickersLabel,
      filterLabel: saved.photoStats?.filterLabel || d.photoStats.filterLabel,
    },
    gallery: {
      eyebrow: saved.gallery?.eyebrow || d.gallery.eyebrow,
      heading: heading(saved.gallery?.heading, d.gallery.heading),
      caption: saved.gallery?.caption || d.gallery.caption,
    },
    receipt: {
      title: saved.receipt?.title || d.receipt.title,
      subtitle: saved.receipt?.subtitle || d.receipt.subtitle,
      photosLabel: saved.receipt?.photosLabel || d.receipt.photosLabel,
      stickersLabel: saved.receipt?.stickersLabel || d.receipt.stickersLabel,
      distanceLabel: saved.receipt?.distanceLabel || d.receipt.distanceLabel,
      timeOutLabel: saved.receipt?.timeOutLabel || d.receipt.timeOutLabel,
      totalLabel: saved.receipt?.totalLabel || d.receipt.totalLabel,
      totalValue: saved.receipt?.totalValue || d.receipt.totalValue,
      footer: saved.receipt?.footer || d.receipt.footer,
    },
    updatedAt: saved.updatedAt ?? d.updatedAt,
  };
};
