import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Heart } from 'lucide-react';
import { Eyebrow, DisplayHeading } from '@/components/editorial';

const WrappedTeaserCard = () => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  return (
    <motion.section
      className="py-12 md:py-20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="container px-6">
        <motion.div
          onClick={() => navigate('/wrapped')}
          className="group relative grid md:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-3xl border border-rose/40 bg-card shadow-romantic cursor-pointer"
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.3 }}
        >
          {/* soft romantic wash */}
          <div className="absolute inset-0 bg-gradient-romantic opacity-60 pointer-events-none" />

          {/* Text side */}
          <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center">
            <Eyebrow no="2025">Year in Review</Eyebrow>
            <DisplayHeading as="h2" className="mt-4">
              Your year, <em>wrapped</em>
              <span className="dot-accent">.</span>
            </DisplayHeading>
            <p className="text-lg text-muted-foreground max-w-[44ch] mt-5">
              Eleven little chapters of us — the turning point, the day it got official,
              the days we've counted, and a promise or two. Press play.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <span className="inline-flex items-center gap-2 rounded-[10px] border border-rose bg-rose px-5 py-3 font-medium text-white transition-all group-hover:brightness-95">
                <Play className="w-4 h-4 fill-white" /> Play your Wrapped
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                11 chapters · ~1 min
              </span>
            </div>
          </div>

          {/* Visual side */}
          <div className="relative z-10 min-h-[220px] md:min-h-0 p-6 md:p-8 flex items-center justify-center">
            <div className="relative w-full max-w-[260px] aspect-[4/5]">
              {/* story progress motif */}
              <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
                {[100, 60, 0, 0].map((w, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full rounded-full bg-rose" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>

              <span className="dotgrid -bottom-4 -right-4 z-0" />
              <div className="w-full h-full rounded-2xl overflow-hidden border border-border bg-lilac-light grid place-items-center shadow-romantic">
                {!imageError ? (
                  <img
                    src="/images/gallery/heart-anime.gif"
                    alt="A peek at your Wrapped"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Heart className="w-16 h-16 text-rose/40" />
                )}
              </div>
              <div className="figure-cap justify-center">A year of us</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default WrappedTeaserCard;
