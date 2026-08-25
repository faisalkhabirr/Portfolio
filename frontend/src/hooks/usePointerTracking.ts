import { useEffect } from 'react';
import { useAppStore } from '../state/useAppStore';

// One global listener, per the approved architecture. Writes straight into
// the store via setState/an action — this hook never reads pointerX/Y back
// reactively, so it never re-renders regardless of how often pointermove
// fires. The only consumer is CharacterController's useFrame loop, which
// pulls the latest value with useAppStore.getState().
//
// Listens on `window`, not the canvas element: pointer-events: none on the
// DOM UI layer doesn't block this — window-level pointermove fires
// regardless of which element was hit-tested as the event target.
export function usePointerTracking() {
  useEffect(() => {
    const setPointer = useAppStore.getState().setPointer;

    const handlePointerMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1); // flip so "up" is positive, matching three.js' Y-up convention

      setPointer(x, y);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);
}
