// src/hooks/useViewport.ts
import { useEffect, useState } from 'react';

/*
 * Single source of truth for the mobile breakpoint.
 *
 * intro.ts's isMobileViewport() imports this too — keeping both mobile
 * checks locked to the same number prevents the camera/dialogue logic
 * from disagreeing about what counts as "mobile" at a given width.
 */
export const MOBILE_BREAKPOINT = 640;

function computeIsMobile(breakpoint: number): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth <= breakpoint;
}

export function useViewport(breakpoint: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() =>
    computeIsMobile(breakpoint),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const handleChange = () => {
      setIsMobile(computeIsMobile(breakpoint));
    };

    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Safari < 14 fallback (addListener/removeListener are deprecated
    // but still needed for older WebKit).
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [breakpoint]);

  return { isMobile };
}