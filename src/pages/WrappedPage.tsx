import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import StoryContainer from '@/components/wrapped/StoryContainer';

const WrappedPage = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element and auto-play when page opens
    const audio = new Audio('/music/glue.mp3');
    audio.loop = true;
    audio.volume = 0.5; // Set volume to 50%
    
    // Attempt to play (may require user interaction on some browsers)
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio started playing
          audioRef.current = audio;
        })
        .catch((error) => {
          // Auto-play was prevented, user interaction required
          console.log('Audio autoplay prevented:', error);
          // Audio will play when user interacts with the page
        });
    }

    // Cleanup: pause and remove audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    // Stop music when closing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Your 2025 Wrapped - Your Special Day</title>
      </Helmet>
      <div className="fixed inset-0 z-[100] bg-background overflow-hidden">
        {/* Close button */}
        <motion.button
          onClick={handleClose}
          className="absolute top-5 right-3 sm:top-6 sm:right-4 z-[101] w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-full border border-border text-muted-foreground shadow-sm hover:text-foreground hover:border-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </motion.button>

        {/* Story container */}
        <StoryContainer />
      </div>
    </>
  );
};

export default WrappedPage;




