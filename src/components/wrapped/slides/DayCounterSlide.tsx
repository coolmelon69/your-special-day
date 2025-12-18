import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import CountUp from 'react-countup';

const RELATIONSHIP_START = "2025-11-19";

const DayCounterSlide = () => {
  const daysTogether = differenceInDays(new Date(), new Date(RELATIONSHIP_START));

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Deep romantic background */}
      <div className="absolute inset-0 bg-[#8B1538]" />
      
      {/* Content */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="font-sans text-xs sm:text-sm md:text-base uppercase tracking-widest text-white/90">
            WE HAVE BEEN TOGETHER FOR
          </p>
        </motion.div>

        {/* Main Number */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="font-sans text-9xl font-bold text-white">
            <CountUp
              start={0}
              end={daysTogether}
              duration={3}
              separator=","
            />
          </div>
        </motion.div>

        {/* Unit Label */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="font-sans text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            DAYS
          </p>
        </motion.div>

        {/* Footer Caption */}
        <motion.p
          className="font-serif text-lg sm:text-xl md:text-2xl text-white/90 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          And it's just the beginning.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default DayCounterSlide;
