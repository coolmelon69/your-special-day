import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_RATING, MIN_RATING, RATING_STEP } from "@/types/cafes";

interface StarRatingProps {
  /** Shown as the mono caption to the left, e.g. "HIM". */
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}

const STAR_COUNT = 5;

/**
 * Half-step 1–5 star input. Each star is two hit zones: left half sets x.5,
 * right half sets x.0. Clicking the current value clears it back to null so a
 * mis-tap is recoverable. Keyboard: arrows step by 0.5, Home/End jump to the
 * ends, Backspace clears.
 */
const StarRating = ({ label, value, onChange, className }: StarRatingProps) => {
  const clamp = (next: number) => Math.min(MAX_RATING, Math.max(MIN_RATING, next));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = value ?? 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clamp(current + RATING_STEP));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(current <= MIN_RATING ? null : clamp(current - RATING_STEP));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(MIN_RATING);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(MAX_RATING);
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onChange(null);
    }
  };

  const select = (next: number) => onChange(value === next ? null : next);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`${label} rating`}
        aria-valuemin={MIN_RATING}
        aria-valuemax={MAX_RATING}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? "not rated" : `${value} out of ${MAX_RATING}`}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const full = index + 1;
          const half = full - 0.5;
          const filled = (value ?? 0) >= full;
          const halfFilled = !filled && (value ?? 0) >= half;

          return (
            <span key={full} className="relative inline-flex h-7 w-7 items-center justify-center">
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  filled || halfFilled ? "text-rose" : "text-muted-foreground/40"
                )}
                fill={filled ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
              {halfFilled && (
                <Star
                  className="pointer-events-none absolute left-1 h-5 w-5 text-rose [clip-path:inset(0_50%_0_0)]"
                  fill="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
              <button
                type="button"
                aria-label={`${label} ${half} stars`}
                onClick={() => select(half)}
                className="absolute inset-y-0 left-0 w-1/2"
              />
              <button
                type="button"
                aria-label={`${label} ${full} stars`}
                onClick={() => select(full)}
                className="absolute inset-y-0 right-0 w-1/2"
              />
            </span>
          );
        })}
      </div>

      <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-foreground">
        {value === null ? "—" : value.toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating;
