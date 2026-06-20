import { motion } from "framer-motion";
import { useState } from "react";
import { Eyebrow } from "@/components/editorial";
import WrappedSlide from "../WrappedSlide";
import { cn } from "@/lib/utils";

interface SnapshotProps {
  src: string;
  alt: string;
  className: string;
  rotate: number;
  delay: number;
}

/** A framed scrapbook photo with a soft card mat and graceful fallback. */
const Snapshot = ({ src, alt, className, rotate, delay }: SnapshotProps) => {
  const [error, setError] = useState(false);
  return (
    <motion.div
      className={cn(
        "absolute rounded-2xl border border-border bg-card p-1.5 shadow-romantic overflow-hidden",
        className
      )}
      initial={{ opacity: 0, scale: 0.85, rotate: rotate * 2 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      <div className="w-full h-full rounded-xl overflow-hidden bg-lilac-light grid place-items-center">
        {!error ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setError(true)} />
        ) : (
          <span className="font-serif italic text-3xl text-primary/30">us</span>
        )}
      </div>
    </motion.div>
  );
};

const WhereItStartedSlide = () => {
  return (
    <WrappedSlide tone="lavender" glyphs={false} bare>
      {/* scattered scrapbook */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Snapshot
          src="/images/gallery/cat.jpg"
          alt="A first-date moment"
          className="top-[8%] right-[8%] w-32 h-40 sm:w-44 sm:h-52 md:w-56 md:h-64"
          rotate={4}
          delay={0.3}
        />
        <Snapshot
          src="/images/gallery/mmm_cat.png"
          alt="A first-date moment"
          className="top-[30%] right-[26%] sm:right-[30%] w-28 h-32 sm:w-36 sm:h-44 md:w-44 md:h-52"
          rotate={-5}
          delay={0.5}
        />
        <Snapshot
          src="/images/gallery/mwehehe_cart.png"
          alt="A first-date moment"
          className="bottom-[24%] left-[7%] w-32 h-40 sm:w-44 sm:h-52 md:w-52 md:h-60"
          rotate={-3}
          delay={0.7}
        />
        <Snapshot
          src="/images/gallery/marhsal.png"
          alt="A first-date moment"
          className="top-[40%] left-[24%] w-24 h-28 sm:w-32 sm:h-36 md:w-40 md:h-44 hidden sm:block"
          rotate={5}
          delay={0.9}
        />
      </div>

      {/* editorial caption block */}
      <div className="relative z-20 h-full flex flex-col items-center justify-end pb-14 sm:pb-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-card/70 backdrop-blur-md border border-border rounded-2xl px-7 py-6 shadow-romantic"
        >
          <Eyebrow no="Nº 03" className="justify-center">
            The first date
          </Eyebrow>
          <p className="font-serif font-bold text-foreground text-5xl sm:text-6xl md:text-7xl tracking-tight leading-none mt-3">
            Nov 15<span className="dot-accent">,</span> 2025
          </p>
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground mt-4">
            The most random date — and the best one
          </p>
        </motion.div>
      </div>
    </WrappedSlide>
  );
};

export default WhereItStartedSlide;
