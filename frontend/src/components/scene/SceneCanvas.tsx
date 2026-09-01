import { Canvas } from '@react-three/fiber';
import { GradientBackground } from './GradientBackground';
import {
  Suspense,
  useEffect,
} from 'react';
import { useProgress } from '@react-three/drei';

import CameraRig from './CameraRig';
import Lighting from './Lighting';
import CharacterController from './CharacterController';

import FPSMeter from '../../three/inspectors/FPSMeter';

import { useAppStore } from '../../state/useAppStore';

function LoadingProgressBridge() {
  const {
    progress,
    active,
  } = useProgress();

  const setLoadProgress =
    useAppStore(
      (state) => state.setLoadProgress,
    );

  const setAssetsReady =
    useAppStore(
      (state) => state.setAssetsReady,
    );

  useEffect(() => {
    const normalized =
      Math.min(
        1,
        Math.max(
          0,
          progress / 100,
        ),
      );

    setLoadProgress(
      normalized,
    );

    /*
     * Drei reports 100 when the loading manager has completed.
     */
    if (
      !active &&
      progress >= 100
    ) {
      setAssetsReady(true);
    }
  }, [
    progress,
    active,
    setLoadProgress,
    setAssetsReady,
  ]);

  return null;
}

export default function SceneCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMappingExposure: 1.15,
      }}
      style={{
        position: 'absolute',
        inset: 0,
      }}
    >
      <GradientBackground />

      <CameraRig />

      <Lighting />

      <LoadingProgressBridge />

      <FPSMeter />

      <Suspense fallback={null}>
        <CharacterController />
      </Suspense>
    </Canvas>
  );
}