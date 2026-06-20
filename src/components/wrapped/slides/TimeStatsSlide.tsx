import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import CountUp from "react-countup";
import { Clock } from "lucide-react";
import { Eyebrow, DisplayHeading, Pill } from "@/components/editorial";
import { RELATIONSHIP_START_DATE } from "../slideData";
import WrappedSlide from "../WrappedSlide";

const calculateMinutes = (): number => {
  const diffMs = Date.now() - RELATIONSHIP_START_DATE.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};

const TimeStatsSlide = () => {
  const [minutes, setMinutes] = useState(calculateMinutes);

  useEffect(() => {
    setMinutes(calculateMinutes());
    const interval = setInterval(() => setMinutes(calculateMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <WrappedSlide tone="lavender">
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 06">Time well spent</Eyebrow>
        </div>

        <div className="flex justify-center mt-6">
          <Pill variant="accent" icon={<Clock />}>
            and still counting
          </Pill>
        </div>

        <motion.div
          className="stat-num leading-[0.9] mt-5"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <CountUp start={0} end={minutes} duration={2.5} separator="," delay={0.4} />
        </motion.div>
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground mt-3">
          minutes spent together
        </p>

        <DisplayHeading as="h2" className="mt-7">
          And I loved <em>every</em> second
          <span className="dot-accent">.</span>
        </DisplayHeading>
      </motion.div>
    </WrappedSlide>
  );
};

export default TimeStatsSlide;
