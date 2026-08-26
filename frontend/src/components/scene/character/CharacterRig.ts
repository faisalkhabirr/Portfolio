import * as THREE from 'three';
import type { Mesh } from 'three';

export const MODEL_PATH =
  '/assets/models/deadpool_fully_rigged_with_facial_rig.glb';

export const BONE_NAMES = {
  hips: 'C_Spine00_Hips_XB_03',

  lumbar01: 'C_Spine01_Lumbar01_XB_04',
  lumbar02: 'C_Spine02_Lumbar02_XB_05',
  thoracic01: 'C_Spine03_Thoracic01_XB_06',
  thoracic02: 'C_Spine04_Thoracic02_XB_07',

  neck01: 'C_Spine05_Neck01_XB_08',
  neck02: 'C_Spine06_Neck02_XB_09',
  head: 'C_Spine08_Head_XB_010',

  leftClavicle: 'L_Arm01_Clav_XB_043',
  leftShoulder: 'L_Arm02_Shoulder_XB_044',
  leftElbow: 'L_Arm03_Elbow_XB_045',
  leftHand: 'L_Arm04_Hand_XB_046',

  rightClavicle: 'R_Arm01_Clav_XB_069',
  rightShoulder: 'R_Arm02_Shoulder_XB_070',
  rightElbow: 'R_Arm03_Elbow_XB_071',
  rightHand: 'R_Arm04_Hand_XB_072',

  leftEye: 'L_Face04_Eye_XF1_015',
  rightEye: 'R_Face04_Eye_XF1_025',

  leftUpperLid: 'L_Face02_EyelidUp_XF1_013',
  leftLowerLid: 'L_Face03_EyelidDn_XF1_014',

  rightUpperLid: 'R_Face02_EyelidUp_XF1_024',
  rightLowerLid: 'R_Face03_EyelidDn_XF1_026',
} as const;

export type BoneName = (typeof BONE_NAMES)[keyof typeof BONE_NAMES];

export interface TrackedBone {
  bone: THREE.Bone;
  restQuaternion: THREE.Quaternion;
  restPosition: THREE.Vector3;
}

export interface BlinkMorph {
  mesh: THREE.Mesh;
  indices: number[];
}

export interface CharacterRig {
  scene: THREE.Object3D;
  bones: Record<string, TrackedBone | null>;
  blinkMorphs: BlinkMorph[];
}

const LOWER_BODY_NAME =
  /hip|pelvis|leg|thigh|calf|shin|foot|toe|knee|ankle/i;

export function getBone(
  root: THREE.Object3D,
  name: string,
): THREE.Bone | null {
  const object = root.getObjectByName(name);

  if (!object || !(object as THREE.Bone).isBone) {
    return null;
  }

  return object as THREE.Bone;
}

export function collectBones(root: THREE.Object3D): THREE.Bone[] {
  const bones: THREE.Bone[] = [];

  root.traverse((object) => {
    if ((object as THREE.Bone).isBone) {
      bones.push(object as THREE.Bone);
    }
  });

  return bones;
}

function makeTrackedBone(bone: THREE.Bone | null): TrackedBone | null {
  if (!bone) return null;

  return {
    bone,
    restQuaternion: bone.quaternion.clone(),
    restPosition: bone.position.clone(),
  };
}

const BLINK_MORPH =
  /blink|eye.?close|eyelid|wink|eye_close|eyesclosed/i;

export function findBlinkMorphs(root: THREE.Object3D): BlinkMorph[] {
  const morphs: BlinkMorph[] = [];

  root.traverse((object) => {
    const mesh = object as Mesh;

    if (!mesh.isMesh) return;

    const dictionary = mesh.morphTargetDictionary;
    if (!dictionary) return;

    const indices = Object.entries(dictionary)
      .filter(([name]) => BLINK_MORPH.test(name))
      .map(([, index]) => index);

    if (indices.length > 0) {
      morphs.push({ mesh, indices });
    }
  });

  return morphs;
}

export function extractRig(scene: THREE.Object3D): CharacterRig {
  const bones: CharacterRig['bones'] = {};

  (Object.keys(BONE_NAMES) as (keyof typeof BONE_NAMES)[]).forEach(
    (key) => {
      bones[key] = makeTrackedBone(getBone(scene, BONE_NAMES[key]));
    },
  );

  const named = new Set(Object.values(BONE_NAMES));

  collectBones(scene).forEach((bone) => {
    if (named.has(bone.name as BoneName)) return;
    if (!LOWER_BODY_NAME.test(bone.name)) return;
    bones[bone.name] = makeTrackedBone(bone);
  });

  return {
    scene,
    bones,
    blinkMorphs: findBlinkMorphs(scene),
  };
}

