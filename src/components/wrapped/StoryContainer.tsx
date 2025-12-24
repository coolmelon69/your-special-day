import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBars from './ProgressBars';
import IntroSlide from './slides/IntroSlide';
import TheTurningPointSlide from './slides/TheTurningPointSlide';
import WhereItStartedSlide from './slides/WhereItStartedSlide';
import ItsOfficialSlide from './slides/ItsOfficialSlide';
import DayCounterSlide from './slides/DayCounterSlide';
import TimeStatsSlide from './slides/TimeStatsSlide';
import TopMonthSlide from './slides/TopMonthSlide';
import VibeGenresSlide from './slides/VibeGenresSlide';
import TopSongsSlide from './slides/TopSongsSlide';
import PersonaCardSlide from './slides/PersonaCardSlide';
import NextYearPromiseSlide from './slides/NextYearPromiseSlide';
import { SLIDE_CONFIGS } from './slideData';

const SLIDE_COMPONENTS = [
  IntroSlide,
  TheTurningPointSlide,
  WhereItStartedSlide,
  ItsOfficialSlide,
  DayCounterSlide,
  TimeStatsSlide,
  TopMonthSlide,
  VibeGenresSlide,
  TopSongsSlide,
  PersonaCardSlide,
  NextYearPromiseSlide,
];

const StoryContainer = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Toggle manual pause/play
  const togglePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering navigation
    setIsManuallyPaused((prev) => !prev);
  }, []);

  const goToNext = useCallback(() => {
    if (currentSlide < SLIDE_COMPONENTS.length - 1) {
      setDirection('forward');
      setCurrentSlide((prev) => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [currentSlide]);

  const goToPrevious = useCallback(() => {
    if (currentSlide > 0) {
      setDirection('backward');
      setCurrentSlide((prev) => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [currentSlide]);

  // Handle tap navigation
  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      // For touch events, use the touch point; for mouse events, use clientX
      const x = 'touches' in e && e.touches.length > 0 
        ? e.touches[0].clientX 
        : 'changedTouches' in e && e.changedTouches.length > 0
        ? e.changedTouches[0].clientX
        : (e as React.MouseEvent<HTMLDivElement>).clientX;
      const tapPosition = (x - rect.left) / rect.width;

      if (tapPosition < 0.33) {
        goToPrevious();
      } else if (tapPosition > 0.67) {
        goToNext();
      }
    },
    [goToNext, goToPrevious]
  );

  // Auto-advance logic
  useEffect(() => {
    if (isManuallyPaused) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const slideDuration = SLIDE_CONFIGS[currentSlide].duration;
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = slideDuration - elapsed;

    // Update progress bar
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progressValue = Math.min(elapsed / slideDuration, 1);
      setProgress(progressValue);

      if (progressValue >= 1) {
        goToNext();
      }
    }, 50);

    // Auto-advance to next slide
    if (remaining > 0) {
      intervalRef.current = setTimeout(() => {
        goToNext();
      }, remaining);
    } else {
      goToNext();
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentSlide, isManuallyPaused, goToNext]);

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [currentSlide]);

  const CurrentSlideComponent = SLIDE_COMPONENTS[currentSlide];

  return (
    <div
      className="relative w-full h-full"
      onTouchEnd={handleTap}
      onClick={handleTap}
    >
      <ProgressBars 
        currentSlide={currentSlide} 
        progress={progress} 
        isPaused={isManuallyPaused}
        onTogglePause={togglePause}
      />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          initial={(dir) => ({ 
            opacity: 0, 
            x: dir === 'forward' ? 300 : -300 
          })}
          animate={{ opacity: 1, x: 0 }}
          exit={(dir) => ({ 
            opacity: 0, 
            x: dir === 'forward' ? -300 : 300 
          })}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <CurrentSlideComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StoryContainer;



