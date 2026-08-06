/**
 * Rotation math for the spinning medal in the achievements detail overlay.
 * Kept free of React so it can be exercised by `medalRotation.check.ts`.
 */

/** Horizontal drag is geared down: a full 180° flip takes ~300px of travel. */
export const DEGREES_PER_PIXEL = 0.6;

/** How much of the release velocity carries into the spin, in seconds of coast. */
export const MOMENTUM_SECONDS = 0.22;

/** Drag distance (px) to the rotation it adds, relative to where the drag started. */
export const degreesFromDrag = (offsetX: number): number => offsetX * DEGREES_PER_PIXEL;

/**
 * Where a flick lands before snapping: current rotation plus the distance the
 * release velocity (px/s) would coast through.
 */
export const projectRelease = (currentDegrees: number, velocityX: number): number =>
  currentDegrees + degreesFromDrag(velocityX) * MOMENTUM_SECONDS;

/**
 * Nearest face to settle on. Faces sit every 180° — front at even multiples,
 * back at odd ones. Returning the absolute angle rather than a 0–360 modulo is
 * deliberate: 350° snaps to 360°, so the medal finishes its turn instead of
 * unwinding the long way back to 0°.
 */
export const snapTarget = (degrees: number): number => {
  const target = Math.round(degrees / 180) * 180;
  return target === 0 ? 0 : target; // normalizes -0, which reads oddly in tests and logs
};

/** True when the back face is the one pointing at the viewer. */
export const isShowingBack = (degrees: number): boolean =>
  Math.abs(Math.round(degrees / 180)) % 2 === 1;
