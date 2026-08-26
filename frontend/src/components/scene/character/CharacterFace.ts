import * as THREE from 'three';
import {
  applyWorldLookFromRest,
  applyWorldRotationDelta,
  type CharacterRig,
} from './CharacterRig';

export interface FaceState {
  eyeYaw: number;
  eyePitch: number;
  blink: number;
  blinkTimer: number;
  blinkDuration: number;
  closing: boolean;
  doubleQueued: boolean;
}

export function createFaceState(): FaceState {
  return {
    eyeYaw: 0,
    eyePitch: 0,
    blink: 0,
    blinkTimer: 1.6 + Math.random() * 2.4,
    blinkDuration: 0.09,
    closing: false,
    doubleQueued: false,
  };
}

const MAX_EYE_YAW = THREE.MathUtils.degToRad(12);
const MAX_EYE_PITCH = THREE.MathUtils.degToRad(9);
const LID_CLOSE = THREE.MathUtils.degToRad(42);

const _axis = new THREE.Vector3();
const _lidDelta = new THREE.Quaternion();

function nextBlinkDelay() {
  return 2.1 + Math.random() * 3.8;
}

function applyBlinkMorphs(rig: CharacterRig, amount: number) {
  for (let i = 0; i < rig.blinkMorphs.length; i++) {
    const entry = rig.blinkMorphs[i];
    const influences = entry.mesh.morphTargetInfluences;
    if (!influences) continue;

    for (let j = 0; j < entry.indices.length; j++) {
      influences[entry.indices[j]] = amount;
    }
  }
}

function applyLidBlink(
  rig: CharacterRig,
  amount: number,
) {
  const pairs: Array<[
    'leftUpperLid' | 'rightUpperLid',
    'leftLowerLid' | 'rightLowerLid',
    'leftEye' | 'rightEye',
  ]> = [
    ['leftUpperLid', 'leftLowerLid', 'leftEye'],
    ['rightUpperLid', 'rightLowerLid', 'rightEye'],
  ];

  for (let i = 0; i < pairs.length; i++) {
    const [upperKey, lowerKey, eyeKey] = pairs[i];
    const upper = rig.bones[upperKey];
    const lower = rig.bones[lowerKey];
    const eye = rig.bones[eyeKey];

    if (upper) {
      upper.bone.quaternion.copy(upper.restQuaternion);
    }
    if (lower) {
      lower.bone.quaternion.copy(lower.restQuaternion);
    }

    if (amount < 0.001 || !eye) continue;

    eye.bone.updateWorldMatrix(true, false);
    _axis.set(1, 0, 0).transformDirection(eye.bone.matrixWorld).normalize();

    if (upper) {
      _lidDelta.setFromAxisAngle(_axis, LID_CLOSE * amount);
      applyWorldRotationDelta(upper.bone, _lidDelta);
    }

    if (lower) {
      _lidDelta.setFromAxisAngle(_axis, -LID_CLOSE * 0.28 * amount);
      applyWorldRotationDelta(lower.bone, _lidDelta);
    }
  }
}

function updateBlink(state: FaceState, delta: number) {
  if (state.closing || state.blink > 0) {
    const speed = 1 / Math.max(state.blinkDuration, 0.04);

    if (state.closing) {
      state.blink = Math.min(1, state.blink + delta * speed * 2.4);

      if (state.blink >= 1) {
        state.closing = false;
      }
    } else {
      state.blink = Math.max(0, state.blink - delta * speed * 1.8);

      if (state.blink <= 0) {
        if (state.doubleQueued) {
          state.doubleQueued = false;
          state.closing = true;
          state.blinkDuration = 0.07;
        } else {
          state.blinkTimer = nextBlinkDelay();
        }
      }
    }

    return;
  }

  state.blinkTimer -= delta;

  if (state.blinkTimer <= 0) {
    state.closing = true;
    state.blinkDuration = 0.08 + Math.random() * 0.05;
    state.doubleQueued = Math.random() < 0.18;
  }
}

/**
 * Eyes follow the pointer in world space (clamped) and a continuous
 * blink loop drives eyelid bones plus any blink morph targets.
 */
export function updateFace(
  rig: CharacterRig,
  state: FaceState,
  pointerX: number,
  pointerY: number,
  delta: number,
) {
  const x = THREE.MathUtils.clamp(pointerX, -1, 1);
  const y = THREE.MathUtils.clamp(pointerY, -1, 1);

  state.eyeYaw = THREE.MathUtils.damp(
    state.eyeYaw,
    x * MAX_EYE_YAW,
    14,
    delta,
  );
  state.eyePitch = THREE.MathUtils.damp(
    state.eyePitch,
    y * MAX_EYE_PITCH,
    14,
    delta,
  );

  const leftEye = rig.bones.leftEye;
  const rightEye = rig.bones.rightEye;

  if (leftEye) {
    applyWorldLookFromRest(leftEye, state.eyeYaw, state.eyePitch);
  }
  if (rightEye) {
    applyWorldLookFromRest(rightEye, state.eyeYaw, state.eyePitch);
  }

  updateBlink(state, delta);
  applyLidBlink(rig, state.blink);
  applyBlinkMorphs(rig, state.blink);
}
