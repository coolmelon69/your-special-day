import { motion } from "framer-motion";
import { differenceInDays, format } from "date-fns";
import CountUp from "react-countup";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { RELATIONSHIP_START_DATE } from "../slideData";
import WrappedSlide from "../WrappedSlide";

const DayCounterSlide = () => {
  const daysTogether = differenceInDays(new Date(), RELATIONSHIP_START_DATE);

  return (
    <WrappedSlide tone="lavender" dotGrid>
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 05">By the numbers</Eyebrow>
        </div>

        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground mt-6">
          We have been together for
        </p>

        <motion.div
          className="stat-num leading-[0.9] mt-2"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <CountUp start={0} end={daysTogether} duration={3} separator="," />
          <span className="text-[0.32em] align-top text-rose ml-2 font-mono uppercase tracking-wide">
            days
          </span>
        </motion.div>

        <DisplayHeading as="h2" className="mt-6">
          And it's <em>just</em> the beginning
          <span className="dot-accent">.</span>
        </DisplayHeading>

        <motion.p
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground mt-6 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <span className="inline-block w-7 h-px bg-muted-foreground" />
          since {format(RELATIONSHIP_START_DATE, "MMM d, yyyy")}
        </motion.p>
      </motion.div>
    </WrappedSlide>
  );
};

export default DayCounterSlide;
