import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import { useScrambleText } from '../../hooks/useScrambleText';
import { MaskLines } from '../../components/about/MaskLines';
import { SlidingBars } from '../../components/about/SlidingBars';
import GlobalHeader from '../../components/ui/GlobalHeader';
import ContactOverlay from '../../components/ui/ContactOverlay';
import styles from './AboutPage.module.css';

const TITLE_NAME = 'Faisal';
const TITLE_ROLE = '/ Creative Developer';

const BIO_TEXT = 'A developer who cares about how software feels, not just how it works. Currently in my final year of my BSc, moving from full-stack development into AI-native product engineering, blending design, interaction, motion and intelligence into products that feel worth coming back to.';

const EMAIL = 'faisalkhabirr@gmail.com';

export default function AboutPage() {
  const storeHasVisited = useAppStore((s) => s.visitedViews.about);
  const markVisited = useAppStore((s) => s.markVisited);
  
  // Capture the initial visited state for this mount so we don't accidentally
  // change it mid-render (which would cancel in-progress CSS animations).
  const [skipIntro] = useState(storeHasVisited);

  useEffect(() => {
    if (!skipIntro) {
      markVisited('about');
    }
  }, [skipIntro, markVisited]);

  const [logoHoverCount, setLogoHoverCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // If visited before, don't scramble on mount (wait for hover).
  // logoHoverCount > 0 means the user hovered it, so we allow scrambling again.
  const shouldScramble = !skipIntro || logoHoverCount > 0;

  const decodedName = useScrambleText(TITLE_NAME, logoHoverCount, {
    cyclesPerChar: 10,
    cycleSpeed: 35,
    staggerPerChar: 30,
  }, shouldScramble);

  const decodedRole = useScrambleText(TITLE_ROLE, logoHoverCount, {
    cyclesPerChar: 10,
    cycleSpeed: 35,
    staggerPerChar: 30,
  }, shouldScramble);

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
            <MaskLines lines={['Info Info']} baseDelay={0.3} skipAnimation={skipIntro} />
          </div>

          <div className={styles.bio}>
            <MaskLines text={BIO_TEXT} baseDelay={0.4} staggerStep={0.02} skipAnimation={skipIntro} />
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
