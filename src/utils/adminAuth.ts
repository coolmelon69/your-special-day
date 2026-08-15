// Admin authentication utilities
//
// IMPORTANT: `ADMIN_PASSWORD` and the session it gates are a UI lock only —
// they keep the admin panel out of casual view, nothing more. Anyone
// authenticated with Supabase can call the admin RPCs directly from the
// browser console regardless of this password. The real enforcement lives
// server-side: every admin RPC (`grant_coins`, config writes, resets) opens
// with an `is_pair_owner()` guard in SQL and raises if the caller isn't the
// couple's owner. Do not treat anything in this file as a security boundary.

import { isPairOwner } from "@/utils/couples";

const ADMIN_PASSWORD = "admin123";
const SESSION_KEY = "admin-session";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return false;
  }

  const sessionData = sessionStorage.getItem(SESSION_KEY);
  if (!sessionData) {
    return false;
  }

  try {
    const { timestamp } = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session has expired
    if (now - timestamp > SESSION_TIMEOUT) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

// Login with password
export const login = (password: string): boolean => {
  if (password !== ADMIN_PASSWORD) {
    return false;
  }
  if (typeof window === "undefined" || !window.sessionStorage) {
    return false;
  }
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ timestamp: Date.now() })
    );
  } catch (error) {
    // Safari private mode throws on setItem. Report a failed login rather than
    // letting the exception escape the submit handler.
    console.error("Could not persist admin session:", error);
    return false;
  }
  return true;
};

/**
 * Composes the UI password gate with the real server-side check. Use this
 * wherever an admin action is actually about to run (as opposed to just
 * deciding whether to show the admin route) — `isAuthenticated()` alone only
 * tells you the password session is live, not that this account is the
 * couple's owner. The RPCs re-check `is_pair_owner()` themselves regardless,
 * so this is a UX convenience, not a substitute for that guard.
 */
export const isAdminSession = async (): Promise<boolean> =>
  isAuthenticated() && (await isPairOwner());

export const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * The pathname actually in the address bar.
 *
 * Deliberately NOT `useLocation()`. `<Routes location={location} key={...}>`
 * under `AnimatePresence mode="wait"` freezes the router location for the
 * outgoing route so it can finish its exit animation — meaning a page that is
 * mid-exit keeps reading its own stale pathname and can never tell that it has
 * already been navigated away from. `window.location` is updated synchronously
 * by `history.replaceState`, so it is the only honest answer here.
 */
export const currentPathname = (): string =>
  typeof window === "undefined" ? "" : window.location.pathname;

/**
 * Whether a guarded route should emit a redirect to the login page.
 *
 * Returns false once we are already sitting on the login path, even though the
 * guarded page is still rendering unauthenticated — it is mid-exit. React
 * Router's `<Navigate>` re-runs its effect on every render, so redirecting
 * again from there fires a `replaceState` per render until the browser throws
 * `SecurityError: Attempt to use history.replaceState() more than 100 times`.
 * Past that point every later navigation is rejected too, which is what made
 * a successful login stop redirecting to /admin.
 */
export const shouldRedirectToLogin = (
  pathname: string,
  authenticated: boolean
): boolean => !authenticated && pathname !== ADMIN_LOGIN_PATH;

// Logout
export const logout = (): void => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

// Site-wide lockscreen (separate session from admin, same password)
const SITE_LOCK_KEY = "site-lock-session";

export const isSiteUnlocked = (): boolean => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return false;
  }
  return sessionStorage.getItem(SITE_LOCK_KEY) === "true";
};

export const unlockSite = (password: string): boolean => {
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.setItem(SITE_LOCK_KEY, "true");
      return true;
    }
  }
  return false;
};

// Get session info
export const getSessionInfo = (): { timestamp: number } | null => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }

  const sessionData = sessionStorage.getItem(SESSION_KEY);
  if (!sessionData) {
    return null;
  }

  try {
    return JSON.parse(sessionData);
  } catch (error) {
    console.error("Error getting session info:", error);
    return null;
  }
};




