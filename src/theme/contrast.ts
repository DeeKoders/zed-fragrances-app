import { wcagContrast } from "culori";

/** WCAG AA for normal-size text. */
export const AA = 4.5;

/** Throws (and so fails the build) when a token pair doesn't reach the required contrast. */
export function assertContrast(foreground: string, background: string, label: string, min = AA) {
  const ratio = wcagContrast(foreground, background);
  if (ratio < min) {
    throw new Error(
      `[theme] ${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, below the required ${min}:1.`,
    );
  }
  return ratio;
}
