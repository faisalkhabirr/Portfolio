import * as THREE from 'three';
import {
  applyWorldLookFromRest,
  lockLowerBody,
  type CharacterRig,
} from './CharacterRig';
import type { IdleOffsets } from './CharacterIdle';

export interface TrackingState {
  spineYaw: number;
  spinePitch: number;
  chestYaw: number;
  chestPitch: number;
  shoulderYaw: number;
  shoulderPitch: number;
  headYaw: number;
  headPitch: number;
  lumbarYaw: number;
  lumbarPitch: number;
  hipsYaw: number;
  hipsPitch: number;
}

export function createTrackingState(): TrackingState {
  return {
    spineYaw: 0,
    spinePitch: 0,
    chestYaw: 0,
    chestPitch: 0,
    shoulderYaw: 0,
    shoulderPitch: 0,
    headYaw: 0,
    headPitch: 0,
    lumbarYaw: 0,
    lumbarPitch: 0,
    hipsYaw: 0,
    hipsPitch: 0,
  };
}

// ── Range limits ──────────────────────────────────────────────────────────────
// Full body follow: torso gets a generous arc, head stays natural.
const MAX_YAW_TORSO  = THREE.MathUtils.degToRad(22);  // lumbar + thoracic
const MAX_PITCH_TORSO = THREE.MathUtils.degToRad(10);
const MAX_YAW_HEAD   = THREE.MathUtils.degToRad(30);  // head can turn further
const MAX_PITCH_HEAD  = THREE.MathUtils.degToRad(16);

/**
 * Full-body hierarchical mouse tracking.
 *
 * Hierarchy (fastest → slowest):
 *   Head (λ 11)  →  Neck (λ 8)  →  Chest/Clavicles (λ 5)
 *   →  Thoracic spine (λ 3)  →  Lumbar (λ 2) [idle-blended]
 *
 * The entire torso — lumbar through clavicles — participates in
 * mouse tracking so the whole upper body turns to follow the pointer,
 * not just the head.  Hips/legs stay fully locked.
 */
