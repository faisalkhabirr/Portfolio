import styles from './FooterControls.module.css';

// Phase 2: visual shell only. This button is a real, focusable, styled
// control — it just doesn't do anything yet. Audio state, muting logic,
// and any actual playback live in a later phase once there's audio to
// control at all.
export default function FooterControls() {
  return (
    <div className={styles.footer}>
      
    </div>
  );
}

function AudioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        fill="currentColor"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
