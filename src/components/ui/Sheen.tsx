import { StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { palette } from "@/theme/palette";

/** A gold sheen that sweeps across its parent as `progress` runs 0 → 1. Decorative. */
export function Sheen({ progress, width }: { progress: SharedValue<number>; width: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const band = Math.max(60, width.value * 0.55);
    return {
      width: band,
      opacity: progress.value > 0 && progress.value < 1 ? 1 : 0,
      transform: [{ translateX: interpolate(progress.value, [0, 1], [-band, width.value + band]) }, { skewX: "-20deg" }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.band, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.gold100} stopOpacity={0} />
            <Stop offset="0.5" stopColor={palette.gold100} stopOpacity={0.55} />
            <Stop offset="1" stopColor={palette.gold100} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="10" height="10" fill="url(#sheen)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: { position: "absolute", top: -4, bottom: -4, left: 0 },
});
