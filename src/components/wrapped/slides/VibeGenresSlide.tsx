import { motion } from 'framer-motion';
import { MOCK_DATA } from '../slideData';

const VibeGenresSlide = () => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated Relationship Aura blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-40"
          style={{
            background: 'linear-gradient(135deg, hsl(340 65% 92%) 0%, hsl(30 50% 95%) 50%, hsl(143 30% 85%) 100%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 150, -100, 0],
            y: [0, -120, 80, 0],
            scale: [1, 1.3, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-30"
          style={{
            background: 'linear-gradient(225deg, hsl(143 30% 85%) 0%, hsl(340 65% 92%) 50%, hsl(30 50% 95%) 100%)',
            top: '20%',
            right: '10%',
          }}
          animate={{
            x: [0, -100, 70, 0],
            y: [0, 130, -60, 0],
            scale: [1, 0.7, 1.4, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.7,
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-foreground">
          The Vibe
        </h2>

        <div className="space-y-4 mb-8">
          {MOCK_DATA.genres.map((genre, index) => (
            <motion.div
              key={genre}
              className="inline-block mx-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border-2 border-primary/30 shadow-lg"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <p className="font-sans text-base sm:text-lg md:text-xl text-foreground font-medium">
                {genre}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="font-serif text-lg sm:text-xl md:text-2xl text-foreground/80 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          Your Relationship Aura
        </motion.p>
      </motion.div>
    </div>
  );
};

export default VibeGenresSlide;
