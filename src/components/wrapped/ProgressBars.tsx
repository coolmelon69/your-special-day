import { useEffect, useRef, useState } from "react";

interface ProgressBarsProps {
  count: number;
  index: number;
  /** Duration of the active slide, in milliseconds. */
  duration: number;
  paused: boolean;
  /** Called once when the active slide's time runs out. Must be stable. */
  onComplete: () => void;
}

/**
 * Segmented story progress bar. Owns the frame clock deliberately: elapsed
 * time changes every frame, and keeping that state here means the slide
 * content above does not re-render sixty times a second.
 */
const ProgressBars = ({ count, index, duration, paused, onComplete }: ProgressBarsProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [renderedIndex, setRenderedIndex] = useState(index);
  const firedFor = useRef(-1);

  // Reset during render, not in an effect. An effect would leave `elapsed`
  // holding the previous slide's value for one render, and the completion
  // effect below would read that stale value and advance a second time,
  // skipping a slide.
  if (renderedIndex !== index) {
    setRenderedIndex(index);
    setElapsed(0);
  }

  useEffect(() => {
    if (paused) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      setElapsed((previous) => previous + (now - last));
      last = now;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, index]);

  useEffect(() => {
    // Keyed to the index so one expiry fires exactly once per slide, even
    // though `onComplete` changes identity whenever the index does.
    if (firedFor.current !== index && elapsed >= duration) {
      firedFor.current = index;
      onComplete();
    }
  }, [elapsed, duration, index, onComplete]);

  return (
    <div className="absolute top-4 left-4 right-16 z-[101] flex gap-2">
      {Array.from({ length: count }, (_, i) => {
        const fill = i < index ? 1 : i > index ? 0 : Math.min(elapsed / duration, 1);
        return (
          <div key={i} className="h-1 flex-1 bg-foreground/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBars;
