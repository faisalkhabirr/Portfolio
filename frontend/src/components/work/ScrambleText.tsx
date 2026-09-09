import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ScrambleTextProps {
  text: string;
  start?: boolean;
  duration?: number;
  className?: string;
  delay?: number;
}

const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';

export const ScrambleText: React.FC<ScrambleTextProps> = ({ 
  text, 
  start = true, 
  duration = 1.2, 
  className = '',
  delay = 0
}) => {
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!start || !elRef.current) return;

    const el = elRef.current;
    const originalText = text;
    const length = originalText.length;
    
    // We'll use a dummy object to tween a property from 0 to 1
    const tweenObj = { progress: 0 };
    
    // Make sure we start with something scrambled immediately if delaying
    if (delay > 0) {
        let initialScramble = '';
        for (let i = 0; i < length; i++) {
          initialScramble += originalText[i] === ' ' ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        el.innerText = initialScramble;
    }
    
    const tween = gsap.to(tweenObj, {
      progress: 1,
      duration: duration,
      delay: delay,
      ease: 'power2.inOut',
      onUpdate: () => {
        const revealIndex = Math.floor(tweenObj.progress * length);
        
        let scrambled = '';
        for (let i = 0; i < length; i++) {
          if (i < revealIndex) {
            // Unveil the actual character
            scrambled += originalText[i];
          } else {
            // Keep scrambling the rest
            if (originalText[i] === ' ') {
                scrambled += ' ';
            } else {
                scrambled += glyphs[Math.floor(Math.random() * glyphs.length)];
            }
          }
        }
        el.innerText = scrambled;
      },
      onComplete: () => {
        el.innerText = originalText;
      }
    });

    return () => {
      tween.kill();
      if (elRef.current) {
        elRef.current.innerText = originalText;
      }
    };
  }, [text, start, duration, delay]);

  return <span ref={elRef} className={className}>{text}</span>;
};
