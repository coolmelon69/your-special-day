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
  const timeRemaining = Math.ceil((slideDuration * (1 - progress)) / 1000);

  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      {/* Progress bars — editorial light theme */}
      <div className="flex gap-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
        {Array.from({ length: TOTAL_SLIDES }).map((_, index) => {
          const isActive = index === currentSlide;
          const isPast = index < currentSlide;

          return (
            <div
              key={index}
              className="relative flex-1 h-1 rounded-full overflow-hidden bg-foreground/10"
            >
              <motion.div
                className="h-full rounded-full bg-rose"
                initial={{ width: isPast ? '100%' : '0%' }}
                animate={{ width: isActive ? `${progress * 100}%` : isPast ? '100%' : '0%' }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          );
        })}
      </div>

      {/* Pause / play + countdown — editorial pill */}
      <div className="absolute top-6 left-3 sm:top-7 sm:left-4">
        <motion.div
          className="flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 cursor-pointer hover:bg-card transition-colors shadow-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={onTogglePause}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            {isPaused ? (
              <Play className="w-3 h-3 text-rose fill-rose" />
            ) : (
              <Pause className="w-3 h-3 text-rose fill-rose" />
            )}
          </motion.div>

          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-muted-foreground' : 'bg-rose'}`}
            animate={{ opacity: isPaused ? [1, 0.4, 1] : 1, scale: isPaused ? 1 : [1, 1.25, 1] }}
            transition={{ duration: isPaused ? 1.5 : 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <span className="font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums">
            {timeRemaining}s
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressBars;
