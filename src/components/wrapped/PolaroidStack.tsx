import { motion, useReducedMotion } from "framer-motion";

interface PolaroidStackProps {
  /** Oldest first. The last one lands on top of the pile. */
  srcs: string[];
  alt: string;
}

/**
 * Hand-placed rather than random, so the pile is identical on every replay
 * and no two prints ever cover each other completely. Slots are consumed
 * from the END of this table: the last one is centred and nearly upright, so
 * a single photo reads as a deliberate print rather than a stray corner.
 */
const SLOTS = [
  { left: "2%", top: "3%", rotate: -11 },
  { left: "54%", top: "0%", rotate: 9 },
  { left: "6%", top: "27%", rotate: 6 },
  { left: "50%", top: "24%", rotate: -7 },
  { left: "22%", top: "12%", rotate: -3 },
  { left: "29%", top: "20%", rotate: 2 },
];

/** Snappy at the start, long settle — paper falling, not a UI transition. */
const SETTLE = [0.16, 1, 0.3, 1] as const;

/**
 * The photos from one checkpoint, dropped onto the page as a loose pile of
 * prints. Sized in percentages of its own box so it scales with the slide.
 */
const PolaroidStack = ({ srcs, alt }: PolaroidStackProps) => {
  const reduceMotion = useReducedMotion();
  const shown = srcs.slice(0, SLOTS.length);
  const slots = SLOTS.slice(SLOTS.length - shown.length);

  return (
    <div className="relative w-full aspect-[4/3]">
      {shown.map((src, i) => {
        const { left, top, rotate } = slots[i];
        return (
          <motion.figure
            key={`${src}-${i}`}
            className="absolute w-[38%] rounded-[3px] bg-card p-[3.5%] pb-[11%]"
            style={{
              left,
              top,
              zIndex: i + 1,
              // Offset and blur, so each print sits above the one behind it.
              boxShadow:
                "0 1px 1px hsl(var(--foreground) / 0.10), 0 14px 26px -14px hsl(272 40% 30% / 0.45)",
            }}
            initial={
              reduceMotion
                ? { opacity: 0, rotate }
                : { opacity: 0, y: "-14%", scale: 1.05, rotate: rotate - 7 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotate }}
            transition={{
              duration: reduceMotion ? 0.3 : 0.7,
              delay: reduceMotion ? 0 : i * 0.11,
              ease: reduceMotion ? "easeOut" : SETTLE,
            }}
          >
            <img
              src={src}
              alt={`${alt} — ${i + 1} of ${shown.length}`}
              loading="lazy"
              decoding="async"
              className="w-full aspect-square object-cover rounded-[1px] bg-muted"
            />
          </motion.figure>
        );
      })}
    </div>
  );
};

export default PolaroidStack;
