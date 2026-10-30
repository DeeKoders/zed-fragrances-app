import { router, useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture, useSimultaneousGestures, useTapGesture } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { FloatingBottle } from "@/components/product/FloatingBottle";
import { WorldBackdrop } from "@/components/product/WorldBackdrop";
import { Seam } from "@/components/shaders/Seam";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { useAppActive } from "@/hooks/useAppActive";
import { useTilt } from "@/hooks/useTilt";
import { haptics } from "@/lib/haptics";
import { selectHeroReady, useIntro } from "@/stores/intro";
import { useReducedMotion } from "@/stores/motion";
import { duration, ease } from "@/theme/motion";
import { palette } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import { useTheme } from "@/theme/ThemeProvider";
import { fontSizeFor } from "@/theme/typography";
import type { Product } from "@/types/product";
import { KineticZed } from "./KineticZed";
import { WorldCopy } from "./WorldCopy";

// The website's SplitHero constants (src/sections/home/hero/SplitHero.tsx), stacked as on phones.

/** How far the favoured world grows, as a share of the hero. */
const SEAM_SHIFT = 0.12;
/** How far the seam rises as the hero scrolls away, as a share of the hero. */
const SCROLL_PUSH = 0.3;
/** Pointer distance from the centre (0..1) ignored before a world starts to win. */
const DEAD_ZONE = 0.08;
/** A world takes over the app theme past TAKEOVER and lets go below RELEASE. */
const TAKEOVER = 0.4;
const RELEASE = 0.2;
/** Idle sway amplitude and speed (rad/s), so the hero never sits still. */
const SWAY = 0.18;
const SWAY_SPEED = 0.6;
/** Share of the hero that must be on screen for it to own the theme. */
const IN_VIEW = 0.35;
/** How much device tilt nudges the balance. */
const TILT_NUDGE = 0.35;

const shape = (raw: number) => {
  "worklet";
  return Math.sign(raw) * Math.min(1, Math.max(0, (Math.abs(raw) - DEAD_ZONE) / 0.6));
};

type SplitHeroProps = {
  products: [Product, Product];
  width: number;
  height: number;
  scrollY: SharedValue<number>;
};

/**
 * Two worlds stacked top and bottom. A tap on a world favours it (tap again to let go); press and
 * drag scrubs the balance; device tilt nudges it and an idle sway keeps it alive. The favoured world
 * grows and brightens, the other dims, and past a threshold the whole app takes the favoured
 * world's theme. A living Skia seam runs between them and rises as the hero scrolls away.
 */
