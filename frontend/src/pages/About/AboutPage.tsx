import { useState } from 'react';
import { useScrambleText } from '../../hooks/useScrambleText';
import { MaskLines } from '../../components/about/MaskLines';
import { SlidingBars } from '../../components/about/SlidingBars';
import GlobalHeader from '../../components/ui/GlobalHeader';
import ContactOverlay from '../../components/ui/ContactOverlay';
import styles from './AboutPage.module.css';

const TITLE_NAME = 'khabirr.';
const TITLE_ROLE = '/ Creative Developer';

const BIO_LINES = [
  'Design driven developer building interfaces',
  'that feel less like software and more like',
  'experience. Currently in my final year of',
  'Computer Science, moving from full-stack',
  'engineering into AI native product work',
  'blending motion, interaction and machine',
  'intelligence into things worth lingering on.',
];

const EMAIL = 'faisalkhabirr@gmail.com';

export default function AboutPage() {
  const [logoHoverCount, setLogoHoverCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const decodedName = useScrambleText(TITLE_NAME, logoHoverCount, {
    cyclesPerChar: 10,
    cycleSpeed: 35,
    staggerPerChar: 30,
  });
  const decodedRole = useScrambleText(TITLE_ROLE, logoHoverCount, {
    cyclesPerChar: 10,
    cycleSpeed: 35,
    staggerPerChar: 30,
  });

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error('[AboutPage] Failed to copy email:', error);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerLayer} style={{ opacity: 1 }}>
        <GlobalHeader />
      </div>

      <div className={styles.content}>
        {/* ── Left: title decode + bio mask-reveal ─────────────────── */}
        <div className={styles.left}>
          <button
            type="button"
            className={styles.titleButton}
            onMouseEnter={() => setLogoHoverCount((n) => n + 1)}
            aria-label={`${TITLE_NAME} ${TITLE_ROLE}`}
          >
            <span className={styles.titleName}>{decodedName}</span>{' '}
            <span className={styles.titleRole}>{decodedRole}</span>
          </button>

          <div className={styles.infoLabel}>
            <span className={styles.infoDash} aria-hidden="true" />
            <MaskLines lines={['Info Info']} baseDelay={0.3} />
          </div>

          <div className={styles.bio}>
            <MaskLines lines={BIO_LINES} baseDelay={0.4} staggerStep={0.06} />
          </div>
        </div>

        {/* ── Right: abstract sliding bars ─────────────────────────── */}
        <div className={styles.right}>
          <SlidingBars />
        </div>
      </div>

      {/* ── Corner elements ──────────────────────────────────────── */}
      <div className={styles.cornerLeft}>Based in Chittagong, Bangladesh</div>
      <button type="button" className={styles.cornerRight} onClick={handleCopyEmail}>
        {copied ? 'Copied!' : EMAIL}
      </button>

      <ContactOverlay />
    </div>
  );
}
