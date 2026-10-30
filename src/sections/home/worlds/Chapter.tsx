import { Canvas, Group, LinearGradient, rect, Text as SkiaText, useFont, vec } from "@shopify/react-native-skia";
import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bottle } from "@/components/product/Bottle";
import { NotesPyramid } from "@/components/product/NotesPyramid";
import { PropLayers } from "@/components/product/PropLayers";
import { VibeMeters } from "@/components/product/VibeMeters";
import { WorldBackdrop } from "@/components/product/WorldBackdrop";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { useAddToBag } from "@/hooks/useAddToBag";
import { easeFn } from "@/theme/motion";
import { alpha, palette } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import type { Product } from "@/types/product";

/** How long the stage stays fixed on screen, in screen heights of scroll. */
export const PIN = 1.8;

const pad = (value: number) => String(value).padStart(2, "0");

const segment = (value: number, from: number, to: number) => {
  "worklet";
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
};

type ChapterProps = {
  product: Product;
  index: number;
  total: number;
  width: number;
  height: number;
  /** The chapter's top in the scroll content. */
  top: number;
  scrollY: SharedValue<number>;
  /** Shared world clock (seconds), advancing while the worlds are on screen. */
  time: SharedValue<number>;
  /** Reduced motion or very large text: no hold or scrub, everything in flow. */
  reduced: boolean;
};

/**
 * One product chapter, its stage held on screen for ~1.8 screen heights: the theme morphs in, the
 * name fills from outline to colour, the bottle turns at centre stage while the ingredients drift
 * in depth, then the bottle lifts away for the notes pyramid, the vibe meters and the calls to
 * action. Reduced motion: no hold or scrub, everything laid out in flow.
 */
export function Chapter({ product, index, total, width, height, top, scrollY, time, reduced }: ChapterProps) {
  const insets = useSafeAreaInsets();
  const { tokens } = getTheme(product.slug);
  const { orderNow } = useAddToBag();

  const progress = useDerivedValue(() => (reduced ? 1 : segment(scrollY.value - top, 0, PIN * height)));
  const panelProgress = useDerivedValue(() => segment(progress.value, 0.56, 0.92));
  const meterProgress = useDerivedValue(() => segment(progress.value, 0.72, 0.98));

  const stage = useAnimatedStyle(() => ({
    transform: [{ translateY: reduced ? 0 : Math.min(PIN * height, Math.max(0, scrollY.value - top)) }],
  }));
  const bottle = useAnimatedStyle(() => {
    const p = progress.value;
    const turnIn = easeFn.lux(segment(p, 0, 0.5));
    const turnOut = segment(p, 0.5, 1);
    const lift = easeFn.silk(segment(p, 0.42, 0.56));
    return {
      transform: [
        { perspective: 1200 },
        { translateY: (1 - turnIn) * height * 0.04 - lift * height * 0.2 },
        { scale: (0.78 + turnIn * 0.22 - turnOut * 0.06) * (1 - lift * 0.45) },
        { rotateY: `${-35 * (1 - turnIn) + 18 * turnOut}deg` },
      ],
    };
  });
  const meta = useAnimatedStyle(() => ({
    opacity: segment(progress.value, 0.02, 0.14),
    transform: [{ translateY: (1 - segment(progress.value, 0.02, 0.14)) * 16 }],
  }));
  const story = useAnimatedStyle(() => ({
    opacity: segment(progress.value, 0.08, 0.2) * (1 - segment(progress.value, 0.42, 0.5)),
    transform: [{ translateY: -segment(progress.value, 0.42, 0.5) * 30 }],
  }));
  const panel = useAnimatedStyle(() => ({
    opacity: segment(progress.value, 0.5, 0.6),
    transform: [{ translateY: (1 - segment(progress.value, 0.5, 0.6)) * 40 }],
  }));
  const ctas = useAnimatedStyle(() => ({
    opacity: segment(progress.value, 0.86, 0.96),
    transform: [{ translateY: (1 - segment(progress.value, 0.86, 0.96)) * 20 }],
  }));

  const bottleHeight = Math.min(height * 0.44, 420);
  const titleId = `${product.name}, ${index + 1} / ${total}`;

  const content = (
    <>
      <Animated.View style={[styles.meta, { paddingTop: insets.top + 18 }, meta]}>
        <Text variant="micro" tone="gold300">{`${pad(index + 1)} / ${pad(total)}`}</Text>
        <Text variant="micro" style={{ color: tokens.accentInk, flexShrink: 1, textAlign: "right" }} numberOfLines={2}>
          {brand.copy.inspiredBy} {product.inspiredBy}
        </Text>
      </Animated.View>
      <ChapterName product={product} width={width} progress={progress} />
      {reduced ? (
        <View style={styles.flowBottle}>
          <Bottle product={product} height={bottleHeight * 0.8} decorative />
        </View>
      ) : (
        <Animated.View pointerEvents="none" style={[styles.bottle, { top: height * 0.3 }, bottle]}>
          <Bottle product={product} height={bottleHeight} decorative />
        </Animated.View>
      )}
      <Animated.View style={[reduced ? styles.flowStory : [styles.story, { bottom: 28 }], story]}>
        <Text variant="editorial" tone="gold200">
          {product.tagline}
        </Text>
        <Text variant="body" tone="ivory" style={styles.storyText}>
          {product.story}
        </Text>
      </Animated.View>
      <Animated.View style={[reduced ? styles.flowPanel : [styles.panel, { top: height * 0.36, bottom: 24 }], panel]}>
        <View style={[styles.panelCard, { borderColor: alpha(tokens.accentBorder, 0.6) }]}>
          <NotesPyramid product={product} progress={reduced ? undefined : panelProgress} />
          <VibeMeters product={product} progress={reduced ? undefined : meterProgress} tags={false} />
        </View>
        <Animated.View style={[styles.ctas, ctas]}>
          <Button
            variant="outline"
            colors={{ border: tokens.accentBorder }}
            label={`${brand.copy.hero.cta} ${product.name}`}
            onPress={() => router.push(`/fragrances/${product.slug}`)}
            style={styles.cta}
          />
          <Button
            variant="accent"
            colors={{ background: tokens.accent }}
            label={brand.copy.worlds.order}
            accessibilityLabel={`${brand.copy.worlds.order}: ${product.name}`}
            onPress={() => orderNow(product)}
            style={styles.cta}
          />
        </Animated.View>
      </Animated.View>
    </>
  );

  if (reduced) {
    return (
      <View style={[styles.flow, { width }]} accessibilityLabel={titleId}>
        <WorldBackdrop product={product} width={width} height={height * 1.6} />
        {content}
      </View>
    );
  }

  return (
    <View style={{ width, height: height * (1 + PIN) }} accessibilityLabel={titleId}>
      <Animated.View style={[styles.stage, { width, height }, stage]}>
        <WorldBackdrop product={product} width={width} height={height} time={time} />
        <PropLayers product={product} tokens={tokens} progress={progress} width={width} height={height} />
        {content}
      </Animated.View>
    </View>
  );
}

