import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './WorksPreloader.module.css';

interface WorksPreloaderProps {
  onComplete?: () => void;
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const HARD_TIMEOUT_MS = 4000;

function randomGlitchString(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

export const WorksPreloader: React.FC<WorksPreloaderProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(true);
  const hasCompletedRef = useRef(false);

  const finish = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setIsRendered(false);
    onComplete?.();
  };

  useEffect(() => {
    if (!containerRef.current || !counterRef.current) return;

    const tl = gsap.timeline({ onComplete: finish });

    // 1. Counter 0% -> 100%
    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 100,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (counterRef.current) {
          const displayVal = Math.floor(counterObj.val).toString().padStart(2, '0');
          counterRef.current.innerText = `${displayVal}%`;
        }
      },
    });

    // 2. Glitch into a random 6-7 char alphanumeric string, holding ~200ms.
    //    It never resolves into a real word — matches the reference exactly.
    tl.to(
      {},
      {
        duration: 0.2,
        onStart: () => {
          if (counterRef.current) {
            const length = 6 + Math.round(Math.random());
            counterRef.current.innerText = randomGlitchString(length);
          }
        },
      }
    );

    // 3. Fade the whole loader out, disabling pointer-events immediately
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onStart: () => {
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = 'none';
        }
      },
    });

    const safetyTimer = setTimeout(finish, HARD_TIMEOUT_MS);

    return () => {
      tl.kill();
      clearTimeout(safetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isRendered) return null;

  return (
    <div ref={containerRef} className={styles.preloaderContainer}>
      <div className={styles.counter} ref={counterRef}>
        00%
      </div>
    </div>
  );
};
