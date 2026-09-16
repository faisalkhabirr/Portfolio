import { useEffect, useState } from 'react';
import styles from './SlidingBars.module.css';

// Purely decorative — widths/heights/colors chosen for visual rhythm only.
const BARS = [
  { width: '42%', height: 88, color: '#101317' },
  { width: '64%', height: 56, color: '#4E5965' },
  { width: '30%', height: 128, color: 'var(--accent-color, #E8543A)' },
  { width: '52%', height: 64, color: '#101317' },
  { width: '68%', height: 48, color: '#8A9399' },
  { width: '36%', height: 104, color: '#101317' },
  { width: '58%', height: 60, color: '#4E5965' },
] as const;

export function SlidingBars() {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Double rAF: guarantees the browser actually paints the hidden
    // (translateX 140%) state on one frame before flipping to revealed on
    // the next — a single rAF can get batched into the same paint as the
    // initial render, silently skipping the CSS transition entirely.
    let innerRaf: number;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setIsRevealed(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, []);

  return (
    <div className={styles.stack} aria-hidden="true">
      {BARS.map((bar, i) => (
        <div
          key={i}
          className={`${styles.bar} ${isRevealed ? styles.revealed : ''}`}
          style={{
            width: bar.width,
            height: bar.height,
            backgroundColor: bar.color,
            transitionDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}
