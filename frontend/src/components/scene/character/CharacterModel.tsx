import {
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { useGLTF } from '@react-three/drei';
import {
  useFrame,
  useThree,
} from '@react-three/fiber';

import * as THREE from 'three';

import {
  runGLTFInspection,
} from '../../../three/inspectors/GLTFInspector';

import {
  useAppStore,
} from '../../../state/useAppStore';

import {
  BONE_NAMES,
  MODEL_PATH,
  captureRestPose,
  collectBones,
  extractRig,
  orientRootToFaceCamera,
  type CharacterRig,
} from './CharacterRig';

import {
  applyCrossedArmsPose,
} from './CharacterPose';

/* ========================================================================= */
/* CAMERA / COMPOSITION                                                      */
/* ========================================================================= */

const DESKTOP_CAMERA_PADDING = 1.3;

const DESKTOP_COMPOSITION_OFFSET = 0.18;

/*
 * Mobile camera states.
 *
 * INITIAL:
 *   wider / farther away
 *   full upper body is visible
 *
 * FINAL:
 *   closer
 *   head/chest dominate
 *   lower body disappears behind the dialogue sheet
 */
const MOBILE_INITIAL_DISTANCE_FACTOR = 0.82;

const MOBILE_CLOSE_DISTANCE_FACTOR = 0.58;

const MOBILE_INITIAL_LOOK_RATIO = 0.02;

const MOBILE_CLOSE_LOOK_RATIO = 0.18;

const MOBILE_FOV = 34;

const MOBILE_BREAKPOINT = 640;

/* ========================================================================= */
/* TYPES                                                                     */
/* ========================================================================= */

interface CharacterModelProps {
  onRigReady: (
    rig: CharacterRig,
  ) => void;
}

/* ========================================================================= */
/* COMPONENT                                                                 */
/* ========================================================================= */

export default function CharacterModel({
  onRigReady,
}: CharacterModelProps) {
  const gltf =
    useGLTF(MODEL_PATH);

  const groupRef =
    useRef<THREE.Group>(null);

  const boundsRef =
    useRef<{
      size: THREE.Vector3;
    } | null>(null);

  const hasSetup =
    useRef(false);

  const mobileCameraRef =
    useRef({
      initialDistance: 0,
      closeDistance: 0,
    });

  const { camera, size } =
    useThree();

  /* ======================================================================= */
  /* INITIAL MODEL / RIG SETUP                                               */
  /* ======================================================================= */

  useLayoutEffect(() => {
    if (
      !gltf?.scene ||
      hasSetup.current
    ) {
      return;
    }

    hasSetup.current = true;

    const scene =
      gltf.scene;

    scene.updateMatrixWorld(true);

    /* --------------------------------------------------------------------- */
    /* INSPECTION                                                            */
    /* --------------------------------------------------------------------- */

    const bones =
      collectBones(scene);

    const report =
      runGLTFInspection(gltf);

    useAppStore
      .getState()
      .setInspection(report);

    console.group(
      '%c========== DEADPOOL GLTF INSPECTION ==========',
      'font-weight:bold;color:#FF4F6D;',
    );

    console.log(
      'Total nodes:',
      report.totalNodes,
    );

    console.log(
      'Total meshes:',
      report.totalMeshes,
    );

    console.log(
      'Total bones:',
      bones.length,
    );

    console.log(
      'Total triangles:',
      report.totalTriangles,
    );

    console.log(
      'Morph targets:',
      report.hasAnyMorphTargets,
    );

    console.log(
      'Animation clips:',
      report.animationClips.length,
    );

    console.log(
      'Head:',
      scene.getObjectByName(
        BONE_NAMES.head,
      )?.name ?? 'NOT FOUND',
    );

    console.log(
      'Left eye:',
      scene.getObjectByName(
        BONE_NAMES.leftEye,
      )?.name ?? 'NOT FOUND',
    );

    console.log(
      'Right eye:',
      scene.getObjectByName(
        BONE_NAMES.rightEye,
      )?.name ?? 'NOT FOUND',
    );

    console.groupEnd();

    /* --------------------------------------------------------------------- */
    /* RIG                                                                    */
    /* --------------------------------------------------------------------- */

    const rig =
      extractRig(scene);

    applyCrossedArmsPose(rig);

    scene.updateMatrixWorld(true);

    /* --------------------------------------------------------------------- */
    /* BOUNDS                                                                 */
    /* --------------------------------------------------------------------- */

    const box =
      new THREE.Box3()
        .setFromObject(scene);

    const center =
      box.getCenter(
        new THREE.Vector3(),
      );

    const boundsSize =
      box.getSize(
        new THREE.Vector3(),
      );

    scene.position.sub(center);

    scene.updateMatrixWorld(true);

    /* --------------------------------------------------------------------- */
    /* ORIENTATION                                                            */
    /* --------------------------------------------------------------------- */

    if (groupRef.current) {
      orientRootToFaceCamera(
        groupRef.current,
        camera,
        rig,
      );
    }

    /* --------------------------------------------------------------------- */
    /* REST POSE                                                              */
    /* --------------------------------------------------------------------- */

    captureRestPose(rig);

    boundsRef.current = {
      size: boundsSize,
    };

    /* --------------------------------------------------------------------- */
    /* READY                                                                  */
    /* --------------------------------------------------------------------- */

    useAppStore
      .getState()
      .setModelLoaded(
        true,
        {
          size: boundsSize,
          center:
            new THREE.Vector3(),
        },
      );

    onRigReady(rig);

    console.log(
      '%c[CharacterModel] Deadpool setup complete. Lower body locked at rest.',
      'color:#5EE7FF;font-weight:bold;',
    );
  }, [
    gltf,
    camera,
    onRigReady,
  ]);

  /* ======================================================================= */
  /* RESPONSIVE CAMERA BASELINE                                               */
  /* ======================================================================= */

  useEffect(() => {
    const bounds =
      boundsRef.current;

    if (
      !bounds ||
      size.width === 0 ||
      size.height === 0
    ) {
      return;
    }

    const perspectiveCamera =
      camera as THREE.PerspectiveCamera;

    const isMobile =
      size.width <=
      MOBILE_BREAKPOINT;

    const modelHeight =
      bounds.size.y || 1;

    const maxDimension =
      Math.max(
        bounds.size.x,
        bounds.size.y,
        bounds.size.z,
      ) || 1;

    /* --------------------------------------------------------------------- */
    /* DESKTOP                                                               */
    /* --------------------------------------------------------------------- */

    if (!isMobile) {
      perspectiveCamera.fov = 32;

      const fovRadians =
        THREE.MathUtils.degToRad(
          perspectiveCamera.fov,
        );

      const distance =
        (
          maxDimension /
          (
            2 *
            Math.tan(
              fovRadians / 2,
            )
          )
        ) *
        DESKTOP_CAMERA_PADDING;

      perspectiveCamera.position.set(
        0,
        modelHeight * 0.04,
        distance,
      );

      perspectiveCamera.near =
        Math.max(
          distance / 100,
          0.01,
        );

      perspectiveCamera.far =
        distance * 10;

      perspectiveCamera.aspect =
        size.width /
        size.height;

      perspectiveCamera.lookAt(
        0,
        modelHeight * 0.08,
        0,
      );

      const virtualWidth =
        size.width *
        (
          1 +
          DESKTOP_COMPOSITION_OFFSET
        );

      perspectiveCamera.setViewOffset(
        virtualWidth,
        size.height,
        0,
        0,
        size.width,
        size.height,
      );

      perspectiveCamera.updateProjectionMatrix();

      return;
    }

    /* --------------------------------------------------------------------- */
    /* MOBILE BASELINE                                                       */
    /* --------------------------------------------------------------------- */

    perspectiveCamera.fov =
      MOBILE_FOV;

    const mobileFovRadians =
      THREE.MathUtils.degToRad(
        perspectiveCamera.fov,
      );

    const fullBodyDistance =
      (
        maxDimension /
        (
          2 *
          Math.tan(
            mobileFovRadians /
            2,
          )
        )
      ) *
      DESKTOP_CAMERA_PADDING;

    /*
     * Save both mobile camera states.
     */
    const initialDistance =
      fullBodyDistance *
      MOBILE_INITIAL_DISTANCE_FACTOR;

    const closeDistance =
      fullBodyDistance *
      MOBILE_CLOSE_DISTANCE_FACTOR;

    mobileCameraRef.current = {
      initialDistance,
      closeDistance,
    };

    /*
     * Every resize establishes the INITIAL state.
     * The animation will move the camera from here.
     */
    perspectiveCamera.position.set(
      0,
      modelHeight * 0.02,
      initialDistance,
    );

    perspectiveCamera.near =
      Math.max(
        initialDistance / 100,
        0.01,
      );

    perspectiveCamera.far =
      initialDistance * 10;

    perspectiveCamera.aspect =
      size.width /
      size.height;

    perspectiveCamera.clearViewOffset();

    perspectiveCamera.lookAt(
      0,
      modelHeight *
        MOBILE_INITIAL_LOOK_RATIO,
      0,
    );

    perspectiveCamera.updateProjectionMatrix();
  }, [
    camera,
    size,
  ]);

  /* ======================================================================= */
  /* MOBILE CINEMATIC CAMERA ANIMATION                                       */
  /* ======================================================================= */

  useFrame((_, delta) => {
    const isMobile =
      size.width <=
      MOBILE_BREAKPOINT;

    if (!isMobile) {
      return;
    }

    const {
      initialDistance,
      closeDistance,
    } =
      mobileCameraRef.current;

    if (
      initialDistance <= 0 ||
      closeDistance <= 0
    ) {
      return;
    }

    const progress =
      useAppStore
        .getState()
        .mobileCinematicProgress;

    /*
     * Camera distance:
     *
     * 0 → small opening composition
     * 1 → close-up final composition
     */
    const targetDistance =
      THREE.MathUtils.lerp(
        initialDistance,
        closeDistance,
        progress,
      );

    camera.position.z =
      THREE.MathUtils.damp(
        camera.position.z,
        targetDistance,
        5.5,
        delta,
      );

    /*
     * Camera target also moves upward during the zoom.
     */
    const modelHeight =
      boundsRef.current?.size
        .y ?? 1;

    const targetLookY =
      modelHeight *
      THREE.MathUtils.lerp(
        MOBILE_INITIAL_LOOK_RATIO,
        MOBILE_CLOSE_LOOK_RATIO,
        progress,
      );

    /*
     * Avoid constructing new vectors/Eulers
     * in the render loop.
     */
    camera.lookAt(
      0,
      targetLookY,
      0,
    );
  });

  /* ======================================================================= */
  /* RENDER                                                                  */
  /* ======================================================================= */

  return (
    <group ref={groupRef}>
      <primitive
        object={gltf.scene}
      />
    </group>
  );
}

/* ========================================================================= */
/* PRELOAD                                                                   */
/* ========================================================================= */

useGLTF.preload(
  MODEL_PATH,
);