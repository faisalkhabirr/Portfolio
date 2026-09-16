import { useEffect, useRef, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface ScrambleOptions {
  /** How many random swaps each character goes through before locking in. */
  cyclesPerChar?: number;
  /** Delay in ms between each random swap. */
  cycleSpeed?: number;
  /** Delay in ms before each subsequent character starts its cycle (left-to-right stagger). */
  staggerPerChar?: number;
}

/**
 * Scrambles `target` character-by-character into random glyphs, then locks
 * each character into its real value with a left-to-right stagger — the
 * "decode" effect used for row text on arrival and for the logo on hover.
 *
 * Increment `trigger` to re-run the effect (e.g. a hover-count state).
 * Spaces are left untouched so word shapes stay readable mid-scramble.
 */
export function useScrambleText(
  target: string,
  trigger: number,
  { cyclesPerChar = 8, cycleSpeed = 30, staggerPerChar = 40 }: ScrambleOptions = {},
  enabled: boolean = true
): string {
  const [display, setDisplay] = useState(target);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    // Disabled instances (e.g. off-screen loop copies) skip the animation
    // entirely — no timers scheduled at all, not just a hidden result.
    if (!enabled) {
      setDisplay(target);
      return;
    }

    const finalChars = target.split('');
    const currentChars = [...finalChars];

    finalChars.forEach((char, i) => {
      if (!/[a-zA-Z0-9]/.test(char)) return; // leave spaces/punctuation static

      let cycle = 0;
      const runCycle = () => {
        if (cycle < cyclesPerChar) {
          currentChars[i] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          setDisplay(currentChars.join(''));
          cycle += 1;
          timeouts.current.push(setTimeout(runCycle, cycleSpeed));
        } else {
          currentChars[i] = finalChars[i];
          setDisplay(currentChars.join(''));
        }
      };
      timeouts.current.push(setTimeout(runCycle, i * staggerPerChar));
    });

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, trigger, enabled]);

  return display;
}
