import { useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { useReducedMotion } from "@/stores/motion";
import { palette } from "@/theme/palette";

/** Points per second at rest, and how much scroll velocity adds. */
const BASE_SPEED = 50;
const VELOCITY_GAIN = 0.18;
const MAX_BOOST = 1200;
const COPIES = 3;

const labels = Array.from(new Set([...brand.features, ...products.flatMap((product) => product.features)].map((f) => f.label)));

/** An endless strip of tracked gold caps (the feature labels, separated by ◆). Faster while scrolling. */
export function Marquee({ scrollY }: { scrollY: SharedValue<number> }) {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const [copyWidth, setCopyWidth] = useState(0);
  const offset = useSharedValue(0);
  const boost = useSharedValue(0);
  const last = useSharedValue(0);
  const span = useSharedValue(0);

  const frame = useFrameCallback((info) => {
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    const velocity = Math.abs(scrollY.value - last.value) / Math.max(dt, 0.001);
    last.value = scrollY.value;
    boost.value += (Math.min(MAX_BOOST, velocity * VELOCITY_GAIN) - boost.value) * Math.min(1, dt * 4);
    if (span.value > 0) offset.value = (offset.value + (BASE_SPEED + boost.value) * dt) % span.value;
  }, false);

  useEffect(() => {
    frame.setActive(!reduced && focused && copyWidth > 0);
  }, [reduced, focused, copyWidth, frame]);

  const track = useAnimatedStyle(() => ({ transform: [{ translateX: -offset.value }] }));

  return (
    <View style={styles.root} accessible accessibilityLabel={labels.join(", ")}>
      <Animated.View style={[styles.track, track]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: COPIES }, (_, copy) => (
          <View
            key={copy}
            style={styles.copy}
            onLayout={
              copy === 0
                ? (event) => {
                    span.value = event.nativeEvent.layout.width;
                    setCopyWidth(event.nativeEvent.layout.width);
                  }
                : undefined
            }
          >
            {labels.map((label) => (
              <View key={label} style={styles.item}>
                <Text variant="label" tone="gold300" maxFontSizeMultiplier={1.4}>
                  {label}
                </Text>
                <Text variant="label" tone="gold600" maxFontSizeMultiplier={1.4}>
                  ◆
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold800,
    backgroundColor: palette.ink950,
  },
  track: { flexDirection: "row" },
  copy: { flexDirection: "row" },
  item: { flexDirection: "row", alignItems: "center", gap: 22, paddingRight: 22 },
});
