import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { MOCK_DATA } from "../slideData";
import WrappedSlide from "../WrappedSlide";

const TopMonthSlide = () => {
  return (
    <WrappedSlide tone="lavender" dotGrid>
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 07">Peak era</Eyebrow>
        </div>

        <DisplayHeading className="mt-5">
          <em>{MOCK_DATA.topMonth}</em> was our <strong>peak era</strong>
          <span className="dot-accent">.</span>
        </DisplayHeading>

        <p className="text-lg text-muted-foreground max-w-[42ch] mt-5 mx-auto">
          The month we were most unbearably us — and we wouldn't change a thing.
        </p>

        <motion.div
          className="inline-flex items-center gap-3 mt-9 rounded-2xl border border-rose/40 bg-card px-6 py-4 shadow-romantic"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Flame className="w-6 h-6 text-rose" />
          <div className="text-left">
            <div className="font-serif font-bold text-foreground text-3xl leading-none">
              {MOCK_DATA.longestStreak}
              <span className="font-mono text-sm text-muted-foreground ml-1.5 align-middle">days</span>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground mt-1">
              Longest streak together
            </p>
          </div>
        </motion.div>
      </motion.div>
    </WrappedSlide>
  );
};

export default TopMonthSlide;
