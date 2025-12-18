import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { useState } from 'react';
import { MOCK_DATA } from '../slideData';

const TopSongsSlide = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      <motion.div
        className="text-center w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-foreground">
          The Soundtrack of Us
        </h2>

        {/* Music Player UI */}
        <motion.div
          className="bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-primary/30 shadow-xl mb-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Album Art */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            {!imageError ? (
              <img
                src="/images/gallery/glue.jpg"
                alt="Album Art"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Music className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white" />
            )}
          </div>

          {/* Song Info */}
          <div className="text-center">
            <p className="font-sans text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
              Glue song
            </p>
            <p className="font-serif text-sm sm:text-base md:text-lg text-foreground/70">
              Always on repeat
            </p>
          </div>
        </motion.div>

        <motion.div
          className="inline-block px-6 py-3 bg-primary/10 rounded-full border-2 border-primary/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="font-serif text-base sm:text-lg md:text-xl text-foreground italic">
            Most Quoted: <span className="font-bold text-primary">"{MOCK_DATA.mostQuoted}"</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TopSongsSlide;
