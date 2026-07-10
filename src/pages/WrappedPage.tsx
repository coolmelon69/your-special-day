import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { StatBlock, DisplayHeading, Eyebrow } from '@/components/editorial';

const SLIDES = [
  {
    id: 'intro',
    content: (
      <div className="flex flex-col items-center text-center justify-center h-full px-6 max-w-2xl mx-auto">
        <Eyebrow no="Nº 01" className="mb-6">Year in Review · 2025</Eyebrow>
        <DisplayHeading className="mb-6">
          Ready to review <br /> <em>our 2025</em>?
        </DisplayHeading>
        <p className="font-mono text-[13px] uppercase tracking-[0.12em] text-muted-foreground mt-4">
          Tap right to turn the page
        </p>
      </div>
    )
  },
  {
    id: 'stats',
    content: (
      <div className="flex flex-col h-full justify-center px-6 max-w-2xl mx-auto w-full space-y-12">
        <DisplayHeading className="mb-8 text-left">
          The numbers are <em>in</em>.
        </DisplayHeading>
        <div className="grid grid-cols-2 gap-8 w-full">
          <StatBlock value="1,245" label="Total Memories" />
          <StatBlock value="340" unit="hrs" label="Most Time Spent" />
        </div>
      </div>
    )
  },
  {
    id: 'top-month',
    content: (
      <div className="flex flex-col h-full justify-center px-6 max-w-2xl mx-auto w-full">
        <Eyebrow className="mb-4 text-left">Your Top Month</Eyebrow>
        <DisplayHeading className="mb-12 text-left">
          December was <em>magical</em>.
        </DisplayHeading>
        <StatBlock value="5" unit="days" label="Longest continuous date streak" />
      </div>
    )
  },
  {
    id: 'end',
    content: (
      <div className="flex flex-col items-center text-center h-full justify-center px-6 max-w-2xl mx-auto">
        <DisplayHeading className="mb-6">
          Here's to another <br /> <em>beautiful</em> year.
        </DisplayHeading>
        <p className="text-muted-foreground mt-4 text-lg">Happy anniversary.</p>
      </div>
    )
  }
];

const WrappedPage = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const audio = new Audio('/music/glue.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audioRef.current = audio;
        })
        .catch((error) => {
          console.log('Audio autoplay prevented:', error);
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    navigate('/');
  }, [navigate]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    let clientX = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent<HTMLDivElement>).clientX;
    }
    
    const width = window.innerWidth;
    
    if (clientX > width / 2) {
      if (currentSlide < SLIDES.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        handleClose();
      }
    } else {
      if (currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
      }
    }
  }, [currentSlide, handleClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentSlide > 0) {
          setCurrentSlide(prev => prev - 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentSlide < SLIDES.length - 1) {
          setCurrentSlide(prev => prev + 1);
        } else {
          handleClose();
        }
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, handleClose]);

  return (
    <>
      <Helmet>
        <title>Your 2025 Wrapped - Your Special Day</title>
      </Helmet>
      
      <div 
        className="fixed inset-0 z-[100] bg-gradient-hero bg-background overflow-hidden"
        onClick={handleTap}
        onTouchEnd={handleTap}
      >
        <motion.button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="absolute top-5 right-3 sm:top-6 sm:right-4 z-[101] w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-full border border-border text-muted-foreground shadow-sm hover:text-foreground hover:border-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </motion.button>

        <div className="absolute top-4 left-4 right-16 z-[101] flex gap-2">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className="h-1 flex-1 bg-foreground/20 rounded-full overflow-hidden"
            >
              <div 
                className={`h-full bg-foreground transition-all duration-300 ${idx <= currentSlide ? 'w-full' : 'w-0'}`} 
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {SLIDES[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default WrappedPage;
