import { motion } from 'framer-motion';
import { useState } from 'react';

const WhereItStartedSlide = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image with Ken Burns Effect */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.1] }}
        transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      >
        {!imageError ? (
          <img
            src="/images/gallery/first-date-placeholder.jpg"
            alt="First Date"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/40" />
        )}
      </motion.div>

      {/* Photo Collage Overlay - 3-4 placeholder images */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Collage images arranged artistically - Larger sizes */}
        <motion.div
          className="absolute top-8 right-8 w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white/50"
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="w-full h-full bg-primary/30 flex items-center justify-center">
            <span className="text-white/50 text-sm sm:text-base">Photo 1</span>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-32 right-32 sm:top-40 sm:right-40 md:top-48 md:right-48 w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-lg overflow-hidden shadow-lg border-2 border-white/50"
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
            <span className="text-white/50 text-sm sm:text-base">Photo 2</span>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-8 sm:bottom-40 sm:left-12 md:bottom-48 md:left-16 w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white/50"
          initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="w-full h-full bg-primary/30 flex items-center justify-center">
            <span className="text-white/50 text-sm sm:text-base">Photo 3</span>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-1/4 w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-lg overflow-hidden shadow-lg border-2 border-white/50"
          initial={{ opacity: 0, scale: 0.8, rotate: 3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
            <span className="text-white/50 text-sm sm:text-base">Photo 4</span>
          </div>
        </motion.div>
      </div>

      {/* Dark Gradient Overlay at Bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Text Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 md:p-12">
        {/* Title - Top Center */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="font-sans text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest text-white/90">
            THE FIRST DATE
          </h2>
        </motion.div>

        {/* Date and Caption - Bottom Left */}
        <motion.div
          className="text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.p
            className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            May 20, 2020
          </motion.p>
          <motion.p
            className="font-serif text-lg sm:text-xl md:text-2xl text-white/90 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Little did we know...
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default WhereItStartedSlide;




