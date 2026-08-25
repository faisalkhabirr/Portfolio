import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CharacterModel from './CharacterModel';
import { useAppStore } from '../../state/useAppStore';

// Subtle, weighted mouse-parallax rotation — Phase 3 scope only (no idle
// float, no eye-specific tracking; that's later phases).
//
// Reads pointer position via useAppStore.getState() every frame, never via
// the reactive useAppStore(selector) hook, so pointermove events (which
// can fire well over 60x/second) never trigger a React re-render here.
//
// Rotates this wrapping <group>, not gltf.scene directly: CharacterModel
// already recenters the mesh to local origin as part of its bounding-box
// framing logic, so that recentered origin is exactly the right pivot —
// rotating around it reads as the character turning in place, not
// swinging off-axis.
//
// Applied to the WHOLE character, not a separate head/eye node — Phase 1's
// inspection hasn't confirmed this asset exposes an independently
// controllable head (see the HEAD/EYES findings: "unclear"). Once that's
// verified, this is the natural place to split off a HeadController that
// rotates just the head node while this stays responsible for a smaller
// whole-body sway.

const MAX_YAW = THREE.MathUtils.degToRad(8); // left/right, driven by pointerX
const MAX_PITCH = THREE.MathUtils.degToRad(5); // up/down, driven by pointerY

// Exponential damping, not a fixed-factor lerp: THREE.MathUtils.damp is
// framerate-independent (uses delta time), so the motion feels the same
// weight on a 60Hz and a 144Hz display. Lower = heavier/slower-settling,
// higher = snappier. 4 reads as "passively following," not reactive.
const DAMPING_LAMBDA = 4;

// Flip either sign if the turn direction reads as "away from the cursor"
// instead of "toward it" once you can actually see this live — the correct
// sign depends on which way this specific model faces by default, which
// isn't knowable without a screen in front of it.
const YAW_SIGN = -1;
const PITCH_SIGN = 1;

export default function CharacterController() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { pointerX, pointerY } = useAppStore.getState();

    const targetYaw = YAW_SIGN * pointerX * MAX_YAW;
    const targetPitch = PITCH_SIGN * pointerY * MAX_PITCH;

    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetYaw, DAMPING_LAMBDA, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetPitch, DAMPING_LAMBDA, delta);
  });

  return (
    <group ref={groupRef}>
      <CharacterModel />
    </group>
  );
}
