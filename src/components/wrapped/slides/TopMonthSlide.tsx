import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { MOCK_DATA } from '../slideData';

const TopMonthSlide = () => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="mb-8"
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Calendar className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto text-primary" />
        </motion.div>

        <motion.h2
          className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6"
          style={{
            background: 'linear-gradient(135deg, hsl(340 65% 65%) 0%, hsl(143 30% 65%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {MOCK_DATA.topMonth}
        </motion.h2>

        <motion.p
          className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {MOCK_DATA.topMonth} was our peak era.
        </motion.p>

        <motion.div
          className="inline-block px-6 py-3 bg-primary/10 rounded-full border-2 border-primary/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="font-sans text-base sm:text-lg md:text-xl text-foreground">
            Longest Streak: <span className="font-bold text-primary">{MOCK_DATA.longestStreak} Days</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TopMonthSlide;



