import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  sideConfetti,
  ambientSparkles,
} from "../utils/particles";

const FLOAT_SYMBOLS = ["♡", "✦", "◌", "♡"];
const FLOAT_POSITIONS = [
  { top: "12%", left: "8%", size: "32px", delay: 0 },
  { top: "20%", right: "10%", size: "24px", delay: -2 },
  { bottom: "20%", left: "12%", size: "20px", delay: -4 },
  { bottom: "15%", right: "8%", size: "28px", delay: -1 },
];

const HeroSection = () => {
  const navigate = useNavigate();

  useEffect(() => {
    sideConfetti({ duration: 3000, particleCount: 3 });
    setTimeout(() => {
      ambientSparkles({ duration: 15000, sparkleCount: 12 });
    }, 1000);
  }, []);

  const scrollToNext = () => {
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Radial glow at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.12), transparent)",
        }}
      />

      {/* Elegant floating symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {FLOAT_SYMBOLS.map((sym, i) => (
          <motion.span
            key={i}
            className="absolute font-serif text-primary/10"
            style={{ ...FLOAT_POSITIONS[i], fontSize: FLOAT_POSITIONS[i].size }}
            animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: FLOAT_POSITIONS[i].delay,
              ease: "easeInOut",
            }}
          >
            {sym}
          </motion.span>
        ))}
      </div>

      {/* Floating cat characters */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "10%" }}
          animate={{ y: "-100vh", x: ["10%", "15%", "10%"] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2, ease: "linear" }}
        >
          <img src="/images/gallery/mmm_cat.png" alt="Cat" className="w-16 h-16 md:w-20 md:h-20 opacity-70" />
        </motion.div>
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "85%" }}
          animate={{ y: "-100vh", x: ["85%", "80%", "85%"] }}
          transition={{ duration: 14, repeat: Infinity, delay: 4, ease: "linear" }}
        >
          <img src="/images/gallery/mwehehe_cart.png" alt="Cat" className="w-16 h-16 md:w-20 md:h-20 opacity-70" />
        </motion.div>
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "25%" }}
          animate={{ y: "-100vh", x: ["25%", "30%", "25%"] }}
          transition={{ duration: 16, repeat: Infinity, delay: 6, ease: "linear" }}
        >
          <img src="/images/gallery/mmm_cat.png" alt="Cat" className="w-12 h-12 md:w-16 md:h-16 opacity-60" />
        </motion.div>
        <motion.div
          className="absolute"
          initial={{ y: "100vh", x: "70%" }}
          animate={{ y: "-100vh", x: ["70%", "65%", "70%"] }}
          transition={{ duration: 18, repeat: Infinity, delay: 8, ease: "linear" }}
        >
          <img src="/images/gallery/mwehehe_cart.png" alt="Cat" className="w-12 h-12 md:w-16 md:h-16 opacity-60" />
        </motion.div>
      </div>

      <div className="container px-6 text-center relative z-10">
        {/* Eyebrow */}
        <motion.p
          className="font-mono-caption text-primary/70 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.0 }}
        >
          a gift made with love
        </motion.p>

        {/* Cat image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          <img
            src="/images/gallery/heart-anime.gif"
            alt="I love you"
            className="mx-auto mb-6 object-contain"
            style={{ width: "280px", height: "280px" }}
          />
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight mb-3 text-foreground"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Happy Birthday,
        </motion.h1>

        {/* Script accent line */}
        <motion.span
          className="block font-script text-gradient-romantic mb-6"
          style={{ fontSize: "clamp(2.75rem, 7.5vw, 5rem)", lineHeight: 1.15 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          my love ♡
        </motion.span>

        {/* Subtitle */}
        <motion.p
          className="font-sans font-light text-lg md:text-xl text-muted-foreground mb-10 max-w-sm mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          A special day, a special place — every memory we've made, gathered here just for you.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.button
            onClick={scrollToNext}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-sans font-medium text-base shadow-romantic hover:shadow-glow transition-all duration-300"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Start the Day <span className="text-lg">→</span>
          </motion.button>

          <motion.button
            onClick={() => navigate("/memory-book")}
            className="inline-flex items-center gap-2 px-7 py-4 bg-card text-primary border border-border rounded-full font-sans font-medium text-base transition-all duration-300 hover:border-primary hover:bg-accent"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Memory Book
          </motion.button>
        </motion.div>
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