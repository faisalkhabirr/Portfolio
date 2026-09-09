import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './WorksPreloader.module.css';

interface WorksPreloaderProps {
  onComplete?: () => void;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export const WorksPreloader: React.FC<WorksPreloaderProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !counterRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setIsRendered(false);
        if (onComplete) onComplete();
      }
    });

    // 1. Counter Sequence (0% to 100%)
    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 100,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (counterRef.current) {
          // Format like "00%", "29%", "100%"
          const displayVal = Math.floor(counterObj.val).toString().padStart(2, '0');
          counterRef.current.innerText = `${displayVal}%`;
        }
      }
    });

    // 2. Glitch / Scramble Effect upon reaching 100%
    tl.to(counterObj, {
      duration: 0.25,
      onUpdate: () => {
        if (counterRef.current) {
          let scrambled = '';
          for (let i = 0; i < 4; i++) {
            scrambled += chars[Math.floor(Math.random() * chars.length)];
          }
          counterRef.current.innerText = scrambled;
        }
      }
    });

    // Resolve into final state (optional glitch settle)
    tl.add(() => {
      if (counterRef.current) counterRef.current.innerText = 'SYS_READY';
    });

    // 3. Clear / Fade Out Cinematic Finish
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      delay: 0.2
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  if (!isRendered) return null;

  return (
    <div ref={containerRef} className={styles.preloaderContainer}>
      <div className={styles.counter} ref={counterRef}>00%</div>
    </div>
  );
};