export function SplitHero({ products, width, height, scrollY }: SplitHeroProps) {
  const [first, second] = products;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const appActive = useAppActive();
  const heroReady = useIntro(selectHeroReady);
  const { previewTheme } = useTheme();
  const tilt = useTilt(focused);

  const balance = useSharedValue(0);
  const seam = useSharedValue(0.5);
  const tap = useSharedValue(0);
  const dragging = useSharedValue(false);
  const dragY = useSharedValue(0);
  const dragX = useSharedValue(0);
  const favoured = useSharedValue(-1);
  const time = useSharedValue(0);
  const enter = useSharedValue(reduced ? 1 : 0);
  const paused = useDerivedValue(() => scrollY.value > height);

  // The hero's entrance waits for the intro's curtain.
  useEffect(() => {
    if (!heroReady) return;
    enter.value = reduced ? 1 : withTiming(1, { duration: duration.reveal + 240, easing: ease.lux });
  }, [heroReady, reduced, enter]);

  const slugs = useRef([first.slug, second.slug]);
  slugs.current = [first.slug, second.slug];
  const onFavour = useCallback(
    (index: number) => {
      previewTheme(index < 0 ? null : slugs.current[index]);
      if (index >= 0) haptics.selection();
    },
    [previewTheme],
  );
  useEffect(() => () => previewTheme(null), [previewTheme]);

  const frame = useFrameCallback((info) => {
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    if (scrollY.value > height) return;
    time.value += dt;
    const engaged = dragging.value || tap.value !== 0;
    const idle = reduced ? 0 : Math.sin(time.value * SWAY_SPEED) * SWAY + tilt.y.value * TILT_NUDGE;
    const target = dragging.value ? shape(dragY.value) : tap.value !== 0 ? tap.value : idle;
    balance.value = reduced ? target : balance.value + (target - balance.value) * (1 - Math.exp(-dt * 5));

    const inView = scrollY.value < height * (1 - IN_VIEW);
    let next = favoured.value;
    if (!engaged || !inView) next = -1;
    else if (balance.value < -TAKEOVER) next = 0;
    else if (balance.value > TAKEOVER) next = 1;
    else if (Math.abs(balance.value) < RELEASE) next = -1;
    if (next !== favoured.value) {
      favoured.value = next;
      scheduleOnRN(onFavour, next);
    }

    const push = Math.min(1, Math.max(0, scrollY.value / height)) * SCROLL_PUSH;
    seam.value = reduced ? 0.5 : Math.min(0.9, Math.max(0.1, 0.5 - balance.value * SEAM_SHIFT - push));
  }, false);

  useEffect(() => {
    frame.setActive(focused && appActive);
    if (!focused) {
      tap.value = 0;
      dragging.value = false;
    }
  }, [focused, appActive, frame, tap, dragging]);

  // Leaving the hero lets go of a tapped world.
  useAnimatedReaction(
    () => scrollY.value > height * (1 - IN_VIEW),
    (away, before) => {
      if (away && !before) tap.value = 0;
    },
    [height],
  );

  const tapGesture = useTapGesture({
    maxDuration: 400,
    onActivate: (event) => {
      "worklet";
      const side = event.y < seam.value * height ? -1 : 1;
      tap.value = tap.value === side ? 0 : side;
    },
  });
  const panGesture = usePanGesture({
    activateAfterLongPress: 180,
    onActivate: (event) => {
      "worklet";
      dragging.value = true;
      dragY.value = (event.y / height) * 2 - 1;
      dragX.value = (event.x / width) * 2 - 1;
      scheduleOnRN(haptics.selection);
    },
    onUpdate: (event) => {
      "worklet";
      dragY.value = Math.max(-1, Math.min(1, (event.y / height) * 2 - 1));
      dragX.value = Math.max(-1, Math.min(1, (event.x / width) * 2 - 1));
    },
    onFinalize: () => {
      "worklet";
      if (dragging.value) tap.value = balance.value < -TAKEOVER ? -1 : balance.value > TAKEOVER ? 1 : 0;
      dragging.value = false;
    },
  });
  const gesture = useSimultaneousGestures(tapGesture, panGesture);

  // Touch wins over tilt for the bottles and letters.
  const pointerX = useDerivedValue(() => (reduced ? 0 : dragging.value ? dragX.value : tilt.x.value));
  const pointerY = useDerivedValue(() => (reduced ? 0 : dragging.value ? dragY.value : tilt.y.value * 0.6 + balance.value * 0.3));

  const favourA = useDerivedValue(() => Math.max(0, -balance.value));
  const favourB = useDerivedValue(() => Math.max(0, balance.value));

  const clip = useAnimatedStyle(() => ({ transform: [{ translateY: seam.value * height }] }));
  const clipInner = useAnimatedStyle(() => ({ transform: [{ translateY: -seam.value * height }] }));
  const line = useAnimatedStyle(() => ({ transform: [{ translateY: seam.value * height }], opacity: enter.value }));

  const megaSize = fontSizeFor("mega", width);
  const bottleHeight = Math.min(height * 0.28, 260);
  const glows: [string, string] = [getTheme(first.slug).tokens.accentGlow, getTheme(second.slug).tokens.accentGlow];

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.hero, { width, height }]} accessibilityRole="summary">
        <WorldBackdrop product={first} width={width} height={height} time={time} glow={favourA} dim={favourB} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.clip, clip]}>
          <Animated.View style={[{ width, height }, clipInner]}>
            <WorldBackdrop product={second} width={width} height={height} time={time} glow={favourB} dim={favourA} mirror />
          </Animated.View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.line, line]} />
        <Seam
          width={width}
          height={height}
          balance={balance}
          seam={seam}
          colors={glows}
          running={!reduced && focused && appActive}
          paused={paused}
        />
        <View pointerEvents="none" style={[styles.scrim, { height: insets.top + 80 }]} />

        <View pointerEvents="none" style={[styles.zed, { top: height / 2 - megaSize * 0.55 }]}>
          <KineticZed width={width} size={megaSize} pointerX={pointerX} pointerY={pointerY} time={reduced ? undefined : time} enter={enter} />
        </View>

        <Stage
          product={first}
          side="a"
          height={height}
          topInset={insets.top}
          seam={seam}
          favour={favourA}
          rival={favourB}
          enter={enter}
          bottleHeight={bottleHeight}
          pointerX={pointerX}
          pointerY={pointerY}
          reduced={reduced}
        />
        <Stage
          product={second}
          side="b"
          height={height}
          topInset={insets.top}
          seam={seam}
          favour={favourB}
          rival={favourA}
          enter={enter}
          bottleHeight={bottleHeight}
          pointerX={pointerX}
          pointerY={pointerY}
          reduced={reduced}
        />

        <HeroTagline top={height / 2 + megaSize * 0.42} enter={enter} />
      </View>
    </GestureDetector>
  );
}

