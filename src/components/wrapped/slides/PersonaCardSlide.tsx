import { motion } from 'framer-motion';
import { MOCK_DATA } from '../slideData';

const PersonaCardSlide = () => {
  const angryEmojis = ['😠', '😡', '🤬', '💢', '🔥', '⚡'];
  const loveEmojis = ['💕', '💖', '💗', '🥰', '💞'];
  const allEmojis = [...angryEmojis, ...loveEmojis];
  
  return (
    <div className="relative w-full h-full flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-2xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 border-4 border-primary/30 shadow-2xl relative overflow-visible"
        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Mixed emoji particles (angry + love) floating upward outside the card */}
        {[...Array(18)].map((_, i) => {
          const emoji = allEmojis[i % allEmojis.length];
          const isLoveEmoji = loveEmojis.includes(emoji);
          const startX = 5 + (i % 5) * 22; // Spread wider, including outside card edges
          const delay = i * 0.25;
          const duration = 4 + (i % 2) * 1;
          
          return (
            <motion.div
              key={`emoji-${i}`}
              className="absolute text-2xl sm:text-3xl md:text-4xl pointer-events-none"
              style={{
                left: `${startX}%`,
                bottom: '-15%',
                zIndex: 0,
                filter: isLoveEmoji ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))' : 'none',
              }}
              initial={{ 
                y: 0,
                opacity: 0,
                rotate: -15 + Math.random() * 30,
                scale: 0.5,
              }}
              animate={{
                y: ['0%', '-150%'],
                opacity: [0, 0.7, 0.8, 0.6, 0.3, 0],
                rotate: [-15 + Math.random() * 30, 15 + Math.random() * 30, -15 + Math.random() * 30],
                scale: [0.5, 1, 1.2, 1, 0.8],
                x: [0, (i % 2 === 0 ? -1 : 1) * 15, 0],
              }}
              transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeOut',
              }}
            >
              {emoji}
            </motion.div>
          );
        })}
        
        {/* Content wrapper with higher z-index */}
        <div className="relative z-10">
        <motion.h2
          className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(0 84% 60%) 0%, hsl(15 90% 55%) 30%, hsl(25 95% 50%) 60%, hsl(0 84% 60%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {MOCK_DATA.persona.title}
        </motion.h2>

        <div className="space-y-6">
          {MOCK_DATA.persona.traits.map((trait, index) => {
            const isOverflowed = trait.value > 100;
            const isRagebaiting = trait.name === 'Ragebaiting';
            const isLove = trait.name === "I love U's given";
            
            return (
              <motion.div
                key={trait.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-sans text-base sm:text-lg md:text-xl font-medium ${
                    isRagebaiting ? 'text-red-600' : 'text-foreground'
                  }`}>
                    {trait.name}
                  </span>
                  <span className={`font-sans text-base sm:text-lg md:text-xl font-bold ${
                    isRagebaiting ? 'text-red-600' : 'text-primary'
                  }`}>
                    {trait.name === "I love U's given" ? '33 times' : `${trait.value}%`}
                  </span>
                </div>
                <div className={`w-full h-4 bg-muted rounded-full ${
                  isOverflowed ? 'overflow-visible' : 'overflow-hidden'
                } relative`}>
                  {/* Base bar */}
                  <motion.div
                    className={`h-full rounded-full relative ${
                      isRagebaiting 
                        ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-700' 
                        : isLove
                        ? 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600'
                        : 'bg-gradient-to-r from-primary to-secondary'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(trait.value, 100)}%` }}
                    transition={{ duration: 1, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
                  >
                    {/* Love bar sparkles/hearts effect */}
                    {isLove && (
                      <>
                        {/* Floating hearts */}
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={`heart-${i}`}
                            className="absolute text-xs sm:text-sm"
                            style={{
                              left: `${20 + i * 30}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              zIndex: 5,
                            }}
                            animate={{
                              y: ['-50%', '-70%', '-50%'],
                              opacity: [0, 1, 0],
                              scale: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              delay: 1.5 + index * 0.1 + i * 0.3,
                              repeat: Infinity,
                              repeatDelay: 1.5,
                              ease: 'easeOut',
                            }}
                          >
                            💕
                          </motion.div>
                        ))}
                        
                        {/* Sparkle effect */}
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={`sparkle-${i}`}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                              left: `${15 + i * 20}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1.5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: 1.2 + index * 0.1 + i * 0.2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: 'easeOut',
                            }}
                          />
                        ))}
                      </>
                    )}
                  </motion.div>
                  
                  {/* Overflow effect for Ragebaiting */}
                  {isRagebaiting && isOverflowed && (
                    <>
                      {/* Premium smoky particles - multi-layered and realistic */}
                      {[...Array(8)].map((_, i) => {
                        const startPosition = 85 + (i % 5) * 3.5; // Spread across the end of the bar
                        const sizeVariation = 18 + (i % 3) * 6; // Vary sizes for realism
                        const blurAmount = 7 + (i % 2) * 2; // Vary blur for depth
                        return (
                          <motion.div
                            key={`smoke-${i}`}
                            className="absolute"
                            initial={{ 
                              left: `${startPosition}%`,
                              top: '50%',
                              opacity: 0,
                              scale: 0.3,
                              rotate: Math.random() * 360,
                            }}
                            animate={{
                              left: [
                                `${startPosition}%`, 
                                `${startPosition + (i % 2 === 0 ? -5 : 5) + Math.sin(i) * 2}%`, 
                                `${startPosition + (i % 2 === 0 ? -8 : 8) + Math.sin(i) * 3}%`
                              ],
                              top: [
                                '50%', 
                                `${50 - 18 - (i % 4) * 7}%`, 
                                `${50 - 35 - (i % 4) * 12}%`,
                                `${50 - 50 - (i % 4) * 15}%`
                              ],
                              opacity: [0, 0.8, 0.6, 0.4, 0.2, 0],
                              scale: [0.3, 1, 1.8, 2.5, 3.2, 4],
                              rotate: [Math.random() * 360, Math.random() * 360 + 180],
                            }}
                            transition={{
                              duration: 3.5 + (i % 2) * 0.5,
                              delay: 1.5 + index * 0.1 + (i * 0.1),
                              repeat: Infinity,
                              repeatDelay: 0.8,
                              ease: [0.4, 0, 0.2, 1], // Custom easing for natural flow
                            }}
                            style={{
                              transform: 'translate(-50%, -50%)',
                              width: `${sizeVariation}px`,
                              height: `${sizeVariation}px`,
                              background: `radial-gradient(ellipse at ${30 + (i % 3) * 20}% ${30 + (i % 2) * 20}%, 
                                rgba(40, 40, 40, 0.9) 0%, 
                                rgba(70, 70, 70, 0.6) 25%, 
                                rgba(100, 100, 100, 0.4) 50%, 
                                rgba(130, 130, 130, 0.2) 75%, 
                                transparent 100%)`,
                              filter: `blur(${blurAmount}px)`,
                              borderRadius: '50%',
                              boxShadow: `0 0 ${blurAmount * 2}px rgba(100, 100, 100, 0.3)`,
                            }}
                          />
                        );
                      })}
                      
                      {/* Premium larger smoke clouds with depth */}
                      {[...Array(3)].map((_, i) => {
                        const startPosition = 87 + i * 2.5;
                        const cloudSize = 35 + (i % 2) * 10;
                        return (
                          <motion.div
                            key={`cloud-${i}`}
                            className="absolute"
                            initial={{ 
                              left: `${startPosition}%`,
                              top: '50%',
                              opacity: 0,
                              scale: 0.2,
                              rotate: Math.random() * 360,
                            }}
                            animate={{
                              left: [
                                `${startPosition}%`, 
                                `${startPosition + (i % 2 === 0 ? -6 : 6) + Math.cos(i) * 3}%`, 
                                `${startPosition + (i % 2 === 0 ? -10 : 10) + Math.cos(i) * 5}%`
                              ],
                              top: [
                                '50%', 
                                `${50 - 25 - i * 5}%`, 
                                `${50 - 45 - i * 8}%`,
                                `${50 - 65 - i * 10}%`
                              ],
                              opacity: [0, 0.7, 0.5, 0.3, 0.15, 0],
                              scale: [0.2, 1.2, 2, 2.8, 3.5, 4.5],
                              rotate: [Math.random() * 360, Math.random() * 360 + 360],
                            }}
                            transition={{
                              duration: 4 + (i % 2) * 0.5,
                              delay: 1.8 + index * 0.1 + (i * 0.12),
                              repeat: Infinity,
                              repeatDelay: 1.2,
                              ease: [0.3, 0, 0.1, 1],
                            }}
                            style={{
                              transform: 'translate(-50%, -50%)',
                              width: `${cloudSize}px`,
                              height: `${cloudSize}px`,
                              background: `radial-gradient(ellipse at ${40 + (i % 3) * 15}% ${40 + (i % 2) * 15}%, 
                                rgba(30, 30, 30, 0.85) 0%, 
                                rgba(60, 60, 60, 0.5) 20%, 
                                rgba(90, 90, 90, 0.35) 40%, 
                                rgba(110, 110, 110, 0.25) 60%, 
                                rgba(130, 130, 130, 0.15) 80%, 
                                transparent 100%)`,
                              filter: `blur(${10 + (i % 2) * 2}px)`,
                              borderRadius: '50%',
                              boxShadow: `
                                0 0 ${15 + i * 2}px rgba(80, 80, 80, 0.4),
                                0 0 ${25 + i * 3}px rgba(100, 100, 100, 0.2),
                                inset 0 0 ${10 + i}px rgba(120, 120, 120, 0.1)
                              `,
                            }}
                          />
                        );
                      })}
                      
                      {/* Lava-like glowing embers mixed with smoke */}
                      {[...Array(4)].map((_, i) => {
                        const startPosition = 88 + (i % 4) * 3;
                        return (
                          <motion.div
                            key={`ember-${i}`}
                            className="absolute"
                            initial={{ 
                              left: `${startPosition}%`,
                              top: '50%',
                              opacity: 0,
                              scale: 0.4,
                            }}
                            animate={{
                              left: [
                                `${startPosition}%`, 
                                `${startPosition + (i % 2 === 0 ? -3 : 3)}%`, 
                                `${startPosition + (i % 2 === 0 ? -5 : 5)}%`
                              ],
                              top: [
                                '50%', 
                                `${50 - 12 - (i % 3) * 6}%`, 
                                `${50 - 25 - (i % 3) * 10}%`
                              ],
                              opacity: [0, 0.9, 0.7, 0.4, 0],
                              scale: [0.4, 1, 1.5, 2, 2.5],
                            }}
                            transition={{
                              duration: 2.5,
                              delay: 1.6 + index * 0.1 + (i * 0.08),
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: 'easeOut',
                            }}
                            style={{
                              transform: 'translate(-50%, -50%)',
                              width: '12px',
                              height: '12px',
                              background: `radial-gradient(circle, 
                                rgba(255, 100, 50, 0.8) 0%, 
                                rgba(200, 60, 30, 0.6) 40%, 
                                rgba(150, 40, 20, 0.4) 70%, 
                                transparent 100%)`,
                              filter: 'blur(3px)',
                              borderRadius: '50%',
                              boxShadow: `
                                0 0 8px rgba(255, 100, 50, 0.6),
                                0 0 12px rgba(200, 60, 30, 0.4),
                                0 0 16px rgba(150, 40, 20, 0.2)
                              `,
                            }}
                          />
                        );
                      })}
                      
                      {/* Premium lava explosion particles */}
                      {[...Array(4)].map((_, i) => {
                        const particleSize = 6 + (i % 3) * 2;
                        return (
                          <motion.div
                            key={`particle-${i}`}
                            className="absolute rounded-full"
                            initial={{ 
                              left: '100%',
                              top: '50%',
                              opacity: 0,
                              scale: 0,
                              rotate: 0,
                            }}
                            animate={{
                              left: `${100 + (i + 1) * 7 + Math.sin(i) * 3}%`,
                              top: [
                                '50%', 
                                `${50 + (i % 2 === 0 ? -1 : 1) * (25 + Math.cos(i) * 10)}%`, 
                                `${50 + (i % 2 === 0 ? -1 : 1) * (35 + Math.cos(i) * 15)}%`,
                                '50%'
                              ],
                              opacity: [0, 1, 0.8, 0.4, 0],
                              scale: [0, 1.2, 1.8, 2.2, 0],
                              rotate: [0, 180, 360],
                            }}
                            transition={{
                              duration: 2 + (i % 2) * 0.3,
                              delay: 1.8 + index * 0.1 + i * 0.08,
                              repeat: Infinity,
                              repeatDelay: 1.5,
                              ease: 'easeOut',
                            }}
                            style={{
                              transform: 'translate(-50%, -50%)',
                              width: `${particleSize}px`,
                              height: `${particleSize}px`,
                              background: `radial-gradient(circle, 
                                #ff6b35 0%, 
                                #f7931e 30%, 
                                #dc2626 60%, 
                                #991b1b 100%)`,
                              boxShadow: `
                                0 0 ${particleSize * 1.5}px rgba(255, 107, 53, 0.8),
                                0 0 ${particleSize * 2}px rgba(247, 147, 30, 0.6),
                                0 0 ${particleSize * 3}px rgba(220, 38, 38, 0.4),
                                inset 0 0 ${particleSize * 0.5}px rgba(255, 200, 100, 0.5)
                              `,
                              filter: 'blur(1px)',
                            }}
                          />
                        );
                      })}
                      
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: 'linear',
                        }}
                      />
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p className="font-serif text-sm sm:text-base md:text-lg text-foreground/70 italic">
            This is who you are together
          </p>
        </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonaCardSlide;




