import { Canvas, Fill, RadialGradient, Rect, Shader, vec } from "@shopify/react-native-skia";
import { useIsFocused } from "expo-router";
import { memo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { useAppActive } from "@/hooks/useAppActive";
import { ATMOSPHERE_SKSL, runtimeEffect } from "@/lib/shaders";
import { useReducedMotion } from "@/stores/motion";
import { hexToRgb, palette } from "@/theme/palette";
import { useShaderPalette, useThemeColor } from "@/theme/ThemeProvider";
import { useShaderClock } from "./useShaderClock";

/** Render scale: the atmosphere is soft, so a third of the resolution is plenty. */
const SCALE = 3;
const GOLD = hexToRgb(palette.gold400);

type AtmosphereProps = {
  /** True while an opaque section fills the screen: the shader pauses. */
  covered?: SharedValue<boolean>;
  /** Scroll offset, nudging the smoke. */
  scrollY?: SharedValue<number> | null;
};

/**
 * The app-wide atmosphere: smoke, light rays and dust tinted by the active theme and morphing with
 * it. Renders at reduced resolution; pauses while unfocused, backgrounded or covered. Reduced
 * motion (or a device that can't compile the shader) gets a static themed gradient.
 */
export const Atmosphere = memo(function Atmosphere({ covered, scrollY }: AtmosphereProps) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const active = useAppActive();
  const effect = runtimeEffect(ATMOSPHERE_SKSL);
  const animated = !reduced && effect !== null;
  const time = useShaderClock(animated && focused && active, covered);
  const shader = useShaderPalette();
  const alt = useThemeColor("accentAlt");
  const glow = useThemeColor("accentGlow");

  const w = Math.ceil(width / SCALE);
  const h = Math.ceil(height / SCALE);

  const uniforms = useDerivedValue(() => {
    const c = shader.value;
    return {
      uRes: [w, h],
      uTime: time.value,
      uScroll: scrollY ? (scrollY.value / Math.max(1, height)) * 0.15 : 0,
      uAccent: [c[0], c[1], c[2]],
      uAlt: [c[3], c[4], c[5]],
      uGlow: [c[6], c[7], c[8]],
      uGold: GOLD,
      uCold: c[9],
    };
  });
  const fallback = useDerivedValue(() => [glow.value, alt.value, palette.clear]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {animated && effect ? (
        <Canvas style={[styles.scaled, { width: w, height: h, transform: [{ scale: SCALE }] }]}>
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : (
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={width} height={height} opacity={0.35}>
            <RadialGradient c={vec(width / 2, height * 0.15)} r={height * 0.7} colors={fallback} positions={[0, 0.35, 1]} />
          </Rect>
        </Canvas>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  scaled: { position: "absolute", left: 0, top: 0, transformOrigin: "0 0" },
});
