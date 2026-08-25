// Centralized design tokens — single source of truth for color values.
// Referenced by both DOM (CSS-in-JS/inline styles) and R3F (scene background, materials).

export const tokens = {
  background: '#DDE2E8',
  backgroundDark: '#AEB7C2',
  textPrimary: '#101317',
  textSecondary: '#4E5965',
  glassUI: 'rgba(255,255,255,0.45)',
  uiBorder: 'rgba(16,19,23,0.14)',
  cyan: '#5EE7FF',
  purple: '#8B7CFF',
  characterYellow: '#FFD52F',
  glitchRed: '#FF4F6D',
  white: '#F8FAFC',
} as const;

export type Tokens = typeof tokens;
