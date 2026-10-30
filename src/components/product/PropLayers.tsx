import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { alpha } from "@/theme/palette";
import type { ThemeTokens } from "@/theme/types";
import type { ImageSource, Product } from "@/types/product";

/** Where props float, as % of the stage, kept clear of the centre. depth 0 far … 2 near. */
const SLOTS = [
  { x: 12, y: 20, depth: 2 },
  { x: 86, y: 28, depth: 1 },
  { x: 7, y: 62, depth: 1 },
  { x: 91, y: 68, depth: 2 },
  { x: 24, y: 88, depth: 0 },
  { x: 76, y: 12, depth: 0 },
  { x: 64, y: 86, depth: 1 },
  { x: 34, y: 10, depth: 2 },
] as const;

/** Size (pt) and opacity per depth. */
const DEPTH_STYLE = [
  { size: 104, opacity: 0.25 },
  { size: 64, opacity: 0.55 },
  { size: 44, opacity: 0.9 },
] as const;

/** Parallax travel per depth layer, % of the stage height. */
export const LAYER_TRAVEL = [8, 18, 32];

type Item = { key: string; label: string; source?: ImageSource; x: number; y: number; depth: 0 | 1 | 2 };

function itemsOf(product: Product): Item[] {
  const notes = [...product.notes.top, ...product.notes.heart, ...product.notes.base];
  const sources = product.props.length > 0 ? product.props : null;
  const count = Math.min(SLOTS.length, sources ? sources.length : notes.length);
  return Array.from({ length: count }, (_, index) => ({
    key: `${index}`,
    label: notes[index % Math.max(1, notes.length)] ?? "",
    source: sources?.[index],
    ...SLOTS[index],
  }));
}

/**
 * The product's ingredients drifting in three parallax depth layers as `progress` runs 0 → 1.
 * While `props` is empty, glowing orbs named after the notes stand in. Decorative.
 */
export function PropLayers({
  product,
  tokens,
  progress,
  width,
  height,
}: {
  product: Product;
  tokens: ThemeTokens;
  progress?: SharedValue<number>;
  width: number;
  height: number;
}) {
  const items = itemsOf(product);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {([0, 1, 2] as const).map((depth) => (
        <Layer key={depth} depth={depth} progress={progress} height={height}>
          {items
            .filter((item) => item.depth === depth)
            .map((item) => (
              <Prop key={item.key} item={item} tokens={tokens} width={width} height={height} />
            ))}
        </Layer>
      ))}
    </View>
  );
}

function Layer({ depth, progress, height, children }: { depth: number; progress?: SharedValue<number>; height: number; children: React.ReactNode }) {
  const travel = (LAYER_TRAVEL[depth] / 100) * height;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: progress ? interpolate(progress.value, [0, 1], [travel, -travel]) : 0 }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

function Prop({ item, tokens, width, height }: { item: Item; tokens: ThemeTokens; width: number; height: number }) {
  const { size, opacity } = DEPTH_STYLE[item.depth];
  const position = { left: (item.x / 100) * width - size / 2, top: (item.y / 100) * height - size / 2, width: size, height: size, opacity };
  if (item.source) {
    return <Image source={item.source} contentFit="contain" style={[styles.prop, position]} />;
  }
  return (
    <View style={[styles.prop, position, styles.orbWrap]}>
      <View
        style={[
          styles.orb,
          {
            backgroundColor: alpha(tokens.accentGlow, 0.22),
            borderColor: alpha(tokens.accent300, 0.6),
            shadowColor: tokens.accentGlow,
          },
        ]}
      />
      {item.depth > 0 ? (
        <Text variant="micro" tone="gold200" numberOfLines={1} style={[styles.orbLabel, { left: (size - 120) / 2 }]} maxFontSizeMultiplier={1.2}>
          {item.label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  prop: { position: "absolute" },
  orbWrap: { alignItems: "center", justifyContent: "center" },
  orb: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  orbLabel: { position: "absolute", top: "100%", marginTop: 6, width: 120, textAlign: "center", fontSize: 9 },
});
