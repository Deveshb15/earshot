/**
 * Centralized color + motion tokens for the Earshot UI.
 *
 * Design thesis: matte black + one accent (electric blue → cyan radial). No
 * gradient backgrounds, no glassmorphism on backdrops (only chips). Every
 * animation must signify a state change — no decoration.
 */

export const Earshot = {
  bg: '#0A0A0A',
  surface: 'rgba(255, 255, 255, 0.06)',
  buttonIdle: '#1A1A1A',
  buttonArmedCenter: '#2E6EFF',
  buttonArmedEdge: '#00D9FF',
  ring: 'rgba(46, 110, 255, 0.3)',
  text: '#F5F5F5',
  textDim: 'rgba(245, 245, 245, 0.65)',
  textMuted: 'rgba(245, 245, 245, 0.4)',
  recording: '#FF3B30',
} as const;

export const Motion = {
  springSnappy: { stiffness: 160, damping: 12 },
  springBreathing: { stiffness: 50, damping: 8 },
  fadeMs: 300,
  crossfadeMs: 200,
} as const;

export const Type = {
  monoFamily: 'ui-monospace',
} as const;
