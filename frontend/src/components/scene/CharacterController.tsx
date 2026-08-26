import Character from './character/Character';

/**
 * Scene-level entry. Phase 4 behaviour lives in `character/`:
 * pose, hierarchical tracking, eyes, blink, idle.
 */
export default function CharacterController() {
  return <Character />;
}
