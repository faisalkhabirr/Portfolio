import { useEffect, type RefObject } from 'react';
import type Lenis from 'lenis';

/**
 * Creates the illusion of an infinitely looping vertical list.
 *
 * Requires the caller to render the SAME list content three times in a row
 * (prev / current / next), each exactly `singleHeightRef.current` tall.
 * On mount, scroll is set to exactly one list-height down (landing in the
 * "current" copy, with a full copy of buffer above and below). Whenever
 * the user scrolls far enough to land fully in the "prev" or "next" copy,
 * this hook silently jumps the scroll position back by one list-height in
 * the opposite direction using an immediate (non-animated) Lenis
 * `scrollTo` — landing on the pixel-identical row in the "current" copy,
 * invisible to the user since the content is identical at that offset.
 *
 * `singleHeightRef` must be kept up to date by the caller (e.g. via
 * ResizeObserver on the middle copy) before this hook can do anything —
 * it does nothing until the height is a positive number.
 */
export function useInfiniteScrollLoop(
  lenisRef: RefObject<Lenis | null>,
  singleHeightRef: RefObject<number>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const lenis = lenisRef.current;
    if (!lenis) return;

    let initialized = false;

    const tryInit = () => {
      const height = singleHeightRef.current;
      if (!initialized && height > 0) {
        lenis.scrollTo(height, { immediate: true });
        initialized = true;
      }
    };

    // Height may not be measured yet on the same tick this hook mounts —
    // poll a few animation frames until it's available, then stop.
    let rafId = requestAnimationFrame(function check() {
      tryInit();
      if (!initialized) {
        rafId = requestAnimationFrame(check);
      }
    });

    const handleScroll = () => {
      const height = singleHeightRef.current;
      if (!height) return;

      const current = lenis.scroll;

      if (current <= 0) {
        lenis.scrollTo(current + height, { immediate: true });
      } else if (current >= height * 2) {
        lenis.scrollTo(current - height, { immediate: true });
      }
    };

    lenis.on('scroll', handleScroll);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off('scroll', handleScroll);
    };
  }, [lenisRef, singleHeightRef, enabled]);
}
