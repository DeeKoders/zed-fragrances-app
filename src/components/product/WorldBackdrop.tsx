import { BlurMask, Canvas, Circle, Group, RadialGradient, Rect, vec } from "@shopify/react-native-skia";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from "react-native-reanimated";
import { TextureLayer } from "@/components/textures/Texture";
import { alpha, palette } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import type { Product } from "@/types/product";
import { Emblem } from "./Emblem";

/** Bokeh layout as % of the backdrop, size as % of its short side, drift period in seconds. */
const BOKEH = [
  { x: 14, y: 20, size: 9, period: 14 },
  { x: 70, y: 14, size: 5, period: 11 },
  { x: 86, y: 56, size: 12, period: 17 },
  { x: 28, y: 76, size: 7, period: 13 },
  { x: 52, y: 38, size: 4, period: 10 },
  { x: 6, y: 50, size: 6, period: 15 },
  { x: 62, y: 88, size: 10, period: 19 },
] as const;

type WorldBackdropProps = {
  product: Product;
  width: number;
  height: number;
  /** Seconds; animates the texture and bokeh. Omit for a still world. */
  time?: SharedValue<number>;
  /** 0..1 extra glow (the favoured world brightens). */
  glow?: SharedValue<number>;
  /** 0..1 dimming (the other world dims). */
  dim?: SharedValue<number>;
  /** Mirror the bokeh (second world). */
  mirror?: boolean;
  emblem?: boolean;
};

/**
 * A product's world: its accent gradient and glow, its procedural texture, drifting bokeh (gold when
 * warm, icy when cold) and its emblem as a watermark. Always in the product's own colours, whatever
 * the app's theme is. Decorative.
 */
export const WorldBackdrop = memo(function WorldBackdrop({
  product,
  width,
  height,
  time,
  glow,
  dim,
  mirror = false,
  emblem = true,
}: WorldBackdropProps) {
  const { tokens } = getTheme(product.slug);
  const cold = product.theme.mood === "cold";
  const short = Math.min(width, height);
  const glowOpacity = useDerivedValue(() => 0.6 + (glow ? glow.value : 0) * 0.4);
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim ? dim.value * 0.6 : 0 }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width / 2, height * 0.45)}
            r={Math.max(width, height) * 0.75}
            colors={[tokens.accentAlt, palette.ink950]}
          />
        </Rect>
        <TextureLayer kind={product.theme.texture} seed={product.slug} tokens={tokens} width={width} height={height} time={time} />
        <Group opacity={glowOpacity}>
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={vec(width / 2, height / 2)}
              r={Math.max(width, height) * 0.6}
              colors={[alpha(tokens.accentGlow, 0.42), alpha(tokens.accent, 0.14), palette.clear]}
              positions={[0, 0.45, 1]}
            />
          </Rect>
        </Group>
        {BOKEH.map((bokeh, index) => (
          <Bokeh
            key={index}
            x={((mirror ? 100 - bokeh.x : bokeh.x) / 100) * width}
            y={(bokeh.y / 100) * height}
            r={(bokeh.size / 100) * short * 0.5}
            period={bokeh.period}
            color={cold ? alpha(tokens.accentGlow, 0.35) : alpha(palette.gold300, 0.3)}
            time={time}
          />
        ))}
      </Canvas>
      {emblem ? (
        <View style={styles.center}>
          <Emblem product={product} size={Math.min(height * 0.68, 540)} opacity={0.07} />
        </View>
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} />
    </View>
  );
});

function Bokeh({ x, y, r, period, color, time }: { x: number; y: number; r: number; period: number; color: string; time?: SharedValue<number> }) {
  const transform = useDerivedValue(() => {
    const t = time ? (time.value / period) * Math.PI * 2 : 0;
    return [{ translateX: Math.sin(t) * r * 0.6 }, { translateY: Math.cos(t * 0.8) * r * 0.9 }];
  });
  const opacity = useDerivedValue(() => (time ? 0.55 + Math.sin((time.value / period) * Math.PI * 4) * 0.45 : 0.7));
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={x} cy={y} r={r} color={color}>
        <BlurMask blur={r * 0.6} style="normal" />
      </Circle>
    </Group>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.ink950, overflow: "hidden" },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  dim: { backgroundColor: palette.ink950 },
});
