import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../state/useAppStore';
import { runGLTFInspection, reportLoadTiming, validateAssertedFacts } from '../../three/inspectors/GLTFInspector';

// Matches the path already present in your project:
// frontend/public/assets/models/cute_yellow_minion_character.glb
const MODEL_PATH = '/assets/models/cute_yellow_minion_character.glb';

// Composition tuning, not a color — kept local rather than in styles/tokens.ts.
// Fraction of the horizontal frame used to push the subject right of center,
// leaving negative space on the left for the future DialoguePanel (Phase 2+).
// Implemented via camera.setViewOffset rather than moving the model off the
// optical axis, so the character doesn't pick up an off-axis perspective
// skew — this crops a wider virtual frame instead of literally shifting the
// object in world space.
const COMPOSITION_OFFSET_RATIO = 0.18;
const CAMERA_PADDING_FACTOR = 1.4;

// Facts you supplied from the embedded GLB metadata — verified against the
// real parsed data below rather than trusted blindly, per "verify, don't
// assume."
const ASSERTED_FACTS = {
  meshCount: 16,
  nodeCount: 21,
  uniqueMaterialCount: 1,
  textureCount: 3,
  hasSkeleton: false,
  hasMorphTargets: false,
  hasAnimationClips: false,
};

export default function CharacterModel() {
  const gltf = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const boundsRef = useRef<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  const hasInspected = useRef(false);

  const { camera, size } = useThree(); // `size` = canvas pixel dimensions, reactive on resize
  const setModelLoaded = useAppStore((s) => s.setModelLoaded);
  const setInspection = useAppStore((s) => s.setInspection);

  // Effect 1 — runs once when the asset finishes loading: center the model,
  // run the inspection report exactly once, cache the bounding box for the
  // framing effect below.
  useEffect(() => {
    if (!gltf?.scene || hasInspected.current) return;
    hasInspected.current = true;

    // NOTE: useGLTF caches the parsed scene by URL. We mutate .position
    // directly on that cached scene graph, which is fine for a single
    // on-screen instance (Phase 1's only use case). If this model is ever
    // reused elsewhere, clone it first (three-stdlib's SkeletonUtils.clone)
    // instead of mutating the shared cache.
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const boundsSize = box.getSize(new THREE.Vector3());
    gltf.scene.position.sub(center);
    boundsRef.current = { size: boundsSize, center };

    const report = runGLTFInspection(gltf);
    setInspection(report);
    setModelLoaded(true, { size: boundsSize, center });

    validateAssertedFacts(report, ASSERTED_FACTS);
    reportLoadTiming(MODEL_PATH);
  }, [gltf, setModelLoaded, setInspection]);

  // Effect 2 — runs on load AND on every resize: recompute camera distance
  // from the real bounding box against the *current* aspect ratio, and
  // re-apply the off-center composition crop. Split out from Effect 1 so
  // "responsive resizing" (required this phase) doesn't depend on reloading
  // the model.
  useEffect(() => {
    const bounds = boundsRef.current;
    if (!bounds || size.width === 0 || size.height === 0) return;

    const maxDim = Math.max(bounds.size.x, bounds.size.y, bounds.size.z) || 1;
    const persp = camera as THREE.PerspectiveCamera;
    const fovRad = (persp.fov * Math.PI) / 180;
    const distance = (maxDim / (2 * Math.tan(fovRad / 2))) * CAMERA_PADDING_FACTOR;

    persp.position.set(0, bounds.size.y * 0.05, distance);
    persp.near = Math.max(distance / 100, 0.01);
    persp.far = distance * 10;
    persp.aspect = size.width / size.height;
    persp.lookAt(0, 0, 0);

    // Off-center-right crop: view a sub-window of a virtual frame that's
    // wider than the real canvas. Cropping the left portion of a wider
    // frame pushes an optically-centered subject toward the right of the
    // visible result — no object-space shift, no perspective skew.
    const virtualWidth = size.width * (1 + COMPOSITION_OFFSET_RATIO);
    persp.setViewOffset(virtualWidth, size.height, 0, 0, size.width, size.height);

    persp.updateProjectionMatrix();
  }, [camera, size]);

  return <primitive ref={groupRef} object={gltf.scene} rotation={[0, -Math.PI / 2, 0]} />;
}

// Preload so the request kicks off as early as possible rather than
// waiting for CharacterModel to mount.
useGLTF.preload(MODEL_PATH);
