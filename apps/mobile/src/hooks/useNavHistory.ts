import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NAV_HISTORY_KEY = 'amplee_nav_history';

export const getNavHistory = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const addToNavHistory = (path: string) => {
  const history = getNavHistory();
  // Only add if different from last entry (avoid duplicates from re-renders)
  if (history[history.length - 1] !== path) {
    history.push(path);
    // Keep last 20 entries to prevent unbounded growth
    if (history.length > 20) history.shift();
    sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
  }
};

/**
 * Hook to track navigation history and provide smart back navigation.
 * Automatically records each page visit to sessionStorage.
 *
 * @returns goBack - Function that navigates back, optionally skipping certain paths
 */
export function useNavHistory() {
  const location = useLocation();

  // Track navigation history
  useEffect(() => {
    addToNavHistory(location.pathname);
  }, [location.pathname]);

  return { getNavHistory };
}

/**
 * Calculate how many steps to go back, skipping paths that match the skip pattern.
 * @param skipPattern - String to match against paths to skip (e.g., '/settings')
 * @returns Number of steps to go back (1 if no skipping needed, 2+ if skipping)
 */
export function getBackSteps(skipPattern: string): number {
  const history = getNavHistory();
  const prevPath = history.length >= 2 ? history[history.length - 2] : null;

  return prevPath?.includes(skipPattern) ? 2 : 1;
}
