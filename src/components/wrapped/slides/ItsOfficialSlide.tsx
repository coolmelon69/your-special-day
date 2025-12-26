import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { celebrationConfetti } from '@/utils/particles';

const ItsOfficialSlide = () => {
  useEffect(() => {
    // Trigger confetti explosion when slide becomes active
    celebrationConfetti({
      particleCount: 200,
      origin: { x: 0.5, y: 0.5 },
    });
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4 overflow-hidden">
      {/* Vibrant Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(340 65% 65%) 0%, hsl(143 30% 65%) 50%, hsl(340 65% 75%) 100%)',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white drop-shadow-lg">
            Nov 19, 2025
          </h1>
        </motion.div>

        <motion.p
          className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/95 italic drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          The day we made it official.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ItsOfficialSlide;




