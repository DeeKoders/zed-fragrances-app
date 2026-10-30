import { clampChroma, converter, formatHex, interpolate, wcagContrast, type Oklch } from "culori";
import type { ThemeSpec } from "@/types/product";
import { AA, assertContrast } from "./contrast";
import { ACCENT_STOPS, type AccentStop, type ThemeTokens } from "./types";

// Port of the website's src/lib/theme/tokens.ts. Same maths; tokens are object keys instead of CSS variables.

/** The surfaces and neutrals a theme is generated against. */
export type ThemeBase = {
  /** Lightest surface accent-coloured text may sit on. */
  surface: string;
  ivory: string;
  ink: string;
  /** Gold mixed into the accent for borders. */
  gold: string;
};

const toOklch = converter("oklch");

/** Aim a little above AA so rounding to hex never lands a token just under the line. */
const INK_TARGET = AA + 0.1;

const LIGHTEST = 0.98;
const DARKEST = 0.14;

/** How far each stop moves from the accent toward white (50–400) or black (600–900), and how much chroma it keeps. */
const RAMP: Record<AccentStop, { toward: number; chroma: number }> = {
  50: { toward: 0.92, chroma: 0.12 },
  100: { toward: 0.8, chroma: 0.22 },
  200: { toward: 0.62, chroma: 0.4 },
  300: { toward: 0.42, chroma: 0.65 },
  400: { toward: 0.2, chroma: 0.85 },
  500: { toward: 0, chroma: 1 },
  600: { toward: 0.2, chroma: 0.95 },
  700: { toward: 0.42, chroma: 0.85 },
  800: { toward: 0.64, chroma: 0.7 },
  900: { toward: 0.85, chroma: 0.55 },
};

function parse(color: string, label: string): Oklch {
  const parsed = toOklch(color);
  if (!parsed) throw new Error(`[theme] ${label}: "${color}" is not a valid colour.`);
  return parsed;
}

function hex(color: Oklch) {
  return formatHex(clampChroma(color, "oklch"));
}

function withLightness(color: Oklch, l: number, chroma = 1): Oklch {
  return { mode: "oklch", l: Math.min(1, Math.max(0, l)), c: (color.c ?? 0) * chroma, h: color.h };
}

/** The accent, lightened just enough to read as text on `surface`. */
function readableOn(color: Oklch, surface: string) {
  for (let l = color.l; l <= 1; l += 0.01) {
    const candidate = hex(withLightness(color, l));
    if (wcagContrast(candidate, surface) >= INK_TARGET) return candidate;
  }
  return hex(withLightness(color, 1));
}

/** The highest-contrast option, preferring the brand neutrals when they pass AA. */
function textOn(background: string, base: ThemeBase) {
  const best = (options: string[]) =>
    options.reduce((a, b) => (wcagContrast(b, background) > wcagContrast(a, background) ? b : a));
  const brandPick = best([base.ivory, base.ink]);
  return wcagContrast(brandPick, background) >= AA ? brandPick : best(["#ffffff", "#000000"]);
}

/**
 * Generates a full token set from a theme spec. Only `accent` is required; `accentAlt` and `glow`
 * are derived when absent. Text tokens are checked against WCAG AA and throw (failing `npm run check`)
 * if they can't pass.
 */
export function createThemeTokens(spec: ThemeSpec, base: ThemeBase, label: string): ThemeTokens {
  const accentColor = parse(spec.accent, `${label} accent`);
  const accent = formatHex(accentColor);

  const ramp = Object.fromEntries(
    ACCENT_STOPS.map((stop) => {
      if (stop === 500) return [`accent${stop}`, accent];
      const { toward, chroma } = RAMP[stop];
      const target = stop < 500 ? LIGHTEST : DARKEST;
      const l = accentColor.l + (target - accentColor.l) * toward;
      return [`accent${stop}`, hex(withLightness(accentColor, l, chroma))];
    }),
  ) as Pick<ThemeTokens, `accent${AccentStop}`>;

  const accentAlt = spec.accentAlt
    ? formatHex(parse(spec.accentAlt, `${label} accentAlt`))
    : hex(withLightness(accentColor, Math.max(0.16, accentColor.l - 0.28), 0.6));

  const glow = spec.glow
    ? formatHex(parse(spec.glow, `${label} glow`))
    : hex(withLightness(accentColor, Math.min(0.86, accentColor.l + 0.12), 1.15));

  const ink = readableOn(accentColor, base.surface);
  const onAccent = textOn(accent, base);

  assertContrast(ink, base.surface, `${label} accentInk`);
  assertContrast(onAccent, accent, `${label} onAccent`);

  return {
    accent,
    ...ramp,
    accentAlt,
    accentGlow: glow,
    accentInk: ink,
    onAccent,
    accentBorder: formatHex(interpolate([accent, base.gold], "oklab")(0.55)),
  };
}
