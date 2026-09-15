import { useEffect, useRef, type RefObject } from 'react';
import Lenis from 'lenis';

/**
 * Binds a Lenis smooth/inertia-scroll instance to a specific scrollable
 * element rather than the window. Mount/unmount is tied to whatever
 * component calls this hook — when WorkPage unmounts, the Lenis instance
 * and its rAF loop are destroyed with it (route-isolation rule).
 *
 * Returns a ref holding the live Lenis instance (or null before mount /
 * after unmount) so callers can drive it directly — e.g. the infinite
 * scroll loop needs `lenis.scrollTo(x, { immediate: true })`.
 */
export function useLenisScroll(
  wrapperRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  onScroll?: (scroll: number) => void
): RefObject<Lenis | null> {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // ease-out cubic
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const handleScroll = onScroll ? () => onScroll(lenis.scroll) : undefined;
    if (handleScroll) lenis.on('scroll', handleScroll);

    return () => {
      cancelAnimationFrame(rafId);
      if (handleScroll) lenis.off('scroll', handleScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return lenisRef;
}
