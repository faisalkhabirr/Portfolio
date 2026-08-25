import styles from './GlobalHeader.module.css';

// Phase 2: static visual chrome only. The sparkle icon renders static —
// its idle pulse and the eye-expression-on-hover behavior described in
// the reference are later-phase interaction logic, not composition.
export default function GlobalHeader() {
  return (
    <header className={styles.header}>
      {/* Placeholder wordmark — swap for your actual brand mark/logo asset */}
      <a href="#" className={styles.logo} aria-label="Home">
        khabirr<span className={styles.logoDot}>.</span>
      </a>

      <div className={styles.sparkle} aria-hidden="true">
        {/* <SparkleIcon /> */}
      </div>

      <a href="#contact" className={styles.ctaLink}>
        Let&rsquo;s talk
      </a>
    </header>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z" fill="currentColor" />
    </svg>
  );
}
