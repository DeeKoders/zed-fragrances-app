import type { Mood, TextureKind } from "@/types/product";

/** Theme id used when no product is active. Reserved: no product may use it as a slug. */
export const HOUSE_THEME = "house";

export const ACCENT_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type AccentStop = (typeof ACCENT_STOPS)[number];

/** Every generated accent token (the website's --accent-* CSS variables, as object keys). All of them morph. */
export const THEME_TOKENS = [
  "accent",
  ...ACCENT_STOPS.map((stop) => `accent${stop}` as const),
  "accentAlt",
  "accentGlow",
  "accentInk",
  "onAccent",
  "accentBorder",
] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];

export type ThemeTokens = Record<ThemeToken, string>;

/** A generated theme: the house world or one product's. */
export type ThemeMeta = {
  id: string;
  name: string;
  tokens: ThemeTokens;
  texture: TextureKind;
  mood: Mood;
};
