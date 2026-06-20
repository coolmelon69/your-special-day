import { motion } from "framer-motion";
import { Music, Quote } from "lucide-react";
import { useState } from "react";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { MOCK_DATA } from "../slideData";
import WrappedSlide from "../WrappedSlide";

const BAR_DELAYS = [0, 0.2, 0.4, 0.1, 0.3, 0.15, 0.35];

const Equalizer = () => (
  <div className="flex items-end justify-center gap-1 h-8">
    {BAR_DELAYS.map((delay, i) => (
      <motion.span
        key={i}
        className="w-1 rounded-full bg-rose"
        animate={{ height: ["20%", "100%", "35%", "80%", "20%"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay }}
        style={{ height: "20%" }}
      />
    ))}
  </div>
);

const TopSongsSlide = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <WrappedSlide tone="lavender">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 09">On repeat</Eyebrow>
        </div>

        <DisplayHeading as="h2" className="mt-4 mb-8">
          Our <em>soundtrack</em>
          <span className="dot-accent">.</span>
        </DisplayHeading>

        {/* Now-playing card */}
        <motion.div
          className="relative rounded-2xl border border-rose/40 bg-card p-5 shadow-romantic text-left"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="flex items-center gap-4">
            {/* Album art */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden border border-border bg-lilac-light grid place-items-center">
              {!imageError ? (
                <img
                  src="/images/gallery/glue.jpg"
                  alt="Album art"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Music className="w-10 h-10 text-primary/40" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose mb-1.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-rose animate-pulse" /> Now playing
              </p>
              <h3 className="font-serif font-bold text-foreground text-2xl leading-tight truncate">
                Glue Song
              </h3>
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mt-1">
                Always on repeat
              </p>
              <div className="mt-3">
                <Equalizer />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Most quoted */}
        <motion.div
          className="mt-5 rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-5 py-4 text-left"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
            <Quote className="w-3 h-3" /> Most quoted
          </p>
          <p className="font-serif italic text-rose text-lg sm:text-xl mt-1.5">
            "{MOCK_DATA.mostQuoted}"
          </p>
        </motion.div>
      </motion.div>
    </WrappedSlide>
  );
};

export default TopSongsSlide;
