import { useEffect, useState } from 'react';
import { useAppStore } from '../../state/useAppStore';
import styles from './ContactOverlay.module.css';

const EMAIL = 'faisalkhabirr@gmail.com';

// Fill these in with your real profile URLs whenever you're ready —
// structure supports adding more entries the same way.
const SOCIAL_LINKS = [
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'X / Twitter', href: '#' },
] as const;

export default function ContactOverlay() {
  const isOpen = useAppStore((s) => s.isContactOpen);
  const closeContact = useAppStore((s) => s.closeContact);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContact();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeContact]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error('[ContactOverlay] Failed to copy email:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeContact();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Contact"
      >
        <button
          type="button"
          className={styles.backButton}
          onClick={closeContact}
          aria-label="Close contact overlay"
        >
          Back
        </button>

        <div className={styles.center}>
          <button
            type="button"
            className={styles.emailPill}
            onClick={handleCopyEmail}
            aria-label={copied ? 'Email copied' : `Copy ${EMAIL}`}
          >
            {copied ? 'Copied!' : EMAIL}
          </button>

          <div className={styles.meta}>
            <span>© {new Date().getFullYear()} khabirr.</span>
          </div>
        </div>

        <div className={styles.socials}>
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className={styles.socialLink}
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
