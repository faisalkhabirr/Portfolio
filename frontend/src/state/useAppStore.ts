import { create } from 'zustand';
import * as THREE from 'three';

import type {
  InspectionReport,
} from '../three/inspectors/GLTFInspector';

interface ModelBounds {
  size: THREE.Vector3;
  center: THREE.Vector3;
}

interface PerfState {
  fps: number;
  drawCalls: number;
  triangles: number;
}

export type IntroStep =
  | 'black'
  | 'logo'
  | 'loading'
  | 'background'
  | 'character'
  | 'dialogue'
  | 'typewriter'
  | 'transition'
  | 'cta'
  | 'idle';

export type DialogueId =
  | 'intro'
  | 'assistant';

interface AppState {
  /* ------------------------------------------------------------------ */
  /* MODEL                                                              */
  /* ------------------------------------------------------------------ */

  modelLoaded: boolean;

  modelBounds:
    | ModelBounds
    | null;

  setModelLoaded: (
    loaded: boolean,
    bounds?: ModelBounds,
  ) => void;

  /* ------------------------------------------------------------------ */
  /* INSPECTION                                                         */
  /* ------------------------------------------------------------------ */

  inspection:
    | InspectionReport
    | null;

  setInspection: (
    report: InspectionReport,
  ) => void;

  /* ------------------------------------------------------------------ */
  /* PERFORMANCE                                                        */
  /* ------------------------------------------------------------------ */

  perf: PerfState;

  setPerf: (
    perf: Partial<PerfState>,
  ) => void;

  /* ------------------------------------------------------------------ */
  /* POINTER                                                            */
  /* ------------------------------------------------------------------ */

  pointerX: number;
  pointerY: number;

  setPointer: (
    x: number,
    y: number,
  ) => void;

  /* ------------------------------------------------------------------ */
  /* INTRO                                                              */
  /* ------------------------------------------------------------------ */

  introStep: IntroStep;

  introComplete: boolean;

  interactionLocked: boolean;

  assetsReady: boolean;

  loadProgress: number;

  /* ------------------------------------------------------------------ */
  /* MOBILE CINEMATIC                                                    */
  /* ------------------------------------------------------------------ */

  /*
   * 0 = mobile opening state
   * 1 = final close-up state
   *
   * CharacterModel reads this inside useFrame without subscribing
   * Reactively, so there is no per-frame React re-render.
   */
  mobileCinematicProgress: number;

  setMobileCinematicProgress: (
    progress: number,
  ) => void;

  /* ------------------------------------------------------------------ */
  /* DIALOGUE / TYPEWRITER                                              */
  /* ------------------------------------------------------------------ */

  dialogueId: DialogueId;

  typewriterActive: boolean;

  typewriterComplete: boolean;

  typewriterRunId: number;

  /* ------------------------------------------------------------------ */
  /* ACTIONS                                                            */
  /* ------------------------------------------------------------------ */

  setIntroStep: (
    step: IntroStep,
  ) => void;

  setAssetsReady: (
    ready: boolean,
  ) => void;

  setLoadProgress: (
    progress: number,
  ) => void;

  setDialogueId: (
    dialogueId: DialogueId,
  ) => void;

  startTypewriter: (
    dialogueId: DialogueId,
  ) => void;

  setTypewriterComplete: (
    complete: boolean,
  ) => void;

  completeIntro: () => void;

  /* ------------------------------------------------------------------ */
  /* THEME                                                               */
  /* ------------------------------------------------------------------ */

  theme: 'dark' | 'light';

  toggleTheme: () => void;

  /* ------------------------------------------------------------------ */
  /* CONTACT OVERLAY                                                     */
  /* ------------------------------------------------------------------ */
  //
  // Shared so both GlobalHeader's "Let's talk" and DialoguePanel's
  // "Get in touch" can open the exact same full-screen overlay without
  // prop-drilling between two unrelated component trees.

  isContactOpen: boolean;

  openContact: () => void;

  closeContact: () => void;
}

export const useAppStore =
  create<AppState>((set) => ({
    /* ================================================================== */
    /* MODEL                                                              */
    /* ================================================================== */

    modelLoaded: false,

    modelBounds: null,

    setModelLoaded: (
      loaded,
      bounds,
    ) =>
      set({
        modelLoaded: loaded,
        modelBounds:
          bounds ?? null,

        /*
         * Deadpool is currently the primary visual asset.
         *
         * IMPORTANT:
         * Do not overwrite loadProgress here.
         * SceneCanvas/useProgress owns the real loading percentage.
         */
        assetsReady: loaded,
      }),

    /* ================================================================== */
    /* INSPECTION                                                         */
    /* ================================================================== */

    inspection: null,

    setInspection: (report) =>
      set({
        inspection: report,
      }),

    /* ================================================================== */
    /* PERFORMANCE                                                        */
    /* ================================================================== */

    perf: {
      fps: 0,
      drawCalls: 0,
      triangles: 0,
    },

    setPerf: (perf) =>
      set((state) => ({
        perf: {
          ...state.perf,
          ...perf,
        },
      })),

    /* ================================================================== */
    /* POINTER                                                            */
    /* ================================================================== */

    pointerX: 0,

    pointerY: 0,

    setPointer: (
      x,
      y,
    ) =>
      set({
        pointerX: x,
        pointerY: y,
      }),

    /* ================================================================== */
    /* INTRO                                                              */
    /* ================================================================== */

    introStep: 'black',

    introComplete: false,

    interactionLocked: true,

    assetsReady: false,

    loadProgress: 0,

    /* ================================================================== */
    /* MOBILE CINEMATIC                                                   */
    /* ================================================================== */

    mobileCinematicProgress: 0,

    setMobileCinematicProgress: (
      progress,
    ) =>
      set({
        mobileCinematicProgress:
          THREE.MathUtils.clamp(
            progress,
            0,
            1,
          ),
      }),

    /* ================================================================== */
    /* DIALOGUE                                                           */
    /* ================================================================== */

    dialogueId: 'intro',

    typewriterActive: false,

    typewriterComplete: false,

    typewriterRunId: 0,

    /* ================================================================== */
    /* INTRO ACTIONS                                                      */
    /* ================================================================== */

    setIntroStep: (
      step,
    ) =>
      set({
        introStep: step,
      }),

    setAssetsReady: (
      ready,
    ) =>
      set({
        assetsReady: ready,
      }),

    setLoadProgress: (
      progress,
    ) =>
      set({
        loadProgress:
          THREE.MathUtils.clamp(
            progress,
            0,
            1,
          ),
      }),

    setDialogueId: (
      dialogueId,
    ) =>
      set({
        dialogueId,
      }),

    startTypewriter: (
      dialogueId,
    ) =>
      set((state) => ({
        dialogueId,

        typewriterActive:
          true,

        typewriterComplete:
          false,

        typewriterRunId:
          state.typewriterRunId + 1,
      })),

    setTypewriterComplete: (
      complete,
    ) =>
      set({
        typewriterComplete:
          complete,
      }),

    completeIntro: () =>
      set({
        introComplete: true,
        interactionLocked: false,
        introStep: 'idle',
        typewriterActive: false,
        typewriterComplete: true,
      }),

    /* ================================================================== */
    /* THEME                                                               */
    /* ================================================================== */

    theme: 'dark',

    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
      }),

    /* ================================================================== */
    /* CONTACT OVERLAY                                                     */
    /* ================================================================== */

    isContactOpen: false,

    openContact: () =>
      set({ isContactOpen: true }),

    closeContact: () =>
      set({ isContactOpen: false }),
  }));
