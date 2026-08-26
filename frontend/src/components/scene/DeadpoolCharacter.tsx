import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { useAppStore } from '../../state/useAppStore';
import {
  runGLTFInspection,
  reportLoadTiming,
} from '../../three/inspectors/GLTFInspector';

const MODEL_PATH =
  '/assets/models/deadpool_fully_rigged_with_facial_rig.glb';

/*
|--------------------------------------------------------------------------
| COMPOSITION
|--------------------------------------------------------------------------
|
| These values are intentionally close to the existing CharacterModel
| implementation so Phase 3's composition remains familiar.
|
*/

const COMPOSITION_OFFSET_RATIO = 0.18;
const CAMERA_PADDING_FACTOR = 1.4;

/*
|--------------------------------------------------------------------------
| TRACKING
|--------------------------------------------------------------------------
|
| The important design principle:
|
| torso = subtle
| head  = stronger
| eyes  = fastest
|
| This makes the character feel alive without looking like the entire
| body is simply rotating toward the mouse.
|
*/

const TORSO_MAX_YAW = THREE.MathUtils.degToRad(5);
const TORSO_MAX_PITCH = THREE.MathUtils.degToRad(3);

const HEAD_MAX_YAW = THREE.MathUtils.degToRad(13);
const HEAD_MAX_PITCH = THREE.MathUtils.degToRad(7);

const EYE_MAX_YAW = THREE.MathUtils.degToRad(8);
const EYE_MAX_PITCH = THREE.MathUtils.degToRad(4);

const TORSO_DAMPING = 3.5;
const HEAD_DAMPING = 5.5;
const EYE_DAMPING = 9;

/*
|--------------------------------------------------------------------------
| BLINK
|--------------------------------------------------------------------------
|
| Deadpool's facial rig has eyelid bones, not morph targets.
|
| The values below are deliberately conservative.
| We will tune the exact direction/amount after seeing the first render.
|
*/

const UPPER_LID_BLINK = -0.55;
const LOWER_LID_BLINK = 0.28;

const BLINK_DAMPING = 22;

const MIN_BLINK_DELAY = 2.5;
const MAX_BLINK_DELAY = 5.5;


/*
|--------------------------------------------------------------------------
| EXACT BONES FOUND IN THE REAL GLB
|--------------------------------------------------------------------------
*/

const BONE_NAMES = {
  torso: 'C_Spine04_Thoracic02_XB_07',
  head: 'C_Spine08_Head_XB_010',

  leftEye: 'L_Face04_Eye_XF1_015',
  rightEye: 'R_Face04_Eye_XF1_025',

  leftUpperLid: 'L_Face02_EyelidUp_XF1_013',
  leftLowerLid: 'L_Face03_EyelidDn_XF1_014',

  rightUpperLid: 'R_Face02_EyelidUp_XF1_024',
  rightLowerLid: 'R_Face03_EyelidDn_XF1_026',
} as const;


/*
|--------------------------------------------------------------------------
| PRE-ALLOCATED MATH OBJECTS
|--------------------------------------------------------------------------
|
| Nothing below is allocated inside useFrame.
|
*/

const torsoEuler = new THREE.Euler();
const headEuler = new THREE.Euler();
const eyeEuler = new THREE.Euler();
const blinkEuler = new THREE.Euler();

const torsoDeltaQuaternion = new THREE.Quaternion();
const headDeltaQuaternion = new THREE.Quaternion();
const eyeDeltaQuaternion = new THREE.Quaternion();
const blinkQuaternion = new THREE.Quaternion();

const torsoTargetQuaternion = new THREE.Quaternion();
const headTargetQuaternion = new THREE.Quaternion();
const leftEyeTargetQuaternion = new THREE.Quaternion();
const rightEyeTargetQuaternion = new THREE.Quaternion();

const leftUpperLidTargetQuaternion = new THREE.Quaternion();
const leftLowerLidTargetQuaternion = new THREE.Quaternion();
const rightUpperLidTargetQuaternion = new THREE.Quaternion();
const rightLowerLidTargetQuaternion = new THREE.Quaternion();


