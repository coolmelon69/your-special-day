import { motion } from 'framer-motion';

const IntroSlide = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Animated gradient blob background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-60"
          style={{
            background: 'linear-gradient(135deg, hsl(340 65% 92%) 0%, hsl(30 50% 95%) 50%, hsl(143 30% 85%) 100%)',
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 50, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-50"
          style={{
            background: 'linear-gradient(225deg, hsl(143 30% 85%) 0%, hsl(340 65% 92%) 50%, hsl(30 50% 95%) 100%)',
            top: '20%',
            right: '10%',
          }}
          animate={{
            x: [0, -80, 60, 0],
            y: [0, 100, -40, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, hsl(340 65% 65%) 0%, hsl(143 30% 65%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Your 2025 Wrapped
        </motion.h1>
        <motion.p
          className="font-serif text-lg sm:text-xl md:text-2xl text-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          A year of memories together
        </motion.p>
      </motion.div>
    </div>
  );
};

export default IntroSlide;




