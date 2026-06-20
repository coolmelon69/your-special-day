import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import WrappedSlide from "../WrappedSlide";

const IntroSlide = () => {
  return (
    <WrappedSlide tone="lavender" dotGrid>
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 01">Year in Review · 2025</Eyebrow>
        </div>

        <DisplayHeading className="mt-6">
          A year of <em>us</em>, <strong>wrapped</strong>
          <span className="dot-accent">.</span>
        </DisplayHeading>

        <motion.p
          className="font-mono text-[13px] uppercase tracking-[0.12em] text-muted-foreground mt-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Eleven little chapters of you &amp; me
        </motion.p>

        <motion.div
          className="inline-flex items-center gap-2 mt-9 font-mono text-[11px] uppercase tracking-[0.14em] text-primary"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <span>Tap right to turn the page</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.span>
        </motion.div>
      </motion.div>
    </WrappedSlide>
  );
};

export default IntroSlide;
