import { motion } from 'framer-motion';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

const TheTurningPointSlide = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-muted/50 to-background">
      {/* Image Side - Map Style */}
      <motion.div
        className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative w-full max-w-md h-full max-h-md rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20">
          {!imageError ? (
            <img
              src="/images/gallery/emart.webp"
              alt="Emart IOI Connezion"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <MapPin className="w-24 h-24 text-primary/40" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Text Side */}
      <motion.div
        className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col items-center justify-center p-4 md:p-8 text-center md:text-left"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h2
          className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground/90"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          The spot where everything changed.
        </motion.h2>

        <motion.p
          className="font-serif text-lg sm:text-xl md:text-2xl text-foreground/80 mb-6 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          We talked about our feelings here for the first time.
        </motion.p>

        <motion.div
          className="inline-block px-4 py-2 bg-primary/10 rounded-full border border-primary/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="font-sans text-sm sm:text-base md:text-lg text-foreground/70 italic">
            Emart IOI Connezion
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TheTurningPointSlide;


