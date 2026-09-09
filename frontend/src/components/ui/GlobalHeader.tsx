import type { CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';

import styles from './GlobalHeader.module.css';
import { useAppStore } from '../../state/useAppStore';
import { useTransitionNavigate } from '../../context/TransitionContext';

type FlipTextProps = {
  text: string;
  className?: string;
  dotClassName?: string;
};

function FlipText({
  text,
  className = '',
  dotClassName = '',
}: FlipTextProps) {
  return (
    <span
      className={`${styles.flipText} ${className}`}
    >
      {Array.from(text).map(
        (character, index) => {
          if (character === ' ') {
            return (
              <span
                key={`space-${index}`}
                className={styles.flipSpace}
                aria-hidden="true"
              >
                {'\u00A0'}
              </span>
            );
          }

          const isDot =
            character === '.';

          return (
            <span
              key={`${character}-${index}`}
              className={`${styles.flipLetter} ${
                isDot
                  ? dotClassName
                  : ''
              }`}
              style={
                {
                  '--letter-index': index,
                } as CSSProperties
              }
              aria-hidden="true"
            >
              {character}
            </span>
          );
        },
      )}
    </span>
  );
}

export default function GlobalHeader() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const navigateTo = useTransitionNavigate();
  const location = useLocation();

  const isOnWork = location.pathname.startsWith('/work');

  const handleArchiveToggle = () => {
    navigateTo(isOnWork ? '/' : '/work');
  };

  return (
    <header
      className={styles.header}
      data-intro="header"
    >
      {/* Logo — navigate home with transition */}
      <button
        className={styles.logo}
        onClick={() => navigateTo('/')}
        aria-label="khabirr. — Home"
      >
        <FlipText
          text="khabirr."
          dotClassName={
            styles.logoDotLetter
          }
        />
      </button>

      <div
        className={styles.sparkle}
        aria-hidden="true"
      >
        {/* Sparkle can be added later */}
      </div>

      {/* Theme toggle */}
      <button
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '○' : '◑'}
      </button>

      {/* Archive / Home toggle */}
      <button
        className={`${styles.archiveButton} ${isOnWork ? styles.archiveButtonActive : ''}`}
        onClick={handleArchiveToggle}
        aria-label={isOnWork ? 'Close archive — return home' : 'Open projects archive'}
      >
        {isOnWork ? '[ + CLOSE ARCHIVE ]' : '+ PROJECTS'}
      </button>

      <a
        href="#contact"
        className={styles.ctaLink}
        aria-label="Let's talk"
      >
        <FlipText text="Let's talk" />
      </a>
    </header>
  );
}