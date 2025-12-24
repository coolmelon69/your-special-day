import { motion } from 'framer-motion';
import { differenceInMinutes } from 'date-fns';
import { RELATIONSHIP_START_DATE } from '../slideData';
import CountUp from 'react-countup';

const TimeStatsSlide = () => {
  const minutesSpentTogether = differenceInMinutes(new Date(), RELATIONSHIP_START_DATE);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-foreground">
          Minutes Spent Together
        </h2>
        
        <div className="mb-8">
          <motion.div
            className="font-sans text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(340 65% 65%) 0%, hsl(143 30% 65%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <CountUp
              start={0}
              end={minutesSpentTogether}
              duration={2.5}
              separator=","
              delay={0.5}
            />
          </motion.div>
        </div>

        <motion.p
          className="font-serif text-lg sm:text-xl md:text-2xl text-foreground/80 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          And I loved every second of it.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default TimeStatsSlide;


