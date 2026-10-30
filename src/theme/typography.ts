import type { TextStyle } from "react-native";

// The type scale in points. The two largest styles (mega, display) scale with screen width;
// letter-spacing is converted from em to points (React Native's letterSpacing is in points).

export const fonts = {
  cinzel500: "Cinzel_500Medium",
  cinzel600: "Cinzel_600SemiBold",
  cinzel700: "Cinzel_700Bold",
  editorial: "CormorantGaramond_400Regular_Italic",
  editorialMedium: "CormorantGaramond_500Medium_Italic",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
} as const;

export type TextVariant =
  | "mega"
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "editorial"
  | "bodyLg"
  | "body"
  | "label"
  | "micro";

type Spec = {
  font: string;
  size: number;
  /** Line height as a multiple of the size. */
  leading: number;
  /** Letter spacing in em. */
  tracking: number;
  caps?: boolean;
  /** Largest system text-size multiplier; undefined = no cap. */
  maxScale?: number;
};

/** Phones are designed at 393 pt wide; mega and display scale from there. */
const DESIGN_WIDTH = 393;

const SPECS: Record<TextVariant, Spec> = {
  mega: { font: fonts.cinzel700, size: 0, leading: 0.8, tracking: -0.03, caps: true, maxScale: 1 },
  display: { font: fonts.cinzel600, size: 56, leading: 0.9, tracking: -0.01, caps: true, maxScale: 1.1 },
  h1: { font: fonts.cinzel600, size: 40, leading: 1.0, tracking: 0.02, caps: true, maxScale: 1.2 },
  h2: { font: fonts.cinzel500, size: 32, leading: 1.05, tracking: 0.04, caps: true, maxScale: 1.3 },
  h3: { font: fonts.cinzel500, size: 22, leading: 1.15, tracking: 0.06, caps: true, maxScale: 1.5 },
  editorial: { font: fonts.editorial, size: 20, leading: 1.3, tracking: 0 },
  bodyLg: { font: fonts.body, size: 18, leading: 1.65, tracking: 0 },
  body: { font: fonts.body, size: 16, leading: 1.6, tracking: 0 },
  label: { font: fonts.bodySemiBold, size: 12, leading: 1.4, tracking: 0.32, caps: true, maxScale: 2 },
  micro: { font: fonts.bodySemiBold, size: 11, leading: 1.4, tracking: 0.48, caps: true, maxScale: 2 },
};

export function fontSizeFor(variant: TextVariant, width: number) {
  if (variant === "mega") return Math.round(width * 0.32);
  const size = SPECS[variant].size;
  if (variant === "display") return Math.round(size * Math.min(1.15, Math.max(0.82, width / DESIGN_WIDTH)));
  return size;
}

export function typeStyle(variant: TextVariant, width: number): TextStyle {
  const spec = SPECS[variant];
  const size = fontSizeFor(variant, width);
  return {
    fontFamily: spec.font,
    fontSize: size,
    lineHeight: Math.round(size * spec.leading),
    letterSpacing: Number((size * spec.tracking).toFixed(2)),
    textTransform: spec.caps ? "uppercase" : "none",
  };
}

export function maxScaleFor(variant: TextVariant) {
  return SPECS[variant].maxScale;
}
