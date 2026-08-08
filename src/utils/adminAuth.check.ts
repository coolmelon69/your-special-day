/**
 * Self-check for the admin route guard. No test framework:
 *   node src/utils/adminAuth.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import { ADMIN_LOGIN_PATH, shouldRedirectToLogin } from "./adminAuth.ts";

// Authenticated visitors are never redirected.
assert.equal(shouldRedirectToLogin("/admin", true), false);
assert.equal(shouldRedirectToLogin(ADMIN_LOGIN_PATH, true), false);

// An unauthenticated visitor on a guarded path gets exactly one redirect.
assert.equal(shouldRedirectToLogin("/admin", false), true);

// The regression: AnimatePresence keeps the guarded page mounted after the URL
// has already become the login path. Redirecting again here is what looped
// replaceState until the browser threw SecurityError.
assert.equal(shouldRedirectToLogin(ADMIN_LOGIN_PATH, false), false);

// Simulate the loop: feed the guard's own redirect target back to it and make
// sure it settles instead of emitting redirects forever.
let pathname = "/admin";
let redirects = 0;
for (let render = 0; render < 200; render += 1) {
  if (!shouldRedirectToLogin(pathname, false)) break;
  redirects += 1;
  pathname = ADMIN_LOGIN_PATH;
}
assert.equal(redirects, 1, `guard emitted ${redirects} redirects, expected 1`);

console.log("adminAuth.check.ts: all assertions passed");
