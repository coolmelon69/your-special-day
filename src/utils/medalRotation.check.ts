/**
 * Self-check for the medal rotation math.
 *   node src/utils/medalRotation.check.ts
 */
import assert from "node:assert/strict";
import {
  DEGREES_PER_PIXEL,
  degreesFromDrag,
  isShowingBack,
  projectRelease,
  snapTarget,
} from "./medalRotation.ts";

// Drag maps linearly, and half a flip costs a reasonable thumb's worth of travel.
assert.equal(degreesFromDrag(100), 100 * DEGREES_PER_PIXEL);
assert.equal(degreesFromDrag(-100), -100 * DEGREES_PER_PIXEL);
assert.ok(
  Math.abs(180 / DEGREES_PER_PIXEL - 300) < 50,
  "a 180° flip should take roughly 300px of drag"
);

// A nudge that doesn't clear halfway falls back to the face it came from.
assert.equal(snapTarget(0), 0);
assert.equal(snapTarget(40), 0);
assert.equal(snapTarget(-40), 0);

// Past halfway it commits to the next face.
assert.equal(snapTarget(95), 180);
assert.equal(snapTarget(-95), -180);
assert.equal(snapTarget(140), 180);

// Wrap-around takes the short way: 350° finishes the turn at 360° rather than
// unwinding all the way back to 0°.
assert.equal(snapTarget(350), 360);
assert.equal(snapTarget(370), 360);
assert.equal(snapTarget(-350), -360);

// Momentum carried through several faces still lands on a face.
const flicked = projectRelease(90, 4000);
assert.ok(flicked > 500, "a hard flick should coast well past the next face");
assert.equal(Math.abs(snapTarget(flicked) % 180), 0);
assert.equal(Math.abs(snapTarget(projectRelease(0, -4000)) % 180), 0);
assert.ok(projectRelease(0, -4000) < -500, "flicking the other way coasts the other way");

// A release with no velocity is just a snap of where you let go.
assert.equal(projectRelease(120, 0), 120);
assert.equal(snapTarget(projectRelease(120, 0)), 180);

// Odd faces show the engraved back, even faces show the metal front.
assert.equal(isShowingBack(0), false);
assert.equal(isShowingBack(180), true);
assert.equal(isShowingBack(-180), true);
assert.equal(isShowingBack(360), false);
assert.equal(isShowingBack(170), true, "past halfway the back is already facing you");

console.log("medalRotation.check.ts — all assertions passed");