export function updateTracking(
  rig: CharacterRig,
  state: TrackingState,
  pointerX: number,
  pointerY: number,
  delta: number,
  idle: IdleOffsets,
) {
  const x = THREE.MathUtils.clamp(pointerX, -1, 1);
  const y = THREE.MathUtils.clamp(pointerY, -1, 1);

  const tgtYawTorso  = x * MAX_YAW_TORSO;
  const tgtPitchTorso = -y * MAX_PITCH_TORSO;
  const tgtYawHead   = x * MAX_YAW_HEAD;
  const tgtPitchHead  = -y * MAX_PITCH_HEAD;

  // ── Hips — root pivot (λ 1.5) ──────────────────────────────────────────────
  state.hipsYaw = THREE.MathUtils.damp(
    state.hipsYaw, tgtYawTorso * 0.15, 1.5, delta,
  );
  state.hipsPitch = THREE.MathUtils.damp(
    state.hipsPitch, tgtPitchTorso * 0.10, 1.5, delta,
  );

  // ── Lumbar — slowest, anchors the low spine (λ 2) ────────────────────────
  state.lumbarYaw = THREE.MathUtils.damp(
    state.lumbarYaw, tgtYawTorso * 0.25, 2.0, delta,
  );
  state.lumbarPitch = THREE.MathUtils.damp(
    state.lumbarPitch, tgtPitchTorso * 0.20, 2.0, delta,
  );

  // ── Thoracic spine — medium-slow (λ 3) ───────────────────────────────────
  state.spineYaw = THREE.MathUtils.damp(
    state.spineYaw, tgtYawTorso * 0.45, 3.0, delta,
  );
  state.spinePitch = THREE.MathUtils.damp(
    state.spinePitch, tgtPitchTorso * 0.35, 3.0, delta,
  );

  // ── Chest / upper thoracic — medium (λ 5) ────────────────────────────────
  state.chestYaw = THREE.MathUtils.damp(
    state.chestYaw, tgtYawTorso * 0.65, 5.0, delta,
  );
  state.chestPitch = THREE.MathUtils.damp(
    state.chestPitch, tgtPitchTorso * 0.50, 5.0, delta,
  );

  // ── Shoulders / clavicles — medium (λ 5) ─────────────────────────────────
  state.shoulderYaw = THREE.MathUtils.damp(
    state.shoulderYaw, tgtYawTorso * 0.30, 5.0, delta,
  );
  state.shoulderPitch = THREE.MathUtils.damp(
    state.shoulderPitch, tgtPitchTorso * 0.22, 5.0, delta,
  );

  // ── Head — fastest (λ 11) ─────────────────────────────────────────────────
  state.headYaw = THREE.MathUtils.damp(
    state.headYaw, tgtYawHead, 11, delta,
  );
  state.headPitch = THREE.MathUtils.damp(
    state.headPitch, tgtPitchHead, 11, delta,
  );

  // Lock pelvis + all lower body at rest pose FIRST, before we apply upper body tracking
  lockLowerBody(rig);

  // ── Apply to bones ────────────────────────────────────────────────────────

  // Hips
  const hips = rig.bones.hips;
  if (hips) {
    applyWorldLookFromRest(
      hips,
      state.hipsYaw,
      state.hipsPitch,
    );
  }

  // Lumbar — idle only on top of mouse torso
  const lumbar01 = rig.bones.lumbar01;
  if (lumbar01) {
    applyWorldLookFromRest(
      lumbar01,
      state.lumbarYaw + idle.lumbarYaw * 0.55,
      state.lumbarPitch + idle.lumbarPitch * 0.55,
    );
  }

  const lumbar02 = rig.bones.lumbar02;
  if (lumbar02) {
    applyWorldLookFromRest(
      lumbar02,
      state.lumbarYaw * 1.2 + idle.lumbarYaw,
      state.lumbarPitch * 1.2 + idle.lumbarPitch,
    );
  }

  // Thoracic spine
  const thoracic01 = rig.bones.thoracic01;
  if (thoracic01) {
    applyWorldLookFromRest(
      thoracic01,
      state.spineYaw + idle.spineYaw,
      state.spinePitch + idle.spinePitch,
    );
  }

  // Chest
  const thoracic02 = rig.bones.thoracic02;
  if (thoracic02) {
    applyWorldLookFromRest(
      thoracic02,
      state.chestYaw + idle.chestYaw,
      state.chestPitch + idle.chestPitch,
    );
  }

  // Clavicles — follow chest with a slight lag fraction
  const leftClav = rig.bones.leftClavicle;
  if (leftClav) {
    applyWorldLookFromRest(
      leftClav,
      state.shoulderYaw + idle.chestYaw * 0.2,
      state.shoulderPitch + idle.chestPitch * 0.2,
    );
  }

  const rightClav = rig.bones.rightClavicle;
  if (rightClav) {
    applyWorldLookFromRest(
      rightClav,
      state.shoulderYaw + idle.chestYaw * 0.2,
      state.shoulderPitch + idle.chestPitch * 0.2,
    );
  }

  // Neck 01 — blends chest + head
  const neck01 = rig.bones.neck01;
  if (neck01) {
    applyWorldLookFromRest(
      neck01,
      state.chestYaw * 0.45 + idle.chestYaw * 0.3,
      state.chestPitch * 0.55 + idle.chestPitch * 0.3,
    );
  }

  // Neck 02 — blends into head
  const neck02 = rig.bones.neck02;
  if (neck02) {
    applyWorldLookFromRest(
      neck02,
      state.headYaw * 0.30,
      state.headPitch * 0.30,
    );
  }

  // Head
  const head = rig.bones.head;
  if (head) {
    applyWorldLookFromRest(
      head,
      state.headYaw + idle.spineYaw * 0.08,
      state.headPitch + idle.spinePitch * 0.08,
    );
  }
}
