import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrambleText } from '../../hooks/useScrambleText';
import styles from './WorksNavbar.module.css';

const LOGO_TEXT = 'khabirr.';

interface WorksNavbarProps {
  /**
   * Called when "+ PROJECTS" is clicked.
   * Can be used to scroll back to the projects list.
   */
  onProjectsClick?: () => void;
}

export function WorksNavbar({
  onProjectsClick,
}: WorksNavbarProps) {
  const [logoHoverCount, setLogoHoverCount] = useState(0);
  const navigate = useNavigate();

  const logoDisplay = useScrambleText(
    LOGO_TEXT,
    logoHoverCount,
    {
      cyclesPerChar: 6,
      cycleSpeed: 25,
      staggerPerChar: 25,
    },
  );

  return (
    <header
      className={styles.navbar}
      data-work="navbar"
    >
      {/* ─────────────────────────────────────────────
          LOGO
      ───────────────────────────────────────────── */}

      <button
        type="button"
        className={styles.logo}
        onMouseEnter={() =>
          setLogoHoverCount((count) => count + 1)
        }
        onClick={() => navigate('/')}
        aria-label="khabirr. — Back to Home"
      >
        <span className={styles.logoText}>
          {logoDisplay}
        </span>

        <span
          className={styles.logoLines}
          aria-hidden="true"
        >
          //////////
        </span>
      </button>

      {/* ─────────────────────────────────────────────
          NAVIGATION
      ───────────────────────────────────────────── */}

      <nav
        className={styles.nav}
        aria-label="Works navigation"
      >
        <button
          type="button"
          className={styles.pill}
          onClick={onProjectsClick}
        >
          + PROJECTS
        </button>

        <button
          type="button"
          className={styles.pill}
          disabled
        >
          + INFO
        </button>
      </nav>
    </header>
  );
}
