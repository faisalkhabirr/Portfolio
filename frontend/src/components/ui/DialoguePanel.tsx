// src/components/ui/DialoguePanel.tsx
import { useEffect, useRef, useState } from 'react';

import { useAppStore } from '../../state/useAppStore';
import { useViewport } from '../../hooks/useViewport';
import { useTransitionNavigate } from '../../context/TransitionContext';

import styles from './DialoguePanel.module.css';

const DIALOGUES = {
  intro:
    'Hello! I’m Deadpool. I was promised chimichangas for this gig.',

  assistant:
    'Try not to stare too long. Khabir is a genius! Hire him before I come to find you.',
} as const;

const TYPEWRITER_CONFIG = {
  desktop: {
    characterDelay: 5,
    punctuationMultiplier: 3.15,
  },
  mobile: {
    characterDelay: 25,
    punctuationMultiplier: 3.6,
  },
} as const;

const CTA_ITEMS = [
  'Discover About Khabir',
  'Work',
  'Get in touch',
  'Write us: faisalkhabirr@gmail.com',
] as const;

const EMAIL = 'faisalkhabirr@gmail.com';

export default function DialoguePanel() {
  const dialogueId = useAppStore((state) => state.dialogueId);
  const introStep = useAppStore((state) => state.introStep);
  const typewriterActive = useAppStore((state) => state.typewriterActive);
  const typewriterComplete = useAppStore(
    (state) => state.typewriterComplete,
  );
  const typewriterRunId = useAppStore((state) => state.typewriterRunId);
  const setTypewriterComplete = useAppStore(
    (state) => state.setTypewriterComplete,
  );

  const { isMobile } = useViewport();
  const navigateTo = useTransitionNavigate();

  const [displayedText, setDisplayedText] = useState('');
  const [previousText, setPreviousText] = useState('');
  const [copied, setCopied] = useState(false);

  const displayedTextRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobileRef = useRef(isMobile);

  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  useEffect(() => {
    if (!typewriterActive) {
      return;
    }

    const text = DIALOGUES[dialogueId];

    if (displayedTextRef.current.length > 0) {
      setPreviousText(displayedTextRef.current);
    }

    setDisplayedText('');
    displayedTextRef.current = '';
    setTypewriterComplete(false);

    let index = 0;

    const typeNextCharacter = () => {
      if (index >= text.length) {
        setTypewriterComplete(true);
        return;
      }

      index += 1;

      const nextText = text.slice(0, index);

      setDisplayedText(nextText);
      displayedTextRef.current = nextText;

      const character = text[index - 1];

      const config = isMobileRef.current
        ? TYPEWRITER_CONFIG.mobile
        : TYPEWRITER_CONFIG.desktop;

      let delay = config.characterDelay;

      if (
        character === ',' ||
        character === '.' ||
        character === '!' ||
        character === '?' ||
        character === '—'
      ) {
        delay = config.characterDelay * config.punctuationMultiplier;
      }

      timerRef.current = setTimeout(typeNextCharacter, delay);
    };

    timerRef.current = setTimeout(typeNextCharacter, 100);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [dialogueId, typewriterActive, typewriterRunId, setTypewriterComplete]);

  const showCursor =
    typewriterActive ||
    introStep === 'transition' ||
    introStep === 'cta' ||
    introStep === 'idle';

  const showCTA = introStep === 'cta' || introStep === 'idle';

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch (error) {
      console.error('[DialoguePanel] Failed to copy email:', error);
    }
  };

  const handleCtaClick = (label: (typeof CTA_ITEMS)[number]) => {
    if (label.includes('.com')) {
      handleEmailCopy();
      return;
    }

    if (label === 'Work') {
      navigateTo('/work');
      return;
    }

    // 'Discover About Khabir' and 'Get in touch' are no-ops until those
    // pages/sections exist — intentionally left unwired.
  };

  return (
    <>
      <div
        className={styles.glitchOverlay}
        data-intro="glitch-overlay"
        aria-hidden="true"
      />

      <section
        className={styles.panel}
        aria-label="Introduction"
        data-intro="dialogue-panel"
      >
        <div className={styles.dialogueStack}>
          {previousText && (
            <div
              className={styles.previousDialogue}
              data-intro="dialogue-previous"
              aria-hidden="true"
            >
              {previousText}
            </div>
          )}

          <div
            className={styles.activeDialogue}
            data-intro="dialogue-active"
          >
            <span>{displayedText}</span>

            {showCursor && (
              <span className={styles.cursor} aria-hidden="true" />
            )}
          </div>
        </div>

        <div
          className={`${styles.actions} ${
            showCTA ? styles.actionsVisible : ''
          }`}
          data-intro="cta-buttons"
        >
          {CTA_ITEMS.map((label) => {
            const isEmailCTA = label.includes('.com');

            return (
              <button
                key={label}
                type="button"
                className={`${styles.cta} ${
                  isEmailCTA ? styles.emailCta : ''
                }`}
                data-intro="cta-item"
                onClick={() => handleCtaClick(label)}
                aria-label={
                  isEmailCTA
                    ? copied
                      ? 'Email copied'
                      : `Copy ${EMAIL}`
                    : label
                }
              >
                <span>{copied && isEmailCTA ? 'Copied' : label}</span>

                {isEmailCTA && (
                  <span
                    className={styles.copyIndicator}
                    aria-hidden="true"
                  >
                    {copied ? (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 8.5L6.3 11.5L13 4.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="5"
                          y="2"
                          width="9"
                          height="9"
                          rx="1.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M3 5.5H2.8C2.02 5.5 1.4 6.12 1.4 6.9V13.2C1.4 13.97 2.02 14.6 2.8 14.6H9.1C9.88 14.6 10.5 13.97 10.5 13.2V13"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
