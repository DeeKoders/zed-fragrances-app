import { Easing } from "react-native-reanimated";

// Motion tokens, ported from the website's src/lib/motion.ts. Milliseconds here (the website uses seconds).

export const duration = {
  micro: 160,
  ui: 400,
  reveal: 900,
  theme: 800,
  /** The whole intro must finish within this. */
  intro: 1800,
} as const;

/** Milliseconds between items. */
export const stagger = { chars: 40, lines: 80 } as const;

/** lux: reveals. silk: theme changes and curtains. For withTiming({ easing }). */
export const ease = {
  lux: Easing.bezier(0.16, 1, 0.3, 1),
  silk: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

/** The same curves as plain worklet functions, for interpolating a progress value. */
export const easeFn = {
  lux: Easing.bezierFn(0.16, 1, 0.3, 1),
  silk: Easing.bezierFn(0.65, 0, 0.35, 1),
} as const;

export const spring = {
  /** Quick UI feedback: presses, toggles. */
  snap: { stiffness: 420, damping: 32, mass: 1 },
  /** Things that follow a finger: bottles, letters. */
  magnet: { stiffness: 160, damping: 14, mass: 0.6 },
} as const;
