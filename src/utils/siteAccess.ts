/**
 * Whether the private pages are reachable — the one question the route gate
 * and the navigation bar have to answer the same way.
 *
 * Two independent switches open the site: the admin turning the site password
 * off (`siteLockEnabled === false`), or this session having unlocked it. The
 * nav used to read `isSiteUnlocked()` alone, so with the password switched off
 * the pages opened but the bar still collapsed to the single Cafés link.
 *
 * Deliberately free of imports so `siteAccess.check.ts` runs under plain node.
 */
export const hasSiteAccess = (
  siteLockEnabled: boolean,
  unlocked: boolean
): boolean => !siteLockEnabled || unlocked;
