import { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronDown } from "lucide-react";
import {
  sideConfetti,
  heartRain,
  ambientSparkles,
} from "../utils/particles";

const HeroSection = () => {
  useEffect(() => {
    // Enhanced side confetti effect
    sideConfetti({
      duration: 3000,
      particleCount: 3,
    });

    // Heart rain background effect
    setTimeout(() => {
      heartRain({
        duration: 8000,
        heartCount: 25,
      });
    }, 500);

    // Ambient sparkles for subtle background effect
    setTimeout(() => {
      ambientSparkles({
        duration: 15000,
        sparkleCount: 12,
      });
    }, 1000);
  }, []);

  const scrollToNext = () => {
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Floating hearts background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20"
            initial={{ y: "100vh", x: `${15 + i * 15}%` }}
            animate={{ y: "-100vh" }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
          >
            <Heart size={30 + i * 10} fill="currentColor" />
          </motion.div>
        ))}
      </div>

      {/* Floating Melody and Kuromi characters */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Melody - floats from left side */}
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "10%" }}
          animate={{ y: "-100vh", x: ["10%", "15%", "10%"] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            delay: 2,
            ease: "linear",
          }}
        >
          <img 
            src="/images/gallery/melody.png" 
            alt="Melody" 
            className="w-16 h-16 md:w-20 md:h-20 opacity-80"
            style={{ imageRendering: "auto" }}
          />
        </motion.div>

        {/* Kuromi - floats from right side */}
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "85%" }}
          animate={{ y: "-100vh", x: ["85%", "80%", "85%"] }}
          transition={{
            duration: 14,
            repeat: Infinity,
            delay: 4,
            ease: "linear",
          }}
        >
          <img 
            src="/images/gallery/kuromi.png" 
            alt="Kuromi" 
            className="w-16 h-16 md:w-20 md:h-20 opacity-80"
            style={{ imageRendering: "auto" }}
          />
        </motion.div>

        {/* Additional Melody - slower, different path */}
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "25%" }}
          animate={{ y: "-100vh", x: ["25%", "30%", "25%"] }}
          transition={{
            duration: 16,
            repeat: Infinity,
            delay: 6,
            ease: "linear",
          }}
        >
          <img 
            src="/images/gallery/melody.png" 
            alt="Melody" 
            className="w-12 h-12 md:w-16 md:h-16 opacity-70"
            style={{ imageRendering: "auto" }}
          />
        </motion.div>

        {/* Additional Kuromi - slower, different path */}
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "70%" }}
          animate={{ y: "-100vh", x: ["70%", "65%", "70%"] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            delay: 8,
            ease: "linear",
          }}
        >
          <img 
            src="/images/gallery/kuromi.png" 
            alt="Kuromi" 
            className="w-12 h-12 md:w-16 md:h-16 opacity-70"
            style={{ imageRendering: "auto" }}
          />
        </motion.div>
      </div>

      <div className="container px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
            src="/images/gallery/cat_1.png" 
            alt="I love you" 
            className="mx-auto mb-6 object-contain"
            style={{ width: '350px', height: '350px' }}
          />
        </motion.div>

        <motion.h1
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-gradient-romantic"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Happy Birthday,
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          A special birthday gift for you special day
        </motion.p>

        <motion.button
          onClick={scrollToNext}
          className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg shadow-romantic hover:shadow-glow transition-all duration-300 hover:scale-105"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Start the Day
          <ChevronDown className="group-hover:translate-y-1 transition-transform" size={20} />
        </motion.button>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="text-muted-foreground" size={28} />
      </motion.div>
    </section>
  );
};

export default HeroSection;