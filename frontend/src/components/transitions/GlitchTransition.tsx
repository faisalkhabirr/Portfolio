import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import gsap from 'gsap';
import styles from './GlitchTransition.module.css';

const BAR_COUNT = 8;

export interface GlitchTransitionHandle {
  /** Play the full in → hold → out sequence. Returns a Promise that resolves
   *  when the navigation moment (peak / midpoint) is reached so the caller
   *  can trigger the route change at exactly the right frame. */
  play: () => Promise<void>;
}

const GlitchTransition = forwardRef<GlitchTransitionHandle>((_, ref) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);

  const play = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!overlayRef.current) {
        resolve();
        return;
      }

      const bars = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(`.${styles.bar}`)
      );
      const noise = noiseRef.current;

      // Reset state
      gsap.set(bars, { scaleX: 0 });
      gsap.set(noise, { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
      });

      // ── Phase 1: bars wipe IN (staggered, glitchy) ──────────────────
      tl.to(bars, {
        scaleX: 1,
        duration: 0.28,
        stagger: {
          each: 0.022,
          from: 'random',
        },
        ease: 'power4.in',
      });

      // ── Phase 2: noise flash at peak ──────────────────────────────────
      tl.to(
        noise,
        { opacity: 0.6, duration: 0.06, yoyo: true, repeat: 3 },
        '-=0.05'
      );

      // ── Midpoint: resolve Promise → caller triggers route change ──────
      tl.add(() => resolve());

      // ── Phase 3: bars wipe OUT ────────────────────────────────────────
      tl.to(bars, {
        scaleX: 0,
        duration: 0.32,
        stagger: {
          each: 0.025,
          from: 'random',
        },
        ease: 'power3.out',
        delay: 0.04,
      });

      tl.to(noise, { opacity: 0, duration: 0.1 }, '<');
    });
  }, []);

  useImperativeHandle(ref, () => ({ play }), [play]);

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div key={i} className={styles.bar} />
      ))}
      <div ref={noiseRef} className={styles.noise} />
    </div>
  );
});

GlitchTransition.displayName = 'GlitchTransition';

export default GlitchTransition;
