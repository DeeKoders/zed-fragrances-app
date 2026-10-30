import { useIsFocused } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { FloatingBottle } from "@/components/product/FloatingBottle";
import { WorldBackdrop } from "@/components/product/WorldBackdrop";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { useTilt } from "@/hooks/useTilt";
import { haptics } from "@/lib/haptics";
import { selectHeroReady, useIntro } from "@/stores/intro";
import { useReducedMotion } from "@/stores/motion";
import { duration, ease, spring } from "@/theme/motion";
import { palette } from "@/theme/palette";
import { useTheme } from "@/theme/ThemeProvider";
import { fontSizeFor } from "@/theme/typography";
import type { Product } from "@/types/product";
import { KineticZed } from "./KineticZed";
import { WorldCopy } from "./WorldCopy";

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 50;
/** Orbit radius as a share of the width. */
const RADIUS = 0.4;

/** Where item `index` sits when `position` is in front: x offset, scale, opacity, stacking. */
function orbitPose(index: number, position: number, count: number, radius: number) {
  "worklet";
  let offset = (((index - position) % count) + count) % count;
  if (offset > count / 2) offset -= count;
  const angle = (offset / count) * Math.PI * 2;
  const depth = (Math.cos(angle) + 1) / 2;
  return {
    x: Math.sin(angle) * radius,
    scale: 0.5 + 0.5 * depth,
    opacity: 0.2 + 0.8 * depth ** 2,
    zIndex: Math.round(depth * 100),
  };
}

type OrbitHeroProps = { products: Product[]; width: number; height: number; scrollY: SharedValue<number> };

/**
 * The hero for any product count other than two: bottles on an orbit with swipe, buttons and
 * autoplay, the front product's world behind and its theme across the app. One product shows a
 * single still world.
 */
export function OrbitHero({ products, width, height, scrollY }: OrbitHeroProps) {
  const count = products.length;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const heroReady = useIntro(selectHeroReady);
  const { previewTheme } = useTheme();
  const tilt = useTilt(focused);
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const position = useSharedValue(0);
  const time = useSharedValue(0);
  const enter = useSharedValue(reduced ? 1 : 0);
  const product = products[active];
  const single = count < 2;

  useEffect(() => {
    if (heroReady) enter.value = reduced ? 1 : withTiming(1, { duration: duration.reveal, easing: ease.lux });
  }, [heroReady, reduced, enter]);

  const frame = useFrameCallback((info) => {
    if (scrollY.value > height) return;
    time.value += Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
  }, false);
  useEffect(() => {
    frame.setActive(focused && !reduced && !single);
  }, [focused, reduced, single, frame]);

  const go = useCallback(
    (next: number) => {
      const index = ((next % count) + count) % count;
      setActive(index);
      haptics.selection();
      position.value = reduced ? next : withSpring(next, spring.snap);
    },
    [count, reduced, position],
  );

  // The front product's theme fills the app while the hero is in view.
  const [inView, setInView] = useState(true);
  useAnimatedReaction(
    () => scrollY.value < height * 0.65,
    (now, before) => {
      if (now !== before) scheduleOnRN(setInView, now);
    },
    [height],
  );
  useEffect(() => {
    previewTheme(focused && inView && !single ? product.slug : null);
  }, [previewTheme, focused, inView, product.slug, single]);
  useEffect(() => () => previewTheme(null), [previewTheme]);

  useEffect(() => {
    if (reduced || interacted || single || !focused || !inView) return;
    const timer = setInterval(() => go(Math.round(position.value) + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [reduced, interacted, single, focused, inView, go, position]);

  const swipe = usePanGesture({
    activeOffsetX: [-15, 15],
    failOffsetY: [-12, 12],
    onDeactivate: (event) => {
      "worklet";
      if (Math.abs(event.translationX) < SWIPE_PX) return;
      scheduleOnRN(setInteracted, true);
      scheduleOnRN(go, Math.round(position.value) + (event.translationX < 0 ? 1 : -1));
    },
  });

  const megaSize = fontSizeFor("mega", width) * 0.8;
  const bottleHeight = Math.min(height * 0.36, 320);

  return (
    <GestureDetector gesture={swipe}>
      <View style={[styles.hero, { width, height }]}>
        <WorldBackdrop key={product.slug} product={product} width={width} height={height} time={single ? undefined : time} />
        <View style={[styles.zed, { top: insets.top + 24 }]}>
          <KineticZed width={width} size={megaSize} pointerX={tilt.x} pointerY={tilt.y} time={reduced ? undefined : time} enter={enter} />
          <Text variant="micro" tone="gold200" align="center" accessibilityRole="header" accessibilityLabel={`${brand.name}. ${brand.taglines.primary}`}>
            {brand.taglines.primary}
          </Text>
        </View>
        <View style={[styles.track, { top: height * 0.34, height: bottleHeight }]}>
          {products.map((item, index) => (
            <OrbitItem key={item.slug} index={index} count={count} position={position} width={width}>
              <FloatingBottle product={item} height={bottleHeight} tiltX={tilt.x} tiltY={tilt.y} decorative={index !== active} />
            </OrbitItem>
          ))}
        </View>
        <View style={[styles.copy, { bottom: 24 }]}>
          <WorldCopy key={product.slug} product={product} align="center" />
          {!single ? (
            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={brand.copy.hero.previous}
                onPress={() => {
                  setInteracted(true);
                  go(Math.round(position.value) - 1);
                }}
                style={styles.control}
              >
                <Icon name="back" />
              </Pressable>
              <Text variant="micro" tone="ivoryMuted">{`${active + 1} / ${count}`}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={brand.copy.hero.next}
                onPress={() => {
                  setInteracted(true);
                  go(Math.round(position.value) + 1);
                }}
                style={styles.control}
              >
                <Icon name="forward" />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </GestureDetector>
  );
}

function OrbitItem({
  index,
  count,
  position,
  width,
  children,
}: {
  index: number;
  count: number;
  position: SharedValue<number>;
  width: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const pose = orbitPose(index, position.value, Math.max(1, count), width * RADIUS);
    return { opacity: pose.opacity, zIndex: pose.zIndex, transform: [{ translateX: pose.x }, { scale: pose.scale }] };
  });
  return <Animated.View style={[styles.item, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  hero: { overflow: "hidden", backgroundColor: palette.ink950 },
  zed: { position: "absolute", left: 0, right: 0, gap: 8 },
  track: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  item: { position: "absolute" },
  copy: { position: "absolute", left: 20, right: 20, alignItems: "center", gap: 16 },
  controls: { flexDirection: "row", alignItems: "center", gap: 18 },
  control: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold700 },
});
