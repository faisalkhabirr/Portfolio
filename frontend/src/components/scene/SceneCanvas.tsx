import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import CameraRig from './CameraRig';
import Lighting from './Lighting';
import CharacterController from './CharacterController';
import FPSMeter from '../../three/inspectors/FPSMeter';
import { tokens } from '../../styles/tokens';

// CharacterController -> character/Character. Scene shell is unchanged.
export default function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      // Modest exposure bump alongside the Lighting.tsx retune — helps
      // with the reported underexposed look without needing real
      // post-processing (still none in use here).
      gl={{ antialias: true, toneMappingExposure: 1.15 }}
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
