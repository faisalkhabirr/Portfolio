import { useState } from 'react';

import styles from './FooterControls.module.css';

function ResetIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.5 7.5V4.5M4.5 4.5H7.5M4.5 4.5L8 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5.7 11.3C6.7 7.5 10.7 5.25 14.5 6.25C18.3 7.25 20.55 11.25 19.55 15.05C18.55 18.85 14.55 21.1 10.75 20.1C8.45 19.5 6.7 17.9 5.85 15.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AudioIcon({
  muted,
}: {
  muted: boolean;
}) {
  if (muted) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 9V15H8L13 19V5L8 9H4Z"
          fill="currentColor"
        />

        <path
          d="M17 9L21 15M21 9L17 15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 9V15H8L13 19V5L8 9H4Z"
        fill="currentColor"
      />

      <path
        d="M16 8.5C17.2 10 17.2 14 16 15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M18.5 6.5C21 9.2 21 14.8 18.5 17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FooterControls() {
  const [muted, setMuted] =
    useState(false);

  const handleReset = () => {
    /*
     * Phase 5/4 integration point.
     *
     * The actual camera/character reset can be connected to the
     * shared store later. For now this deliberately does not interfere
     * with the existing Deadpool tracking loop.
     */
    window.dispatchEvent(
      new CustomEvent('character-reset'),
    );
  };

  return (
    <div
      className={styles.footer}
      data-intro="footer-controls"
    >
      <button
        type="button"
        className={`${styles.controlButton} ${styles.resetButton}`}
        onClick={handleReset}
        aria-label="Reset character view"
      >
        <ResetIcon />
      </button>

      <button
        type="button"
        className={`${styles.controlButton} ${styles.audioButton} ${
          muted ? styles.muted : ''
        }`}
        onClick={() =>
          setMuted((value) => !value)
        }
        aria-label={
          muted
            ? 'Unmute audio'
            : 'Mute audio'
        }
        aria-pressed={muted}
      >
        <AudioIcon muted={muted} />
      </button>
    </div>
  );
}