import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { useReducedMotion } from "@/stores/motion";
import { duration, ease } from "./motion";
import { hexToRgb } from "./palette";
import { getTheme, getThemes } from "./registry";
import { HOUSE_THEME, THEME_TOKENS, type ThemeMeta, type ThemeToken, type ThemeTokens } from "./types";

/** Shader colours, flattened: accent rgb, alt rgb, glow rgb, cold (0 warm … 1 cold). */
export type ShaderPalette = number[];

function shaderPalette(theme: ThemeMeta): ShaderPalette {
  return [
    ...hexToRgb(theme.tokens.accent),
    ...hexToRgb(theme.tokens.accentAlt),
    ...hexToRgb(theme.tokens.accentGlow),
    theme.mood === "cold" ? 1 : 0,
  ];
}

type Morph = {
  /** 0 → 1 over the theme duration, silk-eased. */
  progress: SharedValue<number>;
  from: SharedValue<ThemeTokens>;
  to: SharedValue<ThemeTokens>;
  fromShader: SharedValue<ShaderPalette>;
  toShader: SharedValue<ShaderPalette>;
};

type ThemeActions = {
  themes: ThemeMeta[];
  /** The world the app has settled on (scroll position, a pressed card, a Scent Finder result). */
  setTheme: (id: string) => void;
  /** Temporary override (the hero balance, the orbit). Pass null to release it. */
  previewTheme: (id: string | null) => void;
  /** A screen's full takeover (product screen). Wins over everything; pass null on leaving. */
  takeover: (id: string | null) => void;
  morph: Morph;
};

const ActionsContext = createContext<ThemeActions | null>(null);
const ActiveContext = createContext<string>(HOUSE_THEME);

/**
 * Holds the active world and morphs every themed colour to it over 800 ms with the silk ease, on
 * the UI thread. An interrupted morph restarts from the colours currently on screen. Reduced
 * motion swaps instantly.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themes = getThemes();
  const house = themes[0];
  const reduced = useReducedMotion();

  const [base, setBase] = useState(HOUSE_THEME);
  const [preview, setPreview] = useState<string | null>(null);
  const [screen, setScreen] = useState<string | null>(null);
  const active = screen ?? preview ?? base;

  const progress = useSharedValue(1);
  const from = useSharedValue<ThemeTokens>(house.tokens);
  const to = useSharedValue<ThemeTokens>(house.tokens);
  const fromShader = useSharedValue<ShaderPalette>(shaderPalette(house));
  const toShader = useSharedValue<ShaderPalette>(shaderPalette(house));

  useEffect(() => {
    const theme = getTheme(active);
    const tokens = theme.tokens;
    const shader = shaderPalette(theme);
    const ms = reduced ? 0 : duration.theme;
    scheduleOnUI(() => {
      "worklet";
      const p = progress.value;
      const mixed = {} as Record<string, string>;
      for (const key of THEME_TOKENS) {
        mixed[key] = interpolateColor(p, [0, 1], [from.value[key], to.value[key]]);
      }
      const mixedShader = fromShader.value.map((value, index) => value + (toShader.value[index] - value) * p);
      from.value = mixed as ThemeTokens;
      to.value = tokens;
      fromShader.value = mixedShader;
      toShader.value = shader;
      progress.value = 0;
      progress.value = ms === 0 ? 1 : withTiming(1, { duration: ms, easing: ease.silk });
    });
  }, [active, reduced, progress, from, to, fromShader, toShader]);

  const isKnown = useCallback((id: string) => themes.some((theme) => theme.id === id), [themes]);

  const setTheme = useCallback((id: string) => {
    if (isKnown(id)) setBase(id);
  }, [isKnown]);
  const previewTheme = useCallback(
    (id: string | null) => setPreview(id !== null && isKnown(id) ? id : null),
    [isKnown],
  );
  const takeover = useCallback(
    (id: string | null) => setScreen(id !== null && isKnown(id) ? id : null),
    [isKnown],
  );

  const actions = useMemo<ThemeActions>(
    () => ({ themes, setTheme, previewTheme, takeover, morph: { progress, from, to, fromShader, toShader } }),
    [themes, setTheme, previewTheme, takeover, progress, from, to, fromShader, toShader],
  );

  return (
    <ActionsContext.Provider value={actions}>
      <ActiveContext.Provider value={active}>{children}</ActiveContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ActionsContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return context;
}

/** The id of the world on screen. Re-renders on change, so read it only where the id itself matters. */
export function useActiveThemeId() {
  return useContext(ActiveContext);
}

/** A themed colour that morphs with the app, for useAnimatedStyle / animated props / Skia. */
export function useThemeColor(token: ThemeToken): SharedValue<string> {
  const { morph } = useTheme();
  const { progress, from, to } = morph;
  return useDerivedValue(() => interpolateColor(progress.value, [0, 1], [from.value[token], to.value[token]]));
}

/** The morphing shader palette: [accent rgb, alt rgb, glow rgb, cold]. */
export function useShaderPalette(): SharedValue<ShaderPalette> {
  const { morph } = useTheme();
  const { progress, fromShader, toShader } = morph;
  return useDerivedValue(() => fromShader.value.map((value, index) => value + (toShader.value[index] - value) * progress.value));
}
