import gsap from 'gsap';
import { useAppStore } from '../state/useAppStore';

/* ========================================================================= */
/* INTRO CONFIGURATION                                                       */
/* ========================================================================= */

export const INTRO_CONFIG = {
  /* ------------------------------------------------------------------ */
  /* TYPEWRITER                                                         */
  /* ------------------------------------------------------------------ */

  typewriter: {
    /*
     * Lower = faster.
     *
     * Reference feels relatively quick and conversational.
     */
    characterDelay: 16,

    /*
     * Extra delay after punctuation.
     */
    punctuationMultiplier: 1.55,

    /*
     * Small delay before the first character appears.
     */
    initialDelay: 1,
  },

  /* ------------------------------------------------------------------ */
  /* DIALOGUE                                                           */
  /* ------------------------------------------------------------------ */

  dialogue: {
    /*
     * Vertical position of the dialogue block.
     *
     * Percentage of viewport height.
     *
     * Reference is substantially lower than our current implementation.
     */
    topDesktop: '59%',

    topTablet: '57%',

    bottomMobile: 88,

    /*
     * Width of the dialogue text.
     */
    maxWidth: '31ch',

    /*
     * Main dialogue size.
     */
    fontSizeDesktop: 'clamp(20px, 2vw, 29px)',

    /*
     * Space between previous and active dialogue.
     */
    previousOffset: -100,

    /*
     * Drastically reduced blur value so the background message remains sharp.
     */
    previousBlur: 0.5,

    /*
     * Previous message opacity.
     */
    previousOpacity: 0.22,

    /*
     * Previous message scale.
     */
    previousScale: 0.965,
  },

  /* ------------------------------------------------------------------ */
  /* TRANSITION                                                         */
  /* ------------------------------------------------------------------ */

  transition: {
    /*
     * Pause after a completed message before changing it.
     */
    messageHold: 280,

    /*
     * Previous message moving backward/upward.
     */
    previousMessageDuration: 0.1,

    /*
     * Glitch duration.
     */
    glitchDuration: 0.9,

    /*
     * Second dialogue's entrance.
     */
    newMessageRevealDuration: 0.12,
  },

  /* ------------------------------------------------------------------ */
  /* CTA                                                                */
  /* ------------------------------------------------------------------ */

  cta: {
    /*
     * This is the important value that forces:
     *
     * ROW 1 = 3 buttons
     * ROW 2 = 2 buttons
     */
    maxWidth: 390,

    gap: 6,

    /*
     * Small vertical distance from dialogue to CTA group.
     */
    marginTop: 0,

    /*
     * Individual pill height.
     */
    height: 31,

    horizontalPadding: 12,

    fontSize: 11,

    /*
     * Stagger between buttons.
     */
    stagger: 0.065,

    /*
     * Entrance distance.
     */
    entranceY: 7,

    entranceScale: 0.985,

    entranceDuration: 0.32,
  },

  /* ------------------------------------------------------------------ */
  /* CINEMATIC INTRO                                                    */
  /* ------------------------------------------------------------------ */

  intro: {
    logoDuration: 0.38,

    loadingDuration: 0.15,

    backgroundRevealDuration: 0.55,

    sceneRevealDuration: 0.65,

    dialogueRevealDuration: 0.3,

    headerRevealDuration: 0.3,

    footerRevealDuration: 0.3,
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
/* DOM HELPERS                                                               */
/* ========================================================================= */

function getElements(
  selector: string,
): HTMLElement[] {
  return gsap.utils.toArray<HTMLElement>(
    selector,
  );
}

function hasElement(
  selector: string,
): boolean {
  return getElements(selector).length > 0;
}

/* ========================================================================= */
/* CONDITION WAITING                                                         */
/* ========================================================================= */

function waitForCondition(
  predicate: () => boolean,
  timeout = 10000,
): {
  promise: Promise<boolean>;
  cancel: () => void;
} {
  let settled = false;

  let unsubscribe:
    | (() => void)
    | null = null;

  let timeoutId:
    | ReturnType<typeof setTimeout>
    | null = null;

  const promise =
    new Promise<boolean>((resolve) => {
      if (predicate()) {
        settled = true;
        resolve(true);
        return;
      }

      const finish = (
        result: boolean,
      ) => {
        if (settled) return;

        settled = true;

        unsubscribe?.();

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        resolve(result);
      };

      unsubscribe =
        useAppStore.subscribe(() => {
          if (predicate()) {
            finish(true);
          }
        });

      timeoutId = setTimeout(() => {
        console.warn(
          '[Intro] Condition timeout reached. Continuing.',
        );

        finish(false);
      }, timeout);
    });

  return {
    promise,

    cancel: () => {
      settled = true;

      unsubscribe?.();

      if (unsubscribe) unsubscribe();

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    },
  };
}

/* ========================================================================= */
/* DOM APPEARANCE WAIT                                                       */
/* ========================================================================= */

function waitForElement(
  selector: string,
  timeout = 2000,
): {
  promise: Promise<boolean>;
  cancel: () => void;
} {
  return waitForCondition(
    () => hasElement(selector),
    timeout,
  );
}

/* ========================================================================= */
/* DELAY                                                                     */
/* ========================================================================= */

function wait(ms: number): {
  promise: Promise<void>;
  cancel: () => void;
} {
  let cancelled = false;

  let timeoutId:
    | ReturnType<typeof setTimeout>
    | null = null;

  const promise =
    new Promise<void>((resolve) => {
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

  const pendingCancels: Array<
    () => void
  > = [];

  const timelines: gsap.core.Timeline[] =
    [];

  async function run() {
    try {
      /* =================================================================== */
      /* RESET                                                               */
      /* =================================================================== */

      store.setState({
        introStep: 'black',
        introComplete: false,
        interactionLocked: true,
        typewriterActive: false,
        typewriterComplete: false,
        dialogueId: 'intro',
      });

      if (cancelled) return;

      /* =================================================================== */
      /* 1 — LOGO                                                            */
      /* =================================================================== */

      store
        .getState()
        .setIntroStep('logo');

      gsap.set(
        INTRO_SELECTORS.preloaderLogo,
        {
          opacity: 0,
          y: 8,
          filter: 'blur(5px)',
        },
      );

      await new Promise<void>(
        (resolve) => {
          gsap.to(
            INTRO_SELECTORS.preloaderLogo,
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration:
                INTRO_CONFIG.intro.logoDuration,
              ease: 'power3.out',
              onComplete: resolve,
            },
          );
        },
      );

      if (cancelled) return;

      /* =================================================================== */
      /* 2 — LOADER                                                          */
      /* =================================================================== */

      store
        .getState()
        .setIntroStep('loading');

      await new Promise<void>(
        (resolve) => {
          gsap.to(
            INTRO_SELECTORS.loadingIndicator,
            {
              opacity: 1,
              duration:
                INTRO_CONFIG.intro.loadingDuration,
              ease: 'power2.out',
              onComplete: resolve,
            },
          );
        },
      );

      if (cancelled) return;

      /* =================================================================== */
      /* 3 — WAIT FOR LOADING THRESHOLD                                      */
      /* =================================================================== */

      const dialogueStartWait =
        waitForCondition(
          () =>
            useAppStore
              .getState()
              .loadProgress >= 0.15,
            10000,
        );

      pendingCancels.push(
        dialogueStartWait.cancel,
      );

      await dialogueStartWait.promise;

      if (cancelled) return;

      /* =================================================================== */
      /* 4, 5 & 6 — UNIFIED REVEAL, PANEL & INSTANT FIRST MESSAGE TRIGGER    */
      /* =================================================================== */

      store
        .getState()
        .setIntroStep('background');

      const reveal =
        gsap.timeline();

      timelines.push(reveal);

      const sceneStage =
        getElements(
          INTRO_SELECTORS.sceneStage,
        );

      const header =
        getElements(
          INTRO_SELECTORS.header,
        );

      const footer =
        getElements(
          INTRO_SELECTORS.footerControls,
        );

      const dialoguePanel =
        getElements(
          INTRO_SELECTORS.dialoguePanel,
        );

      gsap.set(
        sceneStage,
        {
          opacity: 0.45,
          scale: 0.985,
        },
      );

      gsap.set(
        header,
        {
          opacity: 0,
          y: -7,
        },
      );

      gsap.set(
        footer,
        {
          opacity: 0,
          y: 6,
        },
      );

      gsap.set(
        dialoguePanel,
        {
          opacity: 0,
          x: -10,
          filter: 'blur(4px)',
        },
      );

      store
        .getState()
        .setIntroStep('typewriter');

      store
        .getState()
        .startTypewriter('intro');

      reveal
        .to(
          INTRO_SELECTORS.blackOverlay,
          {
            opacity: 0,
            duration:
              INTRO_CONFIG.intro
                .backgroundRevealDuration,
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
            duration:
              INTRO_CONFIG.intro
                .sceneRevealDuration,
            ease: 'power3.out',
          },
          0,
        )
        .to(
          dialoguePanel,
          {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration:
              INTRO_CONFIG.intro
                .dialogueRevealDuration,
            ease: 'power3.out',
          },
          0.05,
        )
        .to(
          header,
          {
            opacity: 1,
            y: 0,
            duration:
              INTRO_CONFIG.intro
                .headerRevealDuration,
            ease: 'power2.out',
          },
          0.1,
        )
        .to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration:
              INTRO_CONFIG.intro
                .footerRevealDuration,
            ease: 'power2.out',
          },
          0.15,
        );

      await new Promise<void>(
        (resolve) => {
          reveal.eventCallback(
            'onComplete',
            resolve,
          );
        },
      );

      if (cancelled) return;

      const firstTypewriterWait =
        waitForCondition(
          () =>
            useAppStore
              .getState()
              .typewriterComplete,
          12000,
        );

      pendingCancels.push(
        firstTypewriterWait.cancel,
      );

      await firstTypewriterWait.promise;

      if (cancelled) return;

      /* =================================================================== */
      /* 7 — HOLD FIRST MESSAGE                                              */
      /* =================================================================== */

      const firstHold =
        wait(
          INTRO_CONFIG.transition
            .messageHold,
        );

      pendingCancels.push(
        firstHold.cancel,
      );

      await firstHold.promise;

      if (cancelled) return;

      /* =================================================================== */
      /* 8 — START SECOND DIALOGUE                                           */
      /* =================================================================== */

      store
        .getState()
        .setIntroStep('transition');

      store
        .getState()
        .startTypewriter('assistant');

      const previousMounted =
        waitForElement(
          INTRO_SELECTORS.dialoguePrevious,
          2000,
        );

      pendingCancels.push(
        previousMounted.cancel,
      );

      await previousMounted.promise;

      if (cancelled) return;

      /* =================================================================== */
      /* 9 — OLD DIALOGUE MOVES BACKWARD                                    */
      /* =================================================================== */

      const previousMessage =
        getElements(
          INTRO_SELECTORS.dialoguePrevious,
        );

      const previousTimeline =
        gsap.timeline();

      timelines.push(
        previousTimeline,
      );

      gsap.set(
        previousMessage,
        {
          opacity:
            INTRO_CONFIG.dialogue
              .previousOpacity,
          y: 0,
          filter: `blur(${INTRO_CONFIG.dialogue.previousBlur}px)`,
          scale: 0.985,
        },
      );

      previousTimeline.to(
        previousMessage,
        {
          opacity: 0.18,
          y:
            INTRO_CONFIG.dialogue
              .previousOffset,
          filter: `blur(${INTRO_CONFIG.dialogue.previousBlur * 1.2}px)`,
          scale:
            INTRO_CONFIG.dialogue
              .previousScale,
          duration:
            INTRO_CONFIG.transition
              .previousMessageDuration,
          ease: 'power2.inOut',
        },
      );

      await new Promise<void>(
        (resolve) => {
          previousTimeline.eventCallback(
            'onComplete',
            resolve,
          );
        },
      );

      if (cancelled) return;

      /* =================================================================== */
      /* 10 — VERY SHORT GLITCH                                              */
      /* =================================================================== */

      const glitch =
        gsap.timeline();

      timelines.push(glitch);

      const halfGlitch =
        INTRO_CONFIG.transition
          .glitchDuration / 2;

      glitch
        .set(
          INTRO_SELECTORS.glitchOverlay,
          {
            display: 'block',
            opacity: 0,
          },
        )
        .to(
          INTRO_SELECTORS.glitchOverlay,
          {
            opacity: 0.38,
            duration:
              halfGlitch * 0.35,
            ease: 'steps(1)',
          },
        )
        .to(
          INTRO_SELECTORS.dialoguePanel,
          {
            x: 2,
            skewX: -1,
            duration:
              halfGlitch * 0.25,
            ease: 'none',
          },
          '<',
        )
        .to(
          INTRO_SELECTORS.glitchOverlay,
          {
            opacity: 0.08,
            duration:
              halfGlitch * 0.25,
            ease: 'none',
          },
        )
        .to(
          INTRO_SELECTORS.dialoguePanel,
          {
            x: -1,
            skewX: 0.6,
            duration:
              halfGlitch * 0.25,
            ease: 'none',
          },
          '<',
        )
        .to(
          INTRO_SELECTORS.glitchOverlay,
          {
            opacity: 0,
            duration:
              halfGlitch * 0.5,
            ease: 'power2.out',
          },
        )
        .to(
          INTRO_SELECTORS.dialoguePanel,
          {
            x: 0,
            skewX: 0,
            duration:
              halfGlitch * 0.5,
            ease: 'power2.out',
          },
          '<',
        )
        .set(
          INTRO_SELECTORS.glitchOverlay,
          {
            display: 'none',
          },
        );

      await new Promise<void>(
        (resolve) => {
          glitch.eventCallback(
            'onComplete',
            resolve,
          );
        },
      );

      if (cancelled) return;

      /* =================================================================== */
      /* 11 — SECOND MESSAGE FOREGROUND REVEAL                             */
      /* =================================================================== */

      const startDelay =
        wait(35);

      pendingCancels.push(
        startDelay.cancel,
      );

      await startDelay.promise;

      if (cancelled) return;

      store
        .getState()
        .setIntroStep('typewriter');

      const activeMessage =
        getElements(
          INTRO_SELECTORS.dialogueActive,
        );

      gsap.set(
        activeMessage,
        {
          opacity: 0,
          y: 7,
          filter: 'blur(3px)',
        },
      );

      gsap.to(
        activeMessage,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration:
            INTRO_CONFIG.transition
              .newMessageRevealDuration,
          ease: 'power3.out',
        },
      );

      const secondTypewriterWait =
        waitForCondition(
          () =>
            useAppStore
              .getState()
              .typewriterComplete,
          12000,
        );

      pendingCancels.push(
        secondTypewriterWait.cancel,
      );

      await secondTypewriterWait.promise;

      if (cancelled) return;

      /* =================================================================== */
      /* 12 — SECOND MESSAGE HOLD                                            */
      /* =================================================================== */

      const secondHold =
        wait(220);

      pendingCancels.push(
        secondHold.cancel,
      );

      await secondHold.promise;

      if (cancelled) return;

      /* =================================================================== */
      /* 13 — CTA                                                            */
      /* =================================================================== */

      store
        .getState()
        .setIntroStep('cta');

      const ctaParent =
        getElements(
          INTRO_SELECTORS.ctaButtons,
        );

      const ctaItems =
        getElements(
          INTRO_SELECTORS.ctaItems,
        );

      gsap.set(
        ctaParent,
        {
          opacity: 0,
          y: 5,
        },
      );

      gsap.set(
        ctaItems,
        {
          opacity: 0,
          y:
            INTRO_CONFIG.cta.entranceY,
          scale:
            INTRO_CONFIG.cta.entranceScale,
        },
      );

      const ctaTimeline =
        gsap.timeline();

      timelines.push(
        ctaTimeline,
      );

      ctaTimeline
        .to(
          ctaParent,
          {
            opacity: 1,
            y: 0,
            duration: 0.18,
            ease: 'power2.out',
          },
        )
        .to(
          ctaItems,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration:
              INTRO_CONFIG.cta
                .entranceDuration,
            stagger:
              INTRO_CONFIG.cta
                .stagger,
            ease: 'power3.out',
          },
          '-=0.04',
        );

      await new Promise<void>(
        (resolve) => {
          ctaTimeline.eventCallback(
            'onComplete',
            resolve,
          );
        },
      );

      if (cancelled) return;

      /* =================================================================== */
      /* 14 — IDLE                                                           */
      /* =================================================================== */

      store
        .getState()
        .completeIntro();
    } catch (error) {
      console.error(
        '[Intro] Sequence failed:',
        error,
      );

      if (!cancelled) {
        store
          .getState()
          .completeIntro();
      }
    }
  }

  run();

  /* ======================================================================= */
  /* CLEANUP                                                                 */
  /* ======================================================================= */

  return () => {
    cancelled = true;

    pendingCancels.forEach(
      (cancel) => cancel(),
    );

    timelines.forEach(
      (timeline) => timeline.kill(),
    );

    Object.values(
      INTRO_SELECTORS,
    ).forEach((selector) => {
      gsap.killTweensOf(selector);
    });
  };
}