export function captureRestPose(rig: CharacterRig) {
  Object.values(rig.bones).forEach((tracked) => {
    if (!tracked) return;
    tracked.restQuaternion.copy(tracked.bone.quaternion);
    tracked.restPosition.copy(tracked.bone.position);
  });
}

export function restoreBone(tracked: TrackedBone) {
  tracked.bone.quaternion.copy(tracked.restQuaternion);
  tracked.bone.position.copy(tracked.restPosition);
}

export function lockLowerBody(rig: CharacterRig) {
  const hips = rig.bones.hips;
  if (hips) restoreBone(hips);

  Object.entries(rig.bones).forEach(([key, tracked]) => {
    if (!tracked) return;
    if (key === 'hips') return;
    if (
      key === 'lumbar01' ||
      key === 'lumbar02' ||
      LOWER_BODY_NAME.test(key) ||
      LOWER_BODY_NAME.test(tracked.bone.name)
    ) {
      restoreBone(tracked);
    }
  });
}

const _parentWorld = new THREE.Quaternion();
const _inverseParent = new THREE.Quaternion();
const _localDelta = new THREE.Quaternion();

/**
 * Applies a world-space rotational delta while preserving the bone's
 * current local rig orientation. Safe for setup and the render loop
 * (no per-call allocations).
 */
export function applyWorldRotationDelta(
  bone: THREE.Bone,
  deltaWorld: THREE.Quaternion,
) {
  if (!bone.parent) {
    bone.quaternion.premultiply(deltaWorld).normalize();
    return;
  }

  bone.parent.getWorldQuaternion(_parentWorld);
  _inverseParent.copy(_parentWorld).invert();

  _localDelta
    .copy(_inverseParent)
    .multiply(deltaWorld)
    .multiply(_parentWorld);

  bone.quaternion.premultiply(_localDelta).normalize();
}

const _worldDelta = new THREE.Quaternion();
const _lookEuler = new THREE.Euler();

/**
 * Restores a bone to its captured rest pose, then adds a world-space
 * yaw/pitch look offset. Local bone axes therefore do not need to match
 * world Y-up.
 */
export function applyWorldLookFromRest(
  tracked: TrackedBone,
  yaw: number,
  pitch: number,
) {
  tracked.bone.quaternion.copy(tracked.restQuaternion);
  _lookEuler.set(pitch, yaw, 0, 'YXZ');
  _worldDelta.setFromEuler(_lookEuler);
  applyWorldRotationDelta(tracked.bone, _worldDelta);
}

const _left = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _toCam = new THREE.Vector3();
const _origin = new THREE.Vector3();

export function computeFaceDirection(
  rig: CharacterRig,
  out: THREE.Vector3,
): THREE.Vector3 {
  const leftEye = rig.bones.leftEye?.bone;
  const rightEye = rig.bones.rightEye?.bone;

  if (leftEye && rightEye) {
    leftEye.getWorldPosition(_left);
    rightEye.getWorldPosition(_right);
    out.subVectors(_left, _right);
    _up.set(0, 1, 0);
    out.cross(_up);

    if (out.lengthSq() > 1e-8) {
      return out.normalize();
    }
  }

  const head = rig.bones.head?.bone;
  if (head) {
    head.getWorldDirection(out);
    return out.normalize();
  }

  return out.set(0, 0, 1);
}

export function orientRootToFaceCamera(
  root: THREE.Object3D,
  camera: THREE.Camera,
  rig: CharacterRig,
) {
  root.updateMatrixWorld(true);

  const face = computeFaceDirection(rig, _toCam);
  face.y = 0;

  if (face.lengthSq() < 1e-8) return;
  face.normalize();

  if (rig.bones.head) {
    rig.bones.head.bone.getWorldPosition(_origin);
  } else {
    _origin.set(0, 0, 0);
  }

  camera.getWorldPosition(_left);
  _left.sub(_origin);
  _left.y = 0;

  if (_left.lengthSq() < 1e-8) return;
  _left.normalize();

  const yaw =
    Math.atan2(_left.x, _left.z) - Math.atan2(face.x, face.z);

  root.rotation.y += yaw;
  root.updateMatrixWorld(true);
}
