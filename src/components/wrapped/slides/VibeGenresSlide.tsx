import { motion } from "framer-motion";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { MOCK_DATA } from "../slideData";
import WrappedSlide from "../WrappedSlide";

// On-palette pill styles that preserve the original casing of each genre.
const pillStyles = [
  "bg-rose/15 text-rose border border-rose/30",
  "bg-primary/10 text-primary border border-primary/20",
  "bg-card text-muted-foreground border border-border",
];

const VibeGenresSlide = () => {
  return (
    <WrappedSlide tone="lavender">
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 08">Your aura</Eyebrow>
        </div>

        <DisplayHeading as="h2" className="mt-4">
          The <em>vibe</em> you two give off
          <span className="dot-accent">.</span>
        </DisplayHeading>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-9">
          {MOCK_DATA.genres.map((genre, index) => (
            <motion.span
              key={genre}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-sm ${
                pillStyles[index % pillStyles.length]
              }`}
              initial={{ opacity: 0, scale: 0.8, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 + index * 0.08 }}
            >
              {genre}
            </motion.span>
          ))}
        </div>

        <motion.p
          className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground mt-9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          — Your relationship aura, bottled
        </motion.p>
      </motion.div>
    </WrappedSlide>
  );
};

export default VibeGenresSlide;
