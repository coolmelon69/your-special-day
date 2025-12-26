// Admin authentication utilities

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
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ timestamp: Date.now() })
      );
      return true;
    }
  }
  return false;
};

// Logout
export const logout = (): void => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    sessionStorage.removeItem(SESSION_KEY);
  }
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