/** The product name in huge type, outlined, then filled in its colours from left to right (Skia). */
function ChapterName({ product, width, progress }: { product: Product; width: number; progress: SharedValue<number> }) {
  const font = useFont(require("@expo-google-fonts/cinzel/600SemiBold/Cinzel_600SemiBold.ttf"), 100);
  const { tokens } = getTheme(product.slug);
  const name = product.name.toUpperCase();
  const fit = useMemo(() => {
    if (!font) return null;
    const measured = font.measureText(name).width;
    const scale = Math.min(1.3, (width * 0.9) / Math.max(1, measured));
    return { scale, textWidth: measured * scale, height: 100 * scale * 1.05 };
  }, [font, name, width]);

  const fill = useDerivedValue(() => easeFn.lux(segment(progress.value, 0, 0.4)));
  const clip = useDerivedValue(() => (fit ? rect(0, 0, fit.textWidth * fill.value + 2, fit.height) : rect(0, 0, 0, 0)));
  const drift = useDerivedValue(() => [{ translateX: (0.04 - progress.value * 0.08) * width }]);
  const dim = useAnimatedStyle(() => ({ opacity: 1 - segment(progress.value, 0.42, 0.52) * 0.72 }));

  if (!font || !fit) return <View style={styles.nameSlot} />;
  const x = (width - fit.textWidth) / 2;
  const baseline = 100 * fit.scale * 0.86;
  return (
    <Animated.View
      style={[styles.nameSlot, { height: fit.height }, dim]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={product.name}
    >
      <Canvas style={{ width, height: fit.height }}>
        <Group transform={drift}>
          <Group transform={[{ translateX: x }, { scale: fit.scale }]}>
            <SkiaText x={0} y={baseline / fit.scale} text={name} font={font} style="stroke" strokeWidth={1.4 / fit.scale} color={alpha(palette.gold300, 0.75)} />
          </Group>
          <Group clip={clip} transform={[{ translateX: x }]}>
            <Group transform={[{ scale: fit.scale }]}>
              <SkiaText x={0} y={baseline / fit.scale} text={name} font={font}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 100)} colors={[tokens.accent200, tokens.accent, tokens.accent700]} />
              </SkiaText>
            </Group>
          </Group>
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { position: "absolute", top: 0, left: 0, overflow: "hidden", backgroundColor: palette.ink950 },
  flow: { overflow: "hidden", paddingBottom: 48, backgroundColor: palette.ink950 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, paddingHorizontal: 20 },
  nameSlot: { marginTop: 18, minHeight: 60 },
  bottle: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  flowBottle: { alignItems: "center", marginTop: 12 },
  story: { position: "absolute", left: 20, right: 20, gap: 10 },
  flowStory: { paddingHorizontal: 20, gap: 10, marginTop: 24 },
  storyText: { maxWidth: 520 },
  panel: { position: "absolute", left: 16, right: 16, justifyContent: "flex-end", gap: 14 },
  flowPanel: { paddingHorizontal: 16, gap: 14, marginTop: 28 },
  panelCard: { gap: 20, padding: 18, backgroundColor: alpha(palette.ink950, 0.72), borderWidth: StyleSheet.hairlineWidth },
  ctas: { flexDirection: "row", gap: 10 },
  cta: { flex: 1 },
});
