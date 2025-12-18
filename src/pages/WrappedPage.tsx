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
          className="absolute top-4 right-4 z-[101] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full border-2 border-primary/30 shadow-lg hover:bg-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
        </motion.button>

        {/* Story container */}
        <StoryContainer />
      </div>
    </>
  );
};

export default WrappedPage;
