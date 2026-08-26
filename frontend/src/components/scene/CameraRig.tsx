import { PerspectiveCamera } from '@react-three/drei';

// Phase 1: a static camera only. The starting position/fov below is a
// reasonable default for a bust-framed character; CharacterModel refines
// the exact distance at runtime once it knows the asset's real bounding
// box (we don't know the minion's true scale until it's loaded — this
// asset has never been measured).
export default function CameraRig() {
  return <PerspectiveCamera makeDefault fov={32} position={[0, 0.13, 6]} near={0.1} far={100} />;
}
