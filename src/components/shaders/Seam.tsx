import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { runtimeEffect, SEAM_SKSL } from "@/lib/shaders";
import { hexToRgb, palette } from "@/theme/palette";
import { useShaderClock } from "./useShaderClock";

/** The seam is sharp at its core, so it keeps half the resolution. */
const SCALE = 2;
const GOLD = hexToRgb(palette.gold300);

type SeamProps = {
  width: number;
  height: number;
  /** -1 (first world) … 1 (second world). */
  balance: SharedValue<number>;
  /** Seam position, 0..1 from the top. */
  seam: SharedValue<number>;
  /** The two worlds' glow colours (hex). */
  colors: [string, string];
  running: boolean;
  paused?: SharedValue<boolean>;
};

/**
 * The living seam between the two worlds, as a Skia shader. Null when the shader can't compile:
 * the hero then shows only its static gold rule.
 */
export function Seam({ width, height, balance, seam, colors, running, paused }: SeamProps) {
  const effect = runtimeEffect(SEAM_SKSL);
  const time = useShaderClock(running && effect !== null, paused);
  const w = Math.ceil(width / SCALE);
  const h = Math.ceil(height / SCALE);
  const colorA = hexToRgb(colors[0]);
  const colorB = hexToRgb(colors[1]);

  const uniforms = useDerivedValue(() => ({
    uRes: [w, h],
    uTime: time.value,
    uSeam: seam.value,
    uBalance: balance.value,
    uPx: 1 / SCALE,
    uColorA: colorA,
    uColorB: colorB,
    uGold: GOLD,
  }));

  if (!effect) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Canvas style={[styles.scaled, { width: w, height: h, transform: [{ scale: SCALE }] }]}>
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  scaled: { position: "absolute", left: 0, top: 0, transformOrigin: "0 0" },
});
