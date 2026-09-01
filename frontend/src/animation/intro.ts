// src/animation/intro.ts
import gsap from 'gsap';

import { useAppStore } from '../state/useAppStore';
import { MOBILE_BREAKPOINT } from '../hooks/useViewport';

/* ========================================================================= */
/* PHASE 5 TUNING — DESKTOP (UNTOUCHED)                                     */
/* ========================================================================= */

const INTRO_CONFIG = {
  loading: {
    dialogueStartProgress: 0.15,
    readinessTimeout: 10000,
  },
  logo: {
    duration: 0.4,
  },
  loader: {
    duration: 0.52,
  },
  reveal: {
    backgroundDuration: 0.55,
    sceneDuration: 0.65,
    headerDuration: 0.3,
    footerDuration: 0.3,
  },
  dialogue: {
    panelDuration: 0.3,
    firstMessageHold: 1550,
    previousMoveY: -18,
    previousDuration: 0.94,
  },
  glitch: {
    totalDuration: 0.9,
  },
  secondMessage: {
    startDelay: 35,
    revealDuration: 0.28,
    hold: 920,
  },
  cta: {
    parentDuration: 0.18,
    itemDuration: 0.32,
    stagger: 0.065,
    y: 7,
    scale: 0.985,
  },
} as const;

/* ========================================================================= */
/* MOBILE-ONLY OVERRIDES                                                     */
/* ========================================================================= */
/*
 * Tuned to land the full choreographed sequence (logo → CTA reveal,
 * excluding the asset-load wait) around ~7.4s — under the 8s budget,
 * with firstMessageHold intentionally kept equal to desktop's 1.55s
 * per explicit direction, rather than compressed like the other holds.
 */

const MOBILE_CONFIG = {
  logo: {
    duration: 0.4,
  },
  loader: {
    duration: 0.5,
  },
  reveal: {
    backgroundDuration: 0.5,
    sceneDuration: 0.6,
    headerDuration: 0.25,
    footerDuration: 0.25,
  },

  mobileCinematic: {
    initialSheetHeight: 30,
    finalSheetHeight: 50.8,
    duration: 0.75,
    startDelay: 80,
    ease: 'power3.inOut',
  },

  dialogueTransition: {
    firstMessageHold: 1550, // matches desktop exactly, per direction
    previousMoveY: -12,
    previousDuration: 0.7,
    glitchTotalDuration: 0.65,
    secondMessageStartDelay: 35,
    secondMessageRevealDuration: 0.35,
    secondMessageHold: 850,
    ctaParentDuration: 0.2,
    ctaItemDuration: 0.32,
    ctaStagger: 0.05,
  },
} as const;

/* ========================================================================= */
/* SELECTORS                                                                 */
/* ========================================================================= */

export const INTRO_SELECTORS = {
  blackOverlay: '[data-intro="black-overlay"]',
  preloaderLogo: '[data-intro="preloader-logo"]',
  loadingIndicator: '[data-intro="loading-indicator"]',
  sceneStage: '[data-intro="scene-stage"]',
  dialoguePanel: '[data-intro="dialogue-panel"]',
  dialoguePrevious: '[data-intro="dialogue-previous"]',
  dialogueActive: '[data-intro="dialogue-active"]',
  ctaButtons: '[data-intro="cta-buttons"]',
  ctaItems: '[data-intro="cta-item"]',
  header: '[data-intro="header"]',
  footerControls: '[data-intro="footer-controls"]',
  glitchOverlay: '[data-intro="glitch-overlay"]',
} as const;

/* ========================================================================= */
/* HELPERS                                                                   */
/* ========================================================================= */

function isMobileViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.innerWidth <= MOBILE_BREAKPOINT
  );
}

function getElements(selector: string): HTMLElement[] {
  return gsap.utils.toArray<HTMLElement>(selector);
}

function hasElement(selector: string): boolean {
  return getElements(selector).length > 0;
}

function waitForCondition(
  predicate: () => boolean,
  timeout = 10000,
): {
  promise: Promise<boolean>;
  cancel: () => void;
} {
  let settled = false;
  let unsubscribe: (() => void) | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const promise = new Promise<boolean>((resolve) => {
    if (predicate()) {
      settled = true;
      resolve(true);
      return;
    }

    const finish = (result: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe?.();

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      resolve(result);
    };

    unsubscribe = useAppStore.subscribe(() => {
      if (predicate()) {
        finish(true);
      }
    });

    timeoutId = setTimeout(() => {
      console.warn('[Intro] Condition timeout reached. Continuing.');
      finish(false);
    }, timeout);
  });

  return {
    promise,
    cancel: () => {
      settled = true;
      unsubscribe?.();

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    },
  };
}

