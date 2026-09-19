import { useEffect, useState } from 'react';
import styles from './MaskLines.module.css';

interface MaskLinesProps {
  lines: string[];
  /** Seconds before the first line starts revealing. */
  baseDelay?: number;
  /** Seconds between each subsequent line's reveal. */
  staggerStep?: number;
  className?: string;
  /** If true, the lines start fully revealed with no animation. */
  skipAnimation?: boolean;
}

/**
 * Splits text into lines, each masked inside an overflow-hidden row with
 * an inner span that slides up from translateY(110%) into place. Classic
 * "typewriter-readability" cascade reveal.
 */
export function MaskLines({
  lines,
  baseDelay = 0,
  staggerStep = 0.08,
  className = '',
  skipAnimation = false,
}: MaskLinesProps) {
  const [isRevealed, setIsRevealed] = useState(skipAnimation);

  useEffect(() => {
    if (skipAnimation) return;
    
    // Double rAF — see SlidingBars.tsx for why a single rAF isn't reliable.
    let innerRaf: number;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setIsRevealed(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [skipAnimation]);

  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className={styles.row}>
          <span
            className={`${styles.inner} ${isRevealed ? styles.revealed : ''} ${className}`}
            style={{ 
              transitionDelay: skipAnimation ? '0s' : `${baseDelay + i * staggerStep}s`,
              transitionDuration: skipAnimation ? '0s' : undefined
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </>
  );
}
