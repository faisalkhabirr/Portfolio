import { create } from 'zustand';
import * as THREE from 'three';
import type { InspectionReport } from '../three/inspectors/GLTFInspector';

// Phase 1 intentionally keeps this store minimal: just enough to prove the
// DOM <-> R3F bridge pattern (model load state, throttled perf readout)
// without building any of the interaction/dialogue/transition state that
// belongs to later phases. Per-frame values (pointer position, damped
// rotations) will live here too once Phase 3 starts — but they are NEVER
// read via a subscribed React hook inside a useFrame-critical path; they're
// read with store.getState() to avoid re-rendering the DOM tree every frame.

interface ModelBounds {
  size: THREE.Vector3;
  center: THREE.Vector3;
}

interface PerfState {
  fps: number;
  drawCalls: number;
  triangles: number;
}

interface AppState {
  modelLoaded: boolean;
  modelBounds: ModelBounds | null;
  setModelLoaded: (loaded: boolean, bounds?: ModelBounds) => void;

  inspection: InspectionReport | null;
  setInspection: (report: InspectionReport) => void;

  perf: PerfState;
  setPerf: (perf: Partial<PerfState>) => void;

  // Normalized pointer position, range [-1, 1] on both axes. Written on
  // every window pointermove (see hooks/usePointerTracking.ts) and read
  // inside CharacterController's useFrame via useAppStore.getState() —
  // NEVER via the reactive useAppStore(selector) hook. Nothing in this
  // codebase should subscribe to pointerX/pointerY with the hook; doing
  // so would re-render that component on every mouse move.
  pointerX: number;
  pointerY: number;
  setPointer: (x: number, y: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  modelLoaded: false,
  modelBounds: null,
  setModelLoaded: (loaded, bounds) =>
    set({ modelLoaded: loaded, modelBounds: bounds ?? null }),

  inspection: null,
  setInspection: (report) => set({ inspection: report }),

  perf: { fps: 0, drawCalls: 0, triangles: 0 },
  setPerf: (perf) =>
    set((s) => ({ perf: { ...s.perf, ...perf } })),

  pointerX: 0,
  pointerY: 0,
  setPointer: (x, y) => set({ pointerX: x, pointerY: y }),
}));