function waitForElement(
  selector: string,
  timeout = 2000,
): {
  promise: Promise<boolean>;
  cancel: () => void;
} {
  return waitForCondition(() => hasElement(selector), timeout);
}

function wait(ms: number): {
  promise: Promise<void>;
  cancel: () => void;
} {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        resolve();
      }
    }, ms);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    },
  };
}

/* ========================================================================= */
/* INTRO SEQUENCE                                                            */
/* ========================================================================= */

export function playIntroSequence(): () => void {
  const store = useAppStore;

  let cancelled = false;

  const pendingCancels: Array<() => void> = [];
  const timelines: gsap.core.Timeline[] = [];

  async function run() {
    try {
      store.setState({
        introStep: 'black',
        introComplete: false,
        interactionLocked: true,
        typewriterActive: false,
        typewriterComplete: false,
        dialogueId: 'intro',
        mobileCinematicProgress: 0,
      });

      const isMobile = isMobileViewport();

      if (isMobile) {
        document.documentElement.style.setProperty(
          '--mobile-sheet-height',
          `${MOBILE_CONFIG.mobileCinematic.initialSheetHeight}dvh`,
        );
      }

      if (cancelled) {
        return;
      }

      /* 1 — LOGO */
      store.getState().setIntroStep('logo');

      gsap.set(INTRO_SELECTORS.preloaderLogo, {
        opacity: 0,
        y: 8,
        filter: 'blur(5px)',
      });

      await new Promise<void>((resolve) => {
        gsap.to(INTRO_SELECTORS.preloaderLogo, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: isMobile
            ? MOBILE_CONFIG.logo.duration
            : INTRO_CONFIG.logo.duration,
          ease: 'power3.out',
          onComplete: resolve,
        });
      });

      if (cancelled) {
        return;
      }

      /* 2 — LOADER */
      store.getState().setIntroStep('loading');

      await new Promise<void>((resolve) => {
        gsap.to(INTRO_SELECTORS.loadingIndicator, {
          opacity: 1,
          duration: isMobile
            ? MOBILE_CONFIG.loader.duration
            : INTRO_CONFIG.loader.duration,
          ease: 'power2.out',
          onComplete: resolve,
        });
      });

      if (cancelled) {
        return;
      }

      /* 3 — WAIT FOR SMALL LOADING THRESHOLD */
      const dialogueStartWait = waitForCondition(
        () =>
          useAppStore.getState().loadProgress >=
          INTRO_CONFIG.loading.dialogueStartProgress,
        INTRO_CONFIG.loading.readinessTimeout,
      );

      pendingCancels.push(dialogueStartWait.cancel);

      await dialogueStartWait.promise;

      if (cancelled) {
        return;
      }

      /* 4 — INITIAL SCENE REVEAL */
      store.getState().setIntroStep('background');

      const reveal = gsap.timeline();
      timelines.push(reveal);

      const sceneStage = getElements(INTRO_SELECTORS.sceneStage);
      const header = getElements(INTRO_SELECTORS.header);
      const footer = getElements(INTRO_SELECTORS.footerControls);
      const dialoguePanel = getElements(INTRO_SELECTORS.dialoguePanel);

      gsap.set(sceneStage, { opacity: 0.45, scale: 0.985 });
      gsap.set(header, { opacity: 0, y: -7 });
      gsap.set(footer, { opacity: 0, y: 6 });

      gsap.set(dialoguePanel, {
        opacity: 1,
        x: 0,
        filter: 'none',
      });

      store.getState().setIntroStep('dialogue');

      reveal
        .to(
          INTRO_SELECTORS.blackOverlay,
          {
            opacity: 0,
            duration: isMobile
              ? MOBILE_CONFIG.reveal.backgroundDuration
              : INTRO_CONFIG.reveal.backgroundDuration,
            ease: 'power3.inOut',
            pointerEvents: 'none',
          },
          0,
        )
        .to(
          sceneStage,
          {
            opacity: 1,
            scale: 1,
            duration: isMobile
              ? MOBILE_CONFIG.reveal.sceneDuration
              : INTRO_CONFIG.reveal.sceneDuration,
            ease: 'power3.out',
          },
          0,
        )
        .to(
          header,
          {
            opacity: 1,
            y: 0,
            duration: isMobile
              ? MOBILE_CONFIG.reveal.headerDuration
              : INTRO_CONFIG.reveal.headerDuration,
            ease: 'power2.out',
          },
          0.1,
        )
        .to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration: isMobile
              ? MOBILE_CONFIG.reveal.footerDuration
              : INTRO_CONFIG.reveal.footerDuration,
            ease: 'power2.out',
          },
          0.15,
        );

      await new Promise<void>((resolve) => {
        reveal.eventCallback('onComplete', resolve);
      });

      if (cancelled) {
        return;
      }

      /* 5 — FIRST DIALOGUE */
      store.getState().setIntroStep('typewriter');
      store.getState().startTypewriter('intro');

      const firstTypewriterWait = waitForCondition(
        () => useAppStore.getState().typewriterComplete,
        12000,
      );

      pendingCancels.push(firstTypewriterWait.cancel);

      await firstTypewriterWait.promise;

      if (cancelled) {
        return;
      }

      /* 6 — HOLD FIRST DIALOGUE */
      const firstHold = wait(
        isMobile
          ? MOBILE_CONFIG.dialogueTransition.firstMessageHold
          : INTRO_CONFIG.dialogue.firstMessageHold,
      );
      pendingCancels.push(firstHold.cancel);

      await firstHold.promise;

      if (cancelled) {
        return;
      }

      /* 7 — MOBILE CINEMATIC LIFT */
      if (isMobile) {
        store.getState().setIntroStep('transition');

        const startDelay = wait(MOBILE_CONFIG.mobileCinematic.startDelay);
        pendingCancels.push(startDelay.cancel);

        await startDelay.promise;

        if (cancelled) {
          return;
        }

        const mobileMotion = {
          progress: 0,
          sheetHeight: MOBILE_CONFIG.mobileCinematic.initialSheetHeight,
        };

        store.getState().setMobileCinematicProgress(0);

        const mobileTimeline = gsap.timeline();
        timelines.push(mobileTimeline);

        mobileTimeline.to(mobileMotion, {
          progress: 1,
          sheetHeight: MOBILE_CONFIG.mobileCinematic.finalSheetHeight,
          duration: MOBILE_CONFIG.mobileCinematic.duration,
          ease: MOBILE_CONFIG.mobileCinematic.ease,
          onUpdate: () => {
            if (cancelled) {
              return;
            }

            store
              .getState()
              .setMobileCinematicProgress(mobileMotion.progress);

            document.documentElement.style.setProperty(
              '--mobile-sheet-height',
              `${mobileMotion.sheetHeight}dvh`,
            );
          },
        });

        await new Promise<void>((resolve) => {
          mobileTimeline.eventCallback('onComplete', resolve);
        });

        if (cancelled) {
          return;
        }
      } else {
        store.getState().setMobileCinematicProgress(1);
      }

      /* 8 — SECOND DIALOGUE */
      store.getState().setIntroStep('transition');
      store.getState().startTypewriter('assistant');

      const previousMounted = waitForElement(
        INTRO_SELECTORS.dialoguePrevious,
        2000,
      );

      pendingCancels.push(previousMounted.cancel);

      await previousMounted.promise;

      if (cancelled) {
        return;
      }

      /* 9 — PREVIOUS DIALOGUE */
      const previousMessage = getElements(
        INTRO_SELECTORS.dialoguePrevious,
      );

      const previousTimeline = gsap.timeline();
      timelines.push(previousTimeline);

      gsap.set(previousMessage, {
        opacity: 0.18,
        y: 0,
        filter: 'blur(3px)',
        scale: 0.985,
      });

      previousTimeline.to(previousMessage, {
        opacity: 0.16,
        y: isMobile
          ? MOBILE_CONFIG.dialogueTransition.previousMoveY
          : INTRO_CONFIG.dialogue.previousMoveY,
        filter: 'blur(3px)',
        scale: 0.965,
        duration: isMobile
          ? MOBILE_CONFIG.dialogueTransition.previousDuration
          : INTRO_CONFIG.dialogue.previousDuration,
        ease: 'power2.inOut',
      });

      await new Promise<void>((resolve) => {
        previousTimeline.eventCallback('onComplete', resolve);
      });

      if (cancelled) {
        return;
      }

      /* 10 — GLITCH */
      const glitch = gsap.timeline();
      timelines.push(glitch);

      const halfGlitch =
        (isMobile
          ? MOBILE_CONFIG.dialogueTransition.glitchTotalDuration
          : INTRO_CONFIG.glitch.totalDuration) / 2;

      glitch
        .set(INTRO_SELECTORS.glitchOverlay, {
          display: 'block',
          opacity: 0,
        })
        .to(INTRO_SELECTORS.glitchOverlay, {
          opacity: 0.78,
          duration: halfGlitch * 0.25,
          ease: 'steps(1)',
        })
        .to(
          INTRO_SELECTORS.dialoguePanel,
          {
            x: 2,
            skewX: -1,
            duration: halfGlitch * 0.25,
            ease: 'none',
          },
          '<',
        )
        .to(INTRO_SELECTORS.glitchOverlay, {
          opacity: 0.08,
          duration: halfGlitch * 0.25,
          ease: 'none',
        })
        .to(
          INTRO_SELECTORS.dialoguePanel,
          {
            x: -1,
            skewX: 0.6,
            duration: halfGlitch * 0.25,
            ease: 'none',
          },
          '<',
        )
        .to(INTRO_SELECTORS.glitchOverlay, {
          opacity: 0,
          duration: halfGlitch * 0.5,
          ease: 'power2.out',
        })
        .to(
          INTRO_SELECTORS.dialoguePanel,
          {
            x: 0,
            skewX: 0,
            duration: halfGlitch * 0.5,
            ease: 'power2.out',
          },
          '<',
        )
        .set(INTRO_SELECTORS.glitchOverlay, { display: 'none' });

      await new Promise<void>((resolve) => {
        glitch.eventCallback('onComplete', resolve);
      });

      if (cancelled) {
        return;
      }

      /* 11 — SECOND MESSAGE REVEAL */
      const secondStartDelay = wait(
        isMobile
          ? MOBILE_CONFIG.dialogueTransition.secondMessageStartDelay
          : INTRO_CONFIG.secondMessage.startDelay,
      );

      pendingCancels.push(secondStartDelay.cancel);

      await secondStartDelay.promise;

      if (cancelled) {
        return;
      }

      store.getState().setIntroStep('typewriter');

      const activeMessage = getElements(INTRO_SELECTORS.dialogueActive);

      gsap.set(activeMessage, {
        opacity: 0,
        y: 7,
        filter: 'blur(3px)',
      });

      gsap.to(activeMessage, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: isMobile
          ? MOBILE_CONFIG.dialogueTransition.secondMessageRevealDuration
          : INTRO_CONFIG.secondMessage.revealDuration,
        ease: 'power3.out',
      });

      const secondTypewriterWait = waitForCondition(
        () => useAppStore.getState().typewriterComplete,
        12000,
      );

      pendingCancels.push(secondTypewriterWait.cancel);

      await secondTypewriterWait.promise;

      if (cancelled) {
        return;
      }

      /* 12 — SECOND MESSAGE HOLD */
      const secondHold = wait(
        isMobile
          ? MOBILE_CONFIG.dialogueTransition.secondMessageHold
          : INTRO_CONFIG.secondMessage.hold,
      );
      pendingCancels.push(secondHold.cancel);

      await secondHold.promise;

      if (cancelled) {
        return;
      }

      /* 13 — CTA */
      store.getState().setIntroStep('cta');

      const ctaParent = getElements(INTRO_SELECTORS.ctaButtons);
      const ctaItems = getElements(INTRO_SELECTORS.ctaItems);

      gsap.set(ctaParent, { opacity: 0, y: 5 });

      gsap.set(ctaItems, {
        opacity: 0,
        y: INTRO_CONFIG.cta.y,
        scale: INTRO_CONFIG.cta.scale,
      });

      const ctaTimeline = gsap.timeline();
      timelines.push(ctaTimeline);

      ctaTimeline
        .to(ctaParent, {
          opacity: 1,
          y: 0,
          duration: isMobile
            ? MOBILE_CONFIG.dialogueTransition.ctaParentDuration
            : INTRO_CONFIG.cta.parentDuration,
          ease: 'power2.out',
        })
        .to(
          ctaItems,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: isMobile
              ? MOBILE_CONFIG.dialogueTransition.ctaItemDuration
              : INTRO_CONFIG.cta.itemDuration,
            stagger: isMobile
              ? MOBILE_CONFIG.dialogueTransition.ctaStagger
              : INTRO_CONFIG.cta.stagger,
            ease: 'power3.out',
          },
          '-=0.04',
        );

      await new Promise<void>((resolve) => {
        ctaTimeline.eventCallback('onComplete', resolve);
      });

      if (cancelled) {
        return;
      }

      /* 14 — IDLE */
      store.getState().completeIntro();
    } catch (error) {
      console.error('[Intro] Sequence failed:', error);

      if (!cancelled) {
        store.getState().completeIntro();
      }
    }
  }

  run();

  return () => {
    cancelled = true;

    pendingCancels.forEach((cancel) => cancel());
    timelines.forEach((timeline) => timeline.kill());

    Object.values(INTRO_SELECTORS).forEach((selector) => {
      gsap.killTweensOf(selector);
    });
  };
}