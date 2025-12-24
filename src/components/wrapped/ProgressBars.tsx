import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { TOTAL_SLIDES, SLIDE_CONFIGS } from './slideData';

interface ProgressBarsProps {
  currentSlide: number;
  progress: number; // 0-1, progress within current slide
  isPaused: boolean;
  onTogglePause: (e: React.MouseEvent) => void;
}

const ProgressBars = ({ currentSlide, progress, isPaused, onTogglePause }: ProgressBarsProps) => {
  const slideDuration = SLIDE_CONFIGS[currentSlide].duration;
  const timeRemaining = Math.ceil((slideDuration * (1 - progress)) / 1000); // Convert to seconds

  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      {/* Progress bars - Instagram Stories style with adaptive contrast */}
      <div className="relative flex gap-1 px-2 pt-2 pb-1 sm:px-3 sm:pt-3 sm:pb-2">
        {/* Dark backdrop for better visibility on light backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-transparent pointer-events-none backdrop-blur-sm" />
        
        {Array.from({ length: TOTAL_SLIDES }).map((_, index) => {
          const isActive = index === currentSlide;
          const isPast = index < currentSlide;
          
          return (
            <div
              key={index}
              className="relative flex-1 h-1.5 sm:h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur-md border border-white/30 shadow-inner"
            >
              <motion.div
                className="h-full bg-white rounded-full"
                style={{
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                }}
                initial={{ width: isPast ? '100%' : '0%' }}
                animate={{
                  width: isActive ? `${progress * 100}%` : isPast ? '100%' : '0%',
                }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          );
        })}
      </div>

      {/* Countdown timer indicator with pause/play button */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[51]">
        <motion.div
          className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20 flex items-center gap-2 cursor-pointer hover:bg-black/60 transition-colors"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={onTogglePause}
        >
          {/* Pause/Play Icon */}
          <motion.div
            initial={false}
            animate={{ scale: isPaused ? 1 : 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPaused ? (
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white" />
            ) : (
              <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white" />
            )}
          </motion.div>
          
          {/* Status indicator dot */}
          <motion.div
            className={`w-2 h-2 rounded-full ${
              isPaused ? 'bg-yellow-400' : 'bg-white'
            }`}
            animate={{
              opacity: isPaused ? [1, 0.5, 1] : 1,
              scale: isPaused ? 1 : [1, 1.2, 1],
            }}
            transition={{
              duration: isPaused ? 1.5 : 2,
              repeat: isPaused ? Infinity : Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Time remaining */}
          <span className="font-sans text-xs sm:text-sm font-medium text-white">
            {timeRemaining}s
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressBars;



