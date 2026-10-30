import { brand } from "@/config/brand";

// Constant colours. Gold is the brand anchor and never morphs; accents come from useThemeColor().

const { ink, line, ivory, ivoryMuted, gold } = brand.palette;

export const palette = {
  ink950: ink["950"],
  ink900: ink["900"],
  ink800: ink["800"],
  ink700: ink["700"],
  line,
  ivory,
  ivoryMuted,
  gold100: gold["100"],
  gold200: gold["200"],
  gold300: gold["300"],
  gold400: gold["400"],
  gold500: gold["500"],
  gold600: gold["600"],
  gold700: gold["700"],
  gold800: gold["800"],
  gold900: gold["900"],
  /** Fully transparent, for gradients that fade out. */
  clear: "#00000000",
} as const;

export type PaletteToken = keyof typeof palette;

/** [r, g, b] in 0..1, for shader uniforms. */
export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/** A hex colour at `opacity`, as an rgba() string. */
export function alpha(hex: string, opacity: number) {
  const [r, g, b] = hexToRgb(hex).map((channel) => Math.round(channel * 255));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** The gold metallic gradient on the wordmark and the hero letters, light to dark. */
export const goldGradient = [gold["100"], gold["300"], gold["500"], gold["700"], gold["300"]] as const;

/** Common translucent ink layers. */
export const scrim = {
  light: alpha(ink["950"], 0.35),
  medium: alpha(ink["950"], 0.6),
  heavy: alpha(ink["950"], 0.85),
  glass: alpha(ink["900"], 0.72),
} as const;
