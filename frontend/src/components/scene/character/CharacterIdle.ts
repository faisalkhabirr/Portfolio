export interface IdleOffsets {
  lumbarYaw: number;
  lumbarPitch: number;
  spineYaw: number;
  spinePitch: number;
  chestYaw: number;
  chestPitch: number;
}

export interface IdleState {
  time: number;
}

export function createIdleState(): IdleState {
  return { time: 0 };
}

/**
 * Slow breathing and weight-shift. Hips stay planted; lumbar + chest
 * take a few degrees of sine drift so the bust does not read as frozen.
 */
export function updateIdle(state: IdleState, delta: number): IdleOffsets {
  state.time += delta;

  const breathe = Math.sin(state.time * 1.12);
  const sway = Math.sin(state.time * 0.27);
  const drift = Math.sin(state.time * 0.19 + 1.4);

  // Increased breathing amplitude for organic, life-like movement
  const chestRise = breathe * 0.045;
  const lumbarRise = breathe * 0.025;
  const yawSway = sway * 0.035 + drift * 0.015;
  const pitchSway = Math.cos(state.time * 0.15) * 0.02;

  return {
    lumbarYaw: yawSway * 0.6,
    lumbarPitch: -lumbarRise + pitchSway * 0.5,
    spineYaw: yawSway * 0.8,
    spinePitch: -chestRise * 0.8 + pitchSway,
    chestYaw: yawSway * 1.2,
    chestPitch: -chestRise * 1.2 + pitchSway * 1.2,
  };
}
