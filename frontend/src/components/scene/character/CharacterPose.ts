import * as THREE from 'three';
import {
  applyWorldRotationDelta,
  computeFaceDirection,
  type CharacterRig,
} from './CharacterRig';

// ─── Scratch objects ───────────────────────────────────────────────────────────
const _axis      = new THREE.Vector3();
const _deltaQuat = new THREE.Quaternion();
const _up        = new THREE.Vector3();
const _face      = new THREE.Vector3();
const _across    = new THREE.Vector3();
const _spineQ    = new THREE.Quaternion();
const _joint     = new THREE.Vector3();
const _effector  = new THREE.Vector3();
const _toEff     = new THREE.Vector3();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rotateBoneWorld(bone: THREE.Bone, axis: THREE.Vector3, rad: number) {
  if (axis.lengthSq() < 1e-8 || Math.abs(rad) < 1e-5) return;
  _axis.copy(axis).normalize();
  _deltaQuat.setFromAxisAngle(_axis, rad);
  applyWorldRotationDelta(bone, _deltaQuat);
}

function preBendElbow(
  root: THREE.Object3D,
  shoulder: THREE.Bone,
  elbow: THREE.Bone,
  bendRad: number,
) {
  root.updateMatrixWorld(true);
  shoulder.getWorldPosition(_joint);
  elbow.getWorldPosition(_effector);
  _toEff.subVectors(_effector, _joint);

  _axis.crossVectors(_toEff, _face);
  if (_axis.lengthSq() < 1e-8) {
    _axis.crossVectors(_toEff, _up);
  }
  if (_axis.lengthSq() < 1e-8) return;

  rotateBoneWorld(elbow, _axis, bendRad);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Natural standing pose using direct world rotations to create a distinct gap from the belt.
 */
export function applyCrossedArmsPose(rig: CharacterRig) {
  const leftClavicle  = rig.bones.leftClavicle?.bone  ?? null;
  const rightClavicle = rig.bones.rightClavicle?.bone ?? null;
  const leftShoulder  = rig.bones.leftShoulder?.bone  ?? null;
  const leftElbow     = rig.bones.leftElbow?.bone     ?? null;
  const leftHand      = rig.bones.leftHand?.bone      ?? null;
  const rightShoulder = rig.bones.rightShoulder?.bone ?? null;
  const rightElbow    = rig.bones.rightElbow?.bone    ?? null;
  const rightHand     = rig.bones.rightHand?.bone     ?? null;
  const upperSpine    = rig.bones.thoracic02?.bone    ?? null;

  if (!leftShoulder || !leftElbow || !leftHand || !rightShoulder || !rightElbow || !rightHand) {
    console.warn('[CharacterPose] Pose skipped: required bones not found.');
    return;
  }

  const scene = rig.scene;
  scene.updateMatrixWorld(true);

  // ── World axes ────────────────────────────────────────────────────────────
  computeFaceDirection(rig, _face);
  _face.y = 0;
  if (_face.lengthSq() < 1e-8) _face.set(0, 0, 1);
  else _face.normalize();

  if (upperSpine) {
    upperSpine.getWorldQuaternion(_spineQ);
    _up.set(0, 1, 0).applyQuaternion(_spineQ).normalize();
  } else {
    _up.set(0, 1, 0);
  }
  _across.crossVectors(_up, _face).normalize();

  // ── Clavicles ─────────────────────────────────────────────────────────────
  if (leftClavicle) {
    rotateBoneWorld(leftClavicle, _up,    THREE.MathUtils.degToRad(-2));
    rotateBoneWorld(leftClavicle, _face,  THREE.MathUtils.degToRad(-4));
  }
  if (rightClavicle) {
    rotateBoneWorld(rightClavicle, _up,   THREE.MathUtils.degToRad(2));
    rotateBoneWorld(rightClavicle, _face, THREE.MathUtils.degToRad(4));
  }

  // ── Direct Shoulder Rotations (Guarantees movement) ───────────────────────
  // Pushing the shoulders outward and slightly forward via direct world angles
  rotateBoneWorld(leftShoulder,  _face,   THREE.MathUtils.degToRad(-14));  // Roll outward left
  rotateBoneWorld(rightShoulder, _face,   THREE.MathUtils.degToRad(14)); // Roll outward right

  rotateBoneWorld(leftShoulder,  _across, THREE.MathUtils.degToRad(-8));  // Pitch
  rotateBoneWorld(rightShoulder, _across, THREE.MathUtils.degToRad(-8));  // Pitch

  scene.updateMatrixWorld(true);

  // ── Elbows ────────────────────────────────────────────────────────
  preBendElbow(scene, leftShoulder,  leftElbow,  THREE.MathUtils.degToRad(15));
  preBendElbow(scene, rightShoulder, rightElbow, THREE.MathUtils.degToRad(15));

  scene.updateMatrixWorld(true);

  console.log(
    '%c[CharacterPose] Natural relaxed standing pose applied with direct rotation.',
    'color:#FF4F6D;font-weight:bold;',
  );
}