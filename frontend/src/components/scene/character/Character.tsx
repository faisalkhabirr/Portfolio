import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CharacterModel from './CharacterModel';
import type { CharacterRig } from './CharacterRig';
import {
  createTrackingState,
  updateTracking,
} from './CharacterTracking';
import { createFaceState, updateFace } from './CharacterFace';
import { createIdleState, updateIdle } from './CharacterIdle';
import { useAppStore } from '../../../state/useAppStore';

export default function Character() {
  const rigRef = useRef<CharacterRig | null>(null);
  const trackingRef = useRef(createTrackingState());
  const faceRef = useRef(createFaceState());
  const idleRef = useRef(createIdleState());

  const onRigReady = useCallback((rig: CharacterRig) => {
    rigRef.current = rig;
  }, []);

  useFrame((_, delta) => {
    const rig = rigRef.current;
    if (!rig) return;

    const dt = Math.min(delta, 0.05);
    const { pointerX, pointerY } = useAppStore.getState();
    const idle = updateIdle(idleRef.current, dt);

    updateTracking(
      rig,
      trackingRef.current,
      pointerX,
      pointerY,
      dt,
      idle,
    );

    updateFace(
      rig,
      faceRef.current,
      pointerX,
      pointerY,
      dt,
    );
  });

  return <CharacterModel onRigReady={onRigReady} />;
}
