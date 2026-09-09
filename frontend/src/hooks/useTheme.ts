import { useEffect } from 'react';
import { useAppStore } from '../state/useAppStore';

/**
 * Syncs the Zustand theme state to the `data-theme` attribute on <html>.
 * Call this once at the App root level.
 */
export function useTheme() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}
