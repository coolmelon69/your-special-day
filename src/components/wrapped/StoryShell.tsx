import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, X } from "lucide-react";
import ProgressBars from "./ProgressBars";

export interface Slide {
  id: string;
  /** How long this slide holds before auto-advancing, in milliseconds. */
  duration: number;
  render: () => React.ReactNode;
}

interface StoryShellProps {
  slides: Slide[];
  audioSrc?: string;
  onClose: () => void;
}

/** Press-and-hold beyond this many milliseconds pauses instead of navigating. */
const HOLD_THRESHOLD_MS = 200;

/**
 * Owns everything about playback: the timer, tap navigation, hold-to-pause,
 * keyboard shortcuts, audio, and the close button. Slides are pure render
 * functions and know nothing about any of it.
 */
const StoryShell = ({ slides, audioSrc, onClose }: StoryShellProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStarted = useRef(false);
  const holdTimer = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const close = useCallback(() => {
    stopAudio();
    onClose();
  }, [stopAudio, onClose]);

  const goNext = useCallback(() => {
    if (index >= slides.length - 1) {
      close();
      return;
    }
    setIndex(index + 1);
  }, [index, slides.length, close]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);

  /**
   * Browsers block autoplay without a user gesture, which is why the current
   * page is silent on mobile. Try on mount for the desktop case, and try
   * again on the first pointer down for everywhere else.
   */
  const startAudio = useCallback(() => {
    if (audioStarted.current || !audioSrc) return;
    audioStarted.current = true;

    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Blocked. The next pointer down retries.
      audioStarted.current = false;
    });
    audioRef.current = audio;
  }, [audioSrc]);

  useEffect(() => {
    startAudio();
    return stopAudio;
  }, [startAudio, stopAudio]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const isButton = (target: EventTarget | null) =>
    target instanceof HTMLElement && target.closest("button") !== null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startAudio();
    if (isButton(event.target)) return;
    holdTimer.current = window.setTimeout(() => setPaused(true), HOLD_THRESHOLD_MS);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isButton(event.target)) return;

    if (holdTimer.current !== null) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    // A release after a hold resumes playback; it does not also navigate.
    if (paused) {
      setPaused(false);
      return;
    }

    if (event.clientX > window.innerWidth / 2) goNext();
    else goPrev();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, close]);

  useEffect(() => {
    return () => {
      if (holdTimer.current !== null) clearTimeout(holdTimer.current);
    };
  }, []);

  const slide = slides[index];

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-hero bg-background overflow-hidden touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <ProgressBars
        count={slides.length}
        index={index}
        duration={slide.duration}
        paused={paused}
        onComplete={goNext}
      />

      {audioSrc && (
        <motion.button
          onClick={() => setMuted((m) => !m)}
          className="absolute top-12 left-4 z-[101] w-11 h-11 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-full border border-border text-muted-foreground shadow-sm hover:text-foreground hover:border-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={muted ? "Unmute music" : "Mute music"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </motion.button>
      )}

      <motion.button
        onClick={close}
        className="absolute top-12 right-4 z-[101] w-11 h-11 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-full border border-border text-muted-foreground shadow-sm hover:text-foreground hover:border-foreground transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {slide.render()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StoryShell;
