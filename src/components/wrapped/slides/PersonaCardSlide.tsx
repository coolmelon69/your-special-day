import { motion } from 'framer-motion';
import { MOCK_DATA } from '../slideData';

const PersonaCardSlide = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-2xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 border-4 border-primary/30 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(340 65% 65%) 0%, hsl(143 30% 65%) 100%)',
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
          {MOCK_DATA.persona.traits.map((trait, index) => (
            <motion.div
              key={trait.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-base sm:text-lg md:text-xl font-medium text-foreground">
                  {trait.name}
                </span>
                <span className="font-sans text-base sm:text-lg md:text-xl font-bold text-primary">
                  {trait.value}%
                </span>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(trait.value, 100)}%` }}
                  transition={{ duration: 1, delay: 0.6 + index * 0.1, ease: 'easeOut' }}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </motion.div>
          ))}
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
      </motion.div>
    </div>
  );
};

export default PersonaCardSlide;