type StageProps = {
  product: Product;
  side: "a" | "b";
  height: number;
  topInset: number;
  seam: SharedValue<number>;
  favour: SharedValue<number>;
  rival: SharedValue<number>;
  enter: SharedValue<number>;
  bottleHeight: number;
  pointerX: SharedValue<number>;
  pointerY: SharedValue<number>;
  reduced: boolean;
};

/** One world's bottle and copy, kept centred in its half as the seam moves. */
function Stage({ product, side, height, topInset, seam, favour, rival, enter, bottleHeight, pointerX, pointerY, reduced }: StageProps) {
  const isA = side === "a";
  const half = height / 2;
  const box = useAnimatedStyle(() => ({
    transform: [{ translateY: reduced ? 0 : (seam.value - 0.5) * height * (isA ? 0.5 : 0.5) }],
  }));
  const emphasis = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : 1 + favour.value * 0.04 - rival.value * 0.08 }],
  }));
  const copy = useAnimatedStyle(() => ({
    opacity: (1 - rival.value * 0.5) * interpolate(enter.value, [0.3, 1], [0, 1], "clamp"),
    transform: [{ translateY: (1 - enter.value) * 24 }],
  }));
  const lift = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.7], [0, 1], "clamp"),
    transform: [{ translateY: (1 - enter.value) * 40 }],
  }));

  return (
    <Animated.View
      style={[
        styles.stage,
        isA
          ? { top: 0, height: half, paddingTop: topInset + 36, paddingBottom: height * 0.12, flexDirection: "row" }
          : { top: half, height: half, paddingTop: height * 0.16, paddingBottom: 16, flexDirection: "row-reverse" },
        box,
      ]}
    >
      <Animated.View style={lift}>
        <Animated.View style={[emphasis, { transformOrigin: "bottom" }]}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${brand.copy.hero.cta} ${product.name}`}
            onPress={() => router.push(`/fragrances/${product.slug}`)}
            hitSlop={4}
          >
            <FloatingBottle
              product={product}
              height={bottleHeight}
              tiltX={pointerX}
              tiltY={pointerY}
              depth={isA ? 1 : 1.25}
              floatDelay={isA ? 0 : 1500}
              decorative
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.copy, copy]}>
        <WorldCopy product={product} align={isA ? "left" : "right"} />
      </Animated.View>
    </Animated.View>
  );
}

function HeroTagline({ top, enter }: { top: number; enter: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0.5, 1], [0, 1], "clamp"),
    transform: [{ translateY: (1 - enter.value) * 12 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.tagline, { top }, style]}>
      <Text
        variant="micro"
        tone="gold200"
        align="center"
        accessibilityRole="header"
        accessibilityLabel={`${brand.name}. ${brand.taglines.primary}`}
      >
        {brand.taglines.primary}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: "hidden", backgroundColor: palette.ink950 },
  clip: { overflow: "hidden" },
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: palette.gold300,
    opacity: 0.8,
  },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: palette.ink950, opacity: 0.35 },
  zed: { position: "absolute", left: 0, right: 0 },
  stage: { position: "absolute", left: 0, right: 0, alignItems: "center", gap: 18, paddingHorizontal: 20 },
  copy: { flex: 1, minWidth: 0 },
  tagline: { position: "absolute", left: 20, right: 20 },
});
