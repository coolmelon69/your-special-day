/** Tracks which achievement tiers have already had their unlock celebration shown on this device. */
const STORAGE_KEY = "cafe-achievements-seen";

export const getSeenAchievementIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
};

export const markAchievementIdsSeen = (ids: string[]): void => {
  if (typeof window === "undefined" || ids.length === 0) return;
  const seen = getSeenAchievementIds();
  ids.forEach((id) => seen.add(id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
};
