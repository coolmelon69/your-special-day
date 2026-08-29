/**
 * Self-check for the site-access rule. No test framework:
 *   node src/utils/siteAccess.check.ts
 * Node strips the TypeScript types natively.
 */
import assert from "node:assert/strict";
import { hasSiteAccess } from "./siteAccess.ts";

// Password on: only an unlocked session gets in.
assert.equal(hasSiteAccess(true, false), false);
assert.equal(hasSiteAccess(true, true), true);

// The regression: with the site password switched off, every visitor is in —
// whether or not they ever typed a password this session. This is the case the
// nav bar got wrong, showing only Cafés when the whole site was open.
assert.equal(hasSiteAccess(false, false), true);
assert.equal(hasSiteAccess(false, true), true);

console.log("siteAccess.check.ts: all assertions passed");
