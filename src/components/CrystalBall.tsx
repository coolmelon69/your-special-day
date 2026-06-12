import { motion } from "framer-motion";

// Decorative animated crystal ball: floating orb with inner sparkles,
// drifting mist, and an orbiting sparkle ring.
const CrystalBall = () => {
  return (
    <motion.div
      className="flex justify-center mb-12"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative">
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(circle, hsl(340 65% 75% / 0.4), transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Crystal Ball */}
        <motion.div
          className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden cursor-pointer"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(200, 150, 255, 0.2), rgba(150, 100, 255, 0.4), rgba(100, 50, 200, 0.6))",
            boxShadow: `
              inset 0 0 50px rgba(255, 255, 255, 0.3),
              inset -20px -20px 60px rgba(100, 50, 200, 0.4),
              0 0 80px hsl(340 65% 65% / 0.5),
              0 20px 60px rgba(0, 0, 0, 0.3)
            `,
          }}
        >
          {/* Inner shine */}
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 50%)",
            }}
          />

          {/* Sparkle particles inside the ball */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Mystical mist */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 20% 30%, rgba(200, 150, 255, 0.2), transparent 60%)",
                "radial-gradient(circle at 80% 70%, rgba(150, 100, 255, 0.2), transparent 60%)",
                "radial-gradient(circle at 20% 30%, rgba(200, 150, 255, 0.2), transparent 60%)",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Orbiting sparkle ring */}
        {[...Array(20)].map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 140 + Math.random() * 40;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${3 + Math.random() * 3}px`,
                height: `${3 + Math.random() * 3}px`,
                left: "50%",
                top: "50%",
                x,
                y,
              }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export default CrystalBall;
