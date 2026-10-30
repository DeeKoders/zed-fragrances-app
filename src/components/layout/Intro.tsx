import { Canvas, Group, Image as SkiaImage, LinearGradient, Mask, Rect, useImage, vec } from "@shopify/react-native-skia";
import { useEffect } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { brand } from "@/config/brand";
import { useIntro } from "@/stores/intro";
import { duration, easeFn } from "@/theme/motion";
import { alpha, palette } from "@/theme/palette";

/** Playback rate once the user taps: wraps up fast, no hard cut. */
const SKIP_RATE = 4;
/** Timeline marks, as a share of the whole intro. */
const CURTAIN_AT = 0.68;

const clamp01 = (value: number) => {
  "worklet";
  return Math.min(1, Math.max(0, value));
};

/**
 * The in-app intro (the website's preloader), after the native splash: a gold reveal and shine of
 * the official wordmark through a Skia gradient mask, the diamond rule expanding, then a curtain
 * splitting on the rule to reveal Home. At most 1.8 s; a tap speeds it up. Plays once per cold
 * start; skipped with reduced motion and when the app opens from a deep link (see the root layout).
 */
export function Intro() {
  const status = useIntro((state) => state.status);
  if (status !== "playing" && status !== "revealing") return null;
  return <IntroOverlay />;
}

function IntroOverlay() {
  const { width, height } = useWindowDimensions();
  const advance = useIntro((state) => state.advance);
  const wordmark = useImage(brand.logo.wordmark.source);
  const logoWidth = Math.min(width * 0.72, 448);
  const logoHeight = (logoWidth * brand.logo.wordmark.height) / brand.logo.wordmark.width;

  const progress = useSharedValue(0);
  const rate = useSharedValue(1);
  const revealed = useSharedValue(false);

  // The `frame` handle isn't reachable from this worklet (UI thread), so it idles once finished;
  // "done" unmounts the overlay, which unregisters it.
  const frame = useFrameCallback((info) => {
    if (progress.value >= 1) return;
    const delta = (info.timeSincePreviousFrame ?? 16) / duration.intro;
    progress.value = Math.min(1, progress.value + delta * rate.value);
    if (!revealed.value && progress.value >= CURTAIN_AT) {
      revealed.value = true;
      scheduleOnRN(advance, "revealing");
    }
    if (progress.value >= 1) scheduleOnRN(advance, "done");
  }, false);

  // Start once the wordmark is decoded, so the reveal never plays over an empty canvas.
  useEffect(() => {
    if (wordmark) frame.setActive(true);
  }, [wordmark, frame]);
  // Failsafe: never hold the app if something goes wrong.
  useEffect(() => {
    const timer = setTimeout(() => advance("done"), duration.intro * 2.5);
    return () => clearTimeout(timer);
  }, [advance]);

  const reveal = useDerivedValue(() => easeFn.lux(clamp01(progress.value / 0.42)));
  const maskStops = useDerivedValue(() => {
    const edge = reveal.value * 1.3;
    return [Math.max(0, edge - 0.3), Math.min(1, Math.max(0.0001, edge))];
  });
  const shine = useDerivedValue(() => {
    const t = clamp01((progress.value - 0.12) / 0.5);
    const x = -logoWidth * 0.4 + t * logoWidth * 1.8;
    return { start: vec(x - logoWidth * 0.25, 0), end: vec(x + logoWidth * 0.25, logoHeight) };
  });
  const shineStart = useDerivedValue(() => shine.value.start);
  const shineEnd = useDerivedValue(() => shine.value.end);

  const content = useAnimatedStyle(() => ({ opacity: 1 - clamp01((progress.value - 0.64) / 0.12) }));
  const rule = useAnimatedStyle(() => ({ transform: [{ scaleX: easeFn.lux(clamp01((progress.value - 0.38) / 0.28)) }] }));
  const diamond = useAnimatedStyle(() => ({
    opacity: clamp01((progress.value - 0.34) / 0.1),
    transform: [{ rotate: "45deg" }, { scale: clamp01((progress.value - 0.34) / 0.1) }],
  }));
  const travel = height / 2 + 40;
  const top = useAnimatedStyle(() => ({
    transform: [{ translateY: -easeFn.silk(clamp01((progress.value - CURTAIN_AT) / (1 - CURTAIN_AT))) * travel }],
  }));
  const bottom = useAnimatedStyle(() => ({
    transform: [{ translateY: easeFn.silk(clamp01((progress.value - CURTAIN_AT) / (1 - CURTAIN_AT))) * travel }],
  }));

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => {
        rate.value = SKIP_RATE;
      }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Animated.View style={[styles.panel, { top: 0, height: height / 2 + 1 }, top]} />
      <Animated.View style={[styles.panel, { top: height / 2, height: height / 2 + 1 }, bottom]} />
      <Animated.View style={[styles.center, content]} pointerEvents="none">
        <Canvas style={{ width: logoWidth, height: logoHeight }}>
          {wordmark ? (
            <Mask
              mode="alpha"
              mask={
                <Rect x={0} y={0} width={logoWidth} height={logoHeight}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(logoWidth, 0)}
                    colors={[palette.ivory, palette.clear]}
                    positions={maskStops}
                  />
                </Rect>
              }
            >
              <Group>
                <SkiaImage image={wordmark} x={0} y={0} width={logoWidth} height={logoHeight} fit="contain" />
                <Rect x={0} y={0} width={logoWidth} height={logoHeight} blendMode="srcATop">
                  <LinearGradient
                    start={shineStart}
                    end={shineEnd}
                    colors={[palette.clear, alpha(palette.gold100, 0.95), palette.clear]}
                  />
                </Rect>
              </Group>
            </Mask>
          ) : null}
        </Canvas>
        <View style={[styles.ruleRow, { width: logoWidth * 1.1 }]}>
          <Animated.View style={[styles.rule, rule]} />
          <Animated.View style={[styles.diamond, diamond]} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { position: "absolute", left: 0, right: 0, backgroundColor: palette.ink950 },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", paddingBottom: 24 },
  ruleRow: { height: 12, marginTop: 28, alignItems: "center", justifyContent: "center" },
  rule: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth * 2, backgroundColor: palette.gold400 },
  diamond: { width: 8, height: 8, backgroundColor: palette.gold300 },
});
