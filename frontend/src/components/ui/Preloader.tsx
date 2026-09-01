import { useAppStore } from '../../state/useAppStore';
import styles from './Preloader.module.css';

// Presentational only — no GSAP import here. src/animation/intro.ts is
// the single source of choreography and targets these elements via their
// data-intro attributes, per the "GSAP vs R3F separation, centralized in
// intro.ts" rule. This component only renders structure + reads
// loadProgress for the bar width (a plain data-driven value, not a tween).
//
// Stays mounted through the entire intro so GSAP has something to animate
// out; unmounts only once introComplete flips, so it isn't ripped out
// from under an in-flight tween.
export default function Preloader() {
  const loadProgress = useAppStore((s) => s.loadProgress);
  const introComplete = useAppStore((s) => s.introComplete);

  if (introComplete) return null;

  return (
    <div className={styles.overlay} data-intro="black-overlay">
      <div className={styles.logo} data-intro="preloader-logo">
        Portfolio<span className={styles.logoDot}>.</span>
      </div>
      <div className={styles.progressTrack} data-intro="loading-indicator">
        <div
          className={styles.progressFill}
          style={{ width: `${Math.round(loadProgress * 100)}%` }}
        />
      </div>
    </div>
  );
}
