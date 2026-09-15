import { tokens } from '../../styles/tokens';

/**
 * Lightweight cinematic studio lighting for the Deadpool character.
 *
 * The character is predominantly dark red / black, so the previous
 * Minion-oriented lighting made the model read as an underexposed silhouette.
 *
 * No shadow maps.
 * No post-processing.
 * No bloom.
 * No expensive effects.
 *
 * Lighting hierarchy:
 *
 * 1. Hemisphere = broad environmental fill
 * 2. Ambient = prevents deep black crush
 * 3. Key = primary modeling light from camera/front-right
 * 4. Fill = softer front-left support
 * 5. Rim = subtle rear cyan separation
 */
export default function Lighting() {
  return (
    <>
      <hemisphereLight
        args={[
          tokens.white,
          tokens.textSecondary,
          1.05,
        ]}
      />

      <ambientLight
        intensity={0.5}
        color={tokens.white}
      />

      <directionalLight
        position={[4, 6, 7]}
        intensity={1.7}
        color={tokens.white}
      />

      <directionalLight
        position={[-5, 3, 5]}
        intensity={0.8}
        color="#D8E5ED"
      />

      <directionalLight
        position={[0, 6, -6]}
        intensity={6.15}
        color={tokens.cyan}
      />
    </>
  );
}