export default function DeadpoolCharacter() {
  const gltf = useGLTF(MODEL_PATH);

  const { camera, size } = useThree();

  const setModelLoaded = useAppStore(
    (state) => state.setModelLoaded
  );

  const setInspection = useAppStore(
    (state) => state.setInspection
  );


  /*
  |--------------------------------------------------------------------------
  | BONE REFERENCES
  |--------------------------------------------------------------------------
  */

  const torsoRef = useRef<THREE.Object3D | null>(null);
  const headRef = useRef<THREE.Object3D | null>(null);

  const leftEyeRef = useRef<THREE.Object3D | null>(null);
  const rightEyeRef = useRef<THREE.Object3D | null>(null);

  const leftUpperLidRef =
    useRef<THREE.Object3D | null>(null);

  const leftLowerLidRef =
    useRef<THREE.Object3D | null>(null);

  const rightUpperLidRef =
    useRef<THREE.Object3D | null>(null);

  const rightLowerLidRef =
    useRef<THREE.Object3D | null>(null);


  /*
  |--------------------------------------------------------------------------
  | REST POSES
  |--------------------------------------------------------------------------
  |
  | We never overwrite the model's original rig pose.
  | Every animation is applied relative to these quaternions.
  |
  */

  const torsoRest = useRef(
    new THREE.Quaternion()
  );

  const headRest = useRef(
    new THREE.Quaternion()
  );

  const leftEyeRest = useRef(
    new THREE.Quaternion()
  );

  const rightEyeRest = useRef(
    new THREE.Quaternion()
  );

  const leftUpperLidRest = useRef(
    new THREE.Quaternion()
  );

  const leftLowerLidRest = useRef(
    new THREE.Quaternion()
  );

  const rightUpperLidRest = useRef(
    new THREE.Quaternion()
  );

  const rightLowerLidRest = useRef(
    new THREE.Quaternion()
  );


  /*
  |--------------------------------------------------------------------------
  | SMOOTH TRACKING STATE
  |--------------------------------------------------------------------------
  */

  const torsoYaw = useRef(0);
  const torsoPitch = useRef(0);

  const headYaw = useRef(0);
  const headPitch = useRef(0);

  const eyeYaw = useRef(0);
  const eyePitch = useRef(0);


  /*
  |--------------------------------------------------------------------------
  | BLINK STATE
  |--------------------------------------------------------------------------
  */

  const blinkWeight = useRef(0);
  const blinkTarget = useRef(0);

  const blinkTimer = useRef(
    MIN_BLINK_DELAY +
      Math.random() *
        (MAX_BLINK_DELAY - MIN_BLINK_DELAY)
  );

  const blinkActive = useRef(false);


  /*
  |--------------------------------------------------------------------------
  | MODEL INSPECTION + SETUP
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!gltf?.scene) return;


    /*
    ------------------------------------------------------------------------
    Find the actual bones.
    ------------------------------------------------------------------------
    */

    torsoRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.torso
      ) ?? null;

    headRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.head
      ) ?? null;

    leftEyeRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.leftEye
      ) ?? null;

    rightEyeRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.rightEye
      ) ?? null;

    leftUpperLidRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.leftUpperLid
      ) ?? null;

    leftLowerLidRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.leftLowerLid
      ) ?? null;

    rightUpperLidRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.rightUpperLid
      ) ?? null;

    rightLowerLidRef.current =
      gltf.scene.getObjectByName(
        BONE_NAMES.rightLowerLid
      ) ?? null;


    /*
    ------------------------------------------------------------------------
    Save original poses.
    ------------------------------------------------------------------------
    */

    torsoRest.current.copy(
      torsoRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    headRest.current.copy(
      headRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    leftEyeRest.current.copy(
      leftEyeRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    rightEyeRest.current.copy(
      rightEyeRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    leftUpperLidRest.current.copy(
      leftUpperLidRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    leftLowerLidRest.current.copy(
      leftLowerLidRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    rightUpperLidRest.current.copy(
      rightUpperLidRef.current?.quaternion ??
        new THREE.Quaternion()
    );

    rightLowerLidRest.current.copy(
      rightLowerLidRef.current?.quaternion ??
        new THREE.Quaternion()
    );


    /*
    ------------------------------------------------------------------------
    CENTER MODEL
    ------------------------------------------------------------------------
    */

    const box = new THREE.Box3().setFromObject(
      gltf.scene
    );

    const center = box.getCenter(
      new THREE.Vector3()
    );

    const boundsSize = box.getSize(
      new THREE.Vector3()
    );

    gltf.scene.position.sub(center);


    /*
    ------------------------------------------------------------------------
    RUN EXISTING PROJECT INSPECTION
    ------------------------------------------------------------------------
    */

    const report = runGLTFInspection(gltf);

    setInspection(report);

    setModelLoaded(true, {
      size: boundsSize,
      center,
    });

    reportLoadTiming(MODEL_PATH);


    /*
    ------------------------------------------------------------------------
    CONSOLE VERIFICATION
    ------------------------------------------------------------------------
    */

    console.group(
      '%c[Deadpool Character Rig]',
      'font-weight:bold;color:#ff304f'
    );

    console.log(
      'Torso:',
      torsoRef.current?.name ?? 'NOT FOUND'
    );

    console.log(
      'Head:',
      headRef.current?.name ?? 'NOT FOUND'
    );

    console.log(
      'Left Eye:',
      leftEyeRef.current?.name ?? 'NOT FOUND'
    );

    console.log(
      'Right Eye:',
      rightEyeRef.current?.name ?? 'NOT FOUND'
    );

    console.log(
      'Left Upper Eyelid:',
      leftUpperLidRef.current?.name ??
        'NOT FOUND'
    );

    console.log(
      'Left Lower Eyelid:',
      leftLowerLidRef.current?.name ??
        'NOT FOUND'
    );

    console.log(
      'Right Upper Eyelid:',
      rightUpperLidRef.current?.name ??
        'NOT FOUND'
    );

    console.log(
      'Right Lower Eyelid:',
      rightLowerLidRef.current?.name ??
        'NOT FOUND'
    );

    console.log(
      'Morph Targets:',
      'None'
    );

    console.log(
      'Animation Clips:',
      'None'
    );

    console.log(
      'Lower Body:',
      'LOCKED — no pelvis/leg bones modified'
    );

    console.groupEnd();

  }, [
    gltf,
    setInspection,
    setModelLoaded,
  ]);


  /*
  |--------------------------------------------------------------------------
  | CAMERA / COMPOSITION
  |--------------------------------------------------------------------------
  |
  | This preserves the behavior of your old CharacterModel.
  |
  */

  useEffect(() => {
    if (
      !gltf?.scene ||
      size.width === 0 ||
      size.height === 0
    ) {
      return;
    }

    const box = new THREE.Box3().setFromObject(
      gltf.scene
    );

    const boundsSize = box.getSize(
      new THREE.Vector3()
    );

    const maxDim = Math.max(
      boundsSize.x,
      boundsSize.y,
      boundsSize.z
    ) || 1;

    const persp =
      camera as THREE.PerspectiveCamera;

    const fovRad =
      (persp.fov * Math.PI) / 180;

    const distance =
      (maxDim /
        (2 * Math.tan(fovRad / 2))) *
      CAMERA_PADDING_FACTOR;


    persp.position.set(
      0,
      boundsSize.y * 0.05,
      distance
    );

    persp.near = Math.max(
      distance / 100,
      0.01
    );

    persp.far = distance * 10;

    persp.aspect =
      size.width / size.height;

    persp.lookAt(0, 0, 0);


    const virtualWidth =
      size.width *
      (1 + COMPOSITION_OFFSET_RATIO);

    persp.setViewOffset(
      virtualWidth,
      size.height,
      0,
      0,
      size.width,
      size.height
    );

    persp.updateProjectionMatrix();

  }, [camera, size, gltf]);


  /*
  |--------------------------------------------------------------------------
  | RENDER LOOP
  |--------------------------------------------------------------------------
  */

  useFrame((_, delta) => {
    /*
    ------------------------------------------------------------------------
    Read the existing Zustand pointer state.
    ------------------------------------------------------------------------
    */

    const {
      pointerX,
      pointerY,
    } = useAppStore.getState();


    /*
    ------------------------------------------------------------------------
    TORSO
    ------------------------------------------------------------------------
    */

    const torsoTargetYaw =
      pointerX * TORSO_MAX_YAW;

    const torsoTargetPitch =
      -pointerY * TORSO_MAX_PITCH;


    torsoYaw.current =
      THREE.MathUtils.damp(
        torsoYaw.current,
        torsoTargetYaw,
        TORSO_DAMPING,
        delta
      );

    torsoPitch.current =
      THREE.MathUtils.damp(
        torsoPitch.current,
        torsoTargetPitch,
        TORSO_DAMPING,
        delta
      );


    if (torsoRef.current) {
      torsoEuler.set(
        torsoPitch.current,
        torsoYaw.current,
        0
      );

      torsoDeltaQuaternion.setFromEuler(
        torsoEuler
      );

      torsoTargetQuaternion
        .copy(torsoRest.current)
        .multiply(torsoDeltaQuaternion);

      torsoRef.current.quaternion.copy(
        torsoTargetQuaternion
      );
    }


    /*
    ------------------------------------------------------------------------
    HEAD
    ------------------------------------------------------------------------
    */

    const headTargetYaw =
      pointerX * HEAD_MAX_YAW;

    const headTargetPitch =
      -pointerY * HEAD_MAX_PITCH;


    headYaw.current =
      THREE.MathUtils.damp(
        headYaw.current,
        headTargetYaw,
        HEAD_DAMPING,
        delta
      );

    headPitch.current =
      THREE.MathUtils.damp(
        headPitch.current,
        headTargetPitch,
        HEAD_DAMPING,
        delta
      );


    if (headRef.current) {
      headEuler.set(
        headPitch.current,
        headYaw.current,
        0
      );

      headDeltaQuaternion.setFromEuler(
        headEuler
      );

      headTargetQuaternion
        .copy(headRest.current)
        .multiply(headDeltaQuaternion);

      headRef.current.quaternion.copy(
        headTargetQuaternion
      );
    }


    /*
    ------------------------------------------------------------------------
    EYES
    ------------------------------------------------------------------------
    */

    const eyeTargetYaw =
      pointerX * EYE_MAX_YAW;

    const eyeTargetPitch =
      -pointerY * EYE_MAX_PITCH;


    eyeYaw.current =
      THREE.MathUtils.damp(
        eyeYaw.current,
        eyeTargetYaw,
        EYE_DAMPING,
        delta
      );

    eyePitch.current =
      THREE.MathUtils.damp(
        eyePitch.current,
        eyeTargetPitch,
        EYE_DAMPING,
        delta
      );


    eyeEuler.set(
      eyePitch.current,
      eyeYaw.current,
      0
    );

    eyeDeltaQuaternion.setFromEuler(
      eyeEuler
    );


    if (leftEyeRef.current) {
      leftEyeTargetQuaternion
        .copy(leftEyeRest.current)
        .multiply(eyeDeltaQuaternion);

      leftEyeRef.current.quaternion.copy(
        leftEyeTargetQuaternion
      );
    }


    if (rightEyeRef.current) {
      rightEyeTargetQuaternion
        .copy(rightEyeRest.current)
        .multiply(eyeDeltaQuaternion);

      rightEyeRef.current.quaternion.copy(
        rightEyeTargetQuaternion
      );
    }


    /*
    ------------------------------------------------------------------------
    BLINK TIMER
    ------------------------------------------------------------------------
    */

    if (!blinkActive.current) {
      blinkTimer.current -= delta;

      if (blinkTimer.current <= 0) {
        blinkActive.current = true;
        blinkTarget.current = 1;
      }
    }


    /*
    ------------------------------------------------------------------------
    BLINK DAMPING
    ------------------------------------------------------------------------
    */

    blinkWeight.current =
      THREE.MathUtils.damp(
        blinkWeight.current,
        blinkTarget.current,
        BLINK_DAMPING,
        delta
      );


    /*
    ------------------------------------------------------------------------
    CLOSE → OPEN
    ------------------------------------------------------------------------
    */

    if (
      blinkActive.current &&
      blinkTarget.current === 1 &&
      blinkWeight.current > 0.95
    ) {
      blinkTarget.current = 0;
    }


    /*
    ------------------------------------------------------------------------
    SCHEDULE NEXT BLINK
    ------------------------------------------------------------------------
    */

    if (
      blinkActive.current &&
      blinkTarget.current === 0 &&
      blinkWeight.current < 0.03
    ) {
      blinkActive.current = false;

      blinkTimer.current =
        MIN_BLINK_DELAY +
        Math.random() *
          (MAX_BLINK_DELAY - MIN_BLINK_DELAY);
    }


    /*
    ------------------------------------------------------------------------
    UPPER EYELIDS
    ------------------------------------------------------------------------
    */

    blinkEuler.set(
      UPPER_LID_BLINK *
        blinkWeight.current,
      0,
      0
    );

    blinkQuaternion.setFromEuler(
      blinkEuler
    );


    if (leftUpperLidRef.current) {
      leftUpperLidTargetQuaternion
        .copy(leftUpperLidRest.current)
        .multiply(blinkQuaternion);

      leftUpperLidRef.current.quaternion.copy(
        leftUpperLidTargetQuaternion
      );
    }


    if (rightUpperLidRef.current) {
      rightUpperLidTargetQuaternion
        .copy(rightUpperLidRest.current)
        .multiply(blinkQuaternion);

      rightUpperLidRef.current.quaternion.copy(
        rightUpperLidTargetQuaternion
      );
    }


    /*
    ------------------------------------------------------------------------
    LOWER EYELIDS
    ------------------------------------------------------------------------
    */

    blinkEuler.set(
      LOWER_LID_BLINK *
        blinkWeight.current,
      0,
      0
    );

    blinkQuaternion.setFromEuler(
      blinkEuler
    );


    if (leftLowerLidRef.current) {
      leftLowerLidTargetQuaternion
        .copy(leftLowerLidRest.current)
        .multiply(blinkQuaternion);

      leftLowerLidRef.current.quaternion.copy(
        leftLowerLidTargetQuaternion
      );
    }


    if (rightLowerLidRef.current) {
      rightLowerLidTargetQuaternion
        .copy(rightLowerLidRest.current)
        .multiply(blinkQuaternion);

      rightLowerLidRef.current.quaternion.copy(
        rightLowerLidTargetQuaternion
      );
    }
  });


  return (
    <primitive
      object={gltf.scene}
      dispose={null}
    />
  );
}


useGLTF.preload(MODEL_PATH);