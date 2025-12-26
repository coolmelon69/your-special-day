import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const WrappedTeaserCard = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/wrapped');
  };

  return (
    <motion.section
      className="py-12 md:py-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="container px-6">
        <motion.div
          onClick={handleClick}
          className="relative bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl p-8 md:p-12 cursor-pointer overflow-hidden shadow-xl border-4 border-primary/30"
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-4 right-4">
            <Sparkles className="text-white/30" size={32} />
          </div>
          <div className="absolute bottom-4 left-4">
            <Sparkles className="text-white/20" size={24} />
          </div>

          {/* Animated background blob */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(135deg, hsl(340 65% 92%) 0%, hsl(30 50% 95%) 50%, hsl(143 30% 85%) 100%)',
            }}
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -40, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Content */}
          <div className="relative z-10 text-center">
            <motion.h2
              className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Your Year in Review is ready.
            </motion.h2>
            <motion.p
              className="font-serif text-lg sm:text-xl md:text-2xl text-white/90 mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Discover your relationship recap
            </motion.p>
            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span className="font-sans text-base sm:text-lg">View Wrapped</span>
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default WrappedTeaserCard;




