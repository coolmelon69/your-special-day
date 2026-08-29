import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DisplayHeading, Eyebrow } from "@/components/editorial";
import type { WrappedStats } from "@/types/wrapped";
import type { WrappedTemplateCopy } from "@/types/admin";
import { applyHeadingTokens, applyTokens } from "@/utils/wrappedTemplate";

interface GallerySlideProps {
  stats: WrappedStats;
  copy: WrappedTemplateCopy;
  /** The slide's own duration, so the drift finishes before it advances. */
  durationMs: number;
}

/** A beat to read the heading before the roll starts moving, and one to land. */
const LEAD_IN_MS = 700;
const LEAD_OUT_MS = 1100;

/**
 * The whole camera roll as one contact sheet, drifting slowly upward for as
 * long as the slide holds. The drift distance is measured rather than
 * guessed, so it stops on the last photo instead of scrolling into blank
 * space — and stays at zero when the sheet already fits.
 */
const GallerySlide = ({ stats, copy, durationMs }: GallerySlideProps) => {
  const reduceMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [drift, setDrift] = useState(0);

  // Photos are data URLs that decode at their own pace, so the sheet keeps
  // growing after mount. Watch both boxes instead of measuring once.
  useEffect(() => {
    const viewport = viewportRef.current;
    const sheet = sheetRef.current;
    if (!viewport || !sheet) return;

    const measure = () =>
      setDrift(Math.max(0, sheet.scrollHeight - viewport.clientHeight));

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [stats.galleryPhotos]);

  const tokens = {
    count: String(stats.galleryPhotos.length),
    total: String(stats.photosTaken),
  };
  const heading = applyHeadingTokens(copy.gallery.heading, tokens);
  const caption = applyTokens(copy.gallery.caption, tokens);
  const scrollMs = Math.max(0, durationMs - LEAD_IN_MS - LEAD_OUT_MS);

  return (
    // Unlike the centred slides, this one fills its height, so it has to
    // clear the shell's own chrome (progress bars, mute, close) itself.
    <div className="flex flex-col h-full px-6 pt-28 pb-10 max-w-2xl mx-auto w-full">
      <Eyebrow className="mb-4">{copy.gallery.eyebrow}</Eyebrow>
      <DisplayHeading as="h2" className="mb-6">
        {heading.before}
        <em>{heading.emphasis}</em>
        {heading.after}
      </DisplayHeading>

      <div
        ref={viewportRef}
        className={`relative flex-1 min-h-0 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-3 ${
          reduceMotion ? "overflow-y-auto" : "overflow-hidden"
        }`}
        style={
          // Softens the crop at both edges so the sheet reads as a strip
          // running past the frame rather than a grid chopped in half.
          reduceMotion
            ? undefined
            : {
                maskImage:
                  "linear-gradient(to bottom, transparent 0, #000 5%, #000 92%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0, #000 5%, #000 92%, transparent 100%)",
              }
        }
      >
        <motion.div
          ref={sheetRef}
          // Wider screens are shorter in proportion, so they get more columns
          // rather than fewer, taller rows.
          className="columns-3 md:columns-4 gap-2 [column-fill:_balance]"
          animate={reduceMotion ? undefined : { y: -drift }}
          transition={{ duration: scrollMs / 1000, delay: LEAD_IN_MS / 1000, ease: "linear" }}
        >
          {stats.galleryPhotos.map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt={`Photo ${i + 1} of ${stats.galleryPhotos.length}`}
              loading="lazy"
              decoding="async"
              className="w-full mb-2 break-inside-avoid rounded-[3px] border border-border bg-muted"
            />
          ))}
        </motion.div>
      </div>

      <div className="figure-cap">{caption}</div>
    </div>
  );
};

export default GallerySlide;
