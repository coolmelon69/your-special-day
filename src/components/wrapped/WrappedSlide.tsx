import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "lavender" | "rose" | "plain";

const toneGradient: Record<Tone, string> = {
  lavender:
    "linear-gradient(160deg, hsl(var(--lilac-light)) 0%, hsl(var(--background)) 55%, hsl(var(--periwinkle-light)) 100%)",
  rose: "linear-gradient(160deg, hsl(var(--rose-light)) 0%, hsl(var(--background)) 58%, hsl(var(--lilac-light)) 100%)",
  plain: "hsl(var(--background))",
};

const GLYPHS = ["♡", "✦", "◌", "♡"];
const GLYPH_POS = [
  { top: "11%", left: "7%", size: "30px", delay: 0 },
  { top: "18%", right: "9%", size: "22px", delay: -2 },
  { bottom: "16%", left: "11%", size: "20px", delay: -4 },
  { bottom: "13%", right: "8%", size: "26px", delay: -1 },
];

interface BlobProps {
  color: string;
  className?: string;
  drift: { x: number[]; y: number[]; scale: number[] };
  duration: number;
  delay?: number;
}

const Blob = ({ color, className, drift, duration, delay = 0 }: BlobProps) => (
  <motion.div
    className={cn("absolute rounded-full pointer-events-none", className)}
    style={{ background: color, filter: "blur(110px)" }}
    animate={{ x: drift.x, y: drift.y, scale: drift.scale }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

interface WrappedSlideProps {
  children: React.ReactNode;
  /** Background mood. `rose` for celebration beats, `lavender` everywhere else. */
  tone?: Tone;
  /** Floating serif ♡/✦ glyphs (default on). */
  glyphs?: boolean;
  /** Decorative dotted-grid corners. */
  dotGrid?: boolean;
  className?: string;
  /** Override the centered content frame (e.g. for full-bleed photo slides). */
  bare?: boolean;
}

/**
 * Shared full-screen scaffold for every Wrapped slide. Gives a soft on-palette
 * lavender/rose canvas, drifting blurred blobs, optional floating glyphs and
 * dotgrid corners — the editorial backdrop the slide content sits on.
 */
const WrappedSlide = ({
  children,
  tone = "lavender",
  glyphs = true,
  dotGrid = false,
  className,
  bare = false,
}: WrappedSlideProps) => (
  <div className="relative w-full h-full overflow-hidden" style={{ background: toneGradient[tone] }}>
    {/* drifting blobs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <Blob
        color="hsl(var(--lilac) / 0.5)"
        className="w-[460px] h-[460px] -top-20 -left-16"
        drift={{ x: [0, 90, -40, 0], y: [0, -70, 50, 0], scale: [1, 1.18, 0.92, 1] }}
        duration={22}
      />
      <Blob
        color={tone === "rose" ? "hsl(var(--rose) / 0.34)" : "hsl(var(--periwinkle) / 0.4)"}
        className="w-[380px] h-[380px] top-1/3 -right-16"
        drift={{ x: [0, -80, 60, 0], y: [0, 90, -40, 0], scale: [1, 0.85, 1.25, 1] }}
        duration={18}
        delay={0.6}
      />
      <Blob
        color="hsl(var(--primary-light))"
        className="w-[320px] h-[320px] -bottom-20 left-1/3 opacity-70"
        drift={{ x: [0, 50, -60, 0], y: [0, -50, 40, 0], scale: [1, 1.1, 0.95, 1] }}
        duration={26}
        delay={1.2}
      />
    </div>

    {/* floating serif glyphs */}
    {glyphs && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {GLYPHS.map((g, i) => (
          <motion.span
            key={i}
            className="absolute font-serif text-primary/15"
            style={{ ...GLYPH_POS[i], fontSize: GLYPH_POS[i].size }}
            animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 6, repeat: Infinity, delay: GLYPH_POS[i].delay, ease: "easeInOut" }}
          >
            {g}
          </motion.span>
        ))}
      </div>
    )}

    {dotGrid && (
      <>
        <span className="dotgrid top-16 left-6 sm:left-10" />
        <span className="dotgrid bottom-10 right-6 sm:right-10" />
      </>
    )}

    {bare ? (
      children
    ) : (
      <div className={cn("relative z-10 h-full flex flex-col items-center justify-center px-6 text-center", className)}>
        {children}
      </div>
    )}
  </div>
);

export default WrappedSlide;
