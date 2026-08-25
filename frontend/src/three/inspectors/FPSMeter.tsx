import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAppStore } from '../../state/useAppStore';

const SAMPLE_INTERVAL = 0.5; // seconds — throttled on purpose

// Lives inside <Canvas>. Counts frames every tick (cheap ref mutation,
// NOT React state), and only pushes into the shared store twice a second.
// This is the pattern the whole architecture leans on: continuous
// per-frame work stays out of React's render cycle; only a throttled
// summary crosses into state that DOM components subscribe to.
export default function FPSMeter() {
  const frameCount = useRef(0);
  const elapsed = useRef(0);
  const setPerf = useAppStore((s) => s.setPerf);
  const { gl } = useThree();

  useFrame((_, delta) => {
    frameCount.current += 1;
    elapsed.current += delta;

    if (elapsed.current >= SAMPLE_INTERVAL) {
      const fps = Math.round(frameCount.current / elapsed.current);
      setPerf({
        fps,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      });
      frameCount.current = 0;
      elapsed.current = 0;
    }
  });

  return null;
}
