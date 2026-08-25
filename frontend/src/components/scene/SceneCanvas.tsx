import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import CameraRig from './CameraRig';
import Lighting from './Lighting';
import CharacterController from './CharacterController';
import FPSMeter from '../../three/inspectors/FPSMeter';
import { tokens } from '../../styles/tokens';

// Phase 3 scope: static camera, sensible lighting, the model loaded and
// framed, an in-canvas perf sampler, and now damped mouse-parallax
// rotation via CharacterController. No choreography, no post-processing —
// those are later phases.
export default function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[tokens.background]} />
      <CameraRig />
      <Lighting />
      <FPSMeter />
      <Suspense fallback={null}>
        <CharacterController />
      </Suspense>
    </Canvas>
  );
}
