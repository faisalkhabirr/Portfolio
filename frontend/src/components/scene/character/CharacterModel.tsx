import { useEffect, useLayoutEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { runGLTFInspection } from '../../../three/inspectors/GLTFInspector';
import { useAppStore } from '../../../state/useAppStore';
import {
  BONE_NAMES,
  MODEL_PATH,
  captureRestPose,
  collectBones,
  extractRig,
  orientRootToFaceCamera,
  type CharacterRig,
} from './CharacterRig';
import { applyCrossedArmsPose } from './CharacterPose';

const CAMERA_PADDING_FACTOR = 1.30;
const COMPOSITION_OFFSET_RATIO = 0.18;

interface CharacterModelProps {
  onRigReady: (rig: CharacterRig) => void;
}

export default function CharacterModel({ onRigReady }: CharacterModelProps) {
  const gltf = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const boundsRef = useRef<{ size: THREE.Vector3 } | null>(null);
  const hasSetup = useRef(false);
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!gltf?.scene || hasSetup.current) {
      return;
    }

    hasSetup.current = true;

    const scene = gltf.scene;
    scene.updateMatrixWorld(true);

    const bones = collectBones(scene);
    const report = runGLTFInspection(gltf);
    useAppStore.getState().setInspection(report);

    console.group(
      '%c========== DEADPOOL GLTF INSPECTION ==========',
      'font-weight:bold;color:#FF4F6D;',
    );
    console.log('Total nodes:', report.totalNodes);
    console.log('Total meshes:', report.totalMeshes);
    console.log('Total bones:', bones.length);
    console.log('Total triangles:', report.totalTriangles);
    console.log('Morph targets:', report.hasAnyMorphTargets);
    console.log('Animation clips:', report.animationClips.length);
    console.log(
      'Head:',
      scene.getObjectByName(BONE_NAMES.head)?.name ?? 'NOT FOUND',
    );
    console.log(
      'Left eye:',
      scene.getObjectByName(BONE_NAMES.leftEye)?.name ?? 'NOT FOUND',
    );
    console.log(
      'Right eye:',
      scene.getObjectByName(BONE_NAMES.rightEye)?.name ?? 'NOT FOUND',
    );
    console.groupEnd();

    const rig = extractRig(scene);

    applyCrossedArmsPose(rig);

    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const boundsSize = box.getSize(new THREE.Vector3());

    scene.position.sub(center);
    scene.updateMatrixWorld(true);

    if (groupRef.current) {
      orientRootToFaceCamera(groupRef.current, camera, rig);
    }

    captureRestPose(rig);

    boundsRef.current = { size: boundsSize };

    useAppStore.getState().setModelLoaded(true, {
      size: boundsSize,
      center: new THREE.Vector3(),
    });

    onRigReady(rig);

    console.log(
      '%c[CharacterModel] Deadpool setup complete. Lower body locked at rest.',
      'color:#5EE7FF;font-weight:bold;',
    );
  }, [gltf, camera, onRigReady]);

  useEffect(() => {
    const bounds = boundsRef.current;

    if (!bounds || size.width === 0 || size.height === 0) {
      return;
    }

    const maxDimension =
      Math.max(bounds.size.x, bounds.size.y, bounds.size.z) || 1;

    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const fovRadians = (perspectiveCamera.fov * Math.PI) / 180;
    const distance =
      (maxDimension / (2 * Math.tan(fovRadians / 2))) *
      CAMERA_PADDING_FACTOR;

    perspectiveCamera.position.set(0, bounds.size.y * 0.04, distance);
    perspectiveCamera.near = Math.max(distance / 100, 0.01);
    perspectiveCamera.far = distance * 10;
    perspectiveCamera.aspect = size.width / size.height;

    const lookTargetY = bounds.size.y * 0.08;
    perspectiveCamera.lookAt(0, lookTargetY, 0);

    const virtualWidth = size.width * (1 + COMPOSITION_OFFSET_RATIO);
    perspectiveCamera.setViewOffset(
      virtualWidth,
      size.height,
      0,
      0,
      size.width,
      size.height,
    );

    perspectiveCamera.updateProjectionMatrix();
  }, [camera, size]);

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
