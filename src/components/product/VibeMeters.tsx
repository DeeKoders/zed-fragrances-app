import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { palette } from "@/theme/palette";
import { useThemeColor } from "@/theme/ThemeProvider";
import type { Product } from "@/types/product";

const copy = brand.copy.worlds.vibe;
const SEGMENTS = 5;

/** Longevity and projection meters (filling with `progress` when given), plus seasons and occasions. */
export function VibeMeters({ product, progress, tags = true }: { product: Product; progress?: SharedValue<number>; tags?: boolean }) {
  return (
    <View style={styles.root}>
      <Meter label={copy.longevity} level={product.vibe.longevity} progress={progress} offset={0} />
      <Meter label={copy.projection} level={product.vibe.projection} progress={progress} offset={0.15} />
      {tags ? (
        <>
          <Tags label={copy.seasons} values={product.vibe.seasons} />
          <Tags label={copy.occasions} values={product.vibe.occasions} />
        </>
      ) : null}
    </View>
  );
}

function Meter({ label, level, progress, offset }: { label: string; level: number; progress?: SharedValue<number>; offset: number }) {
  return (
    <View
      style={styles.meter}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: SEGMENTS, now: level, text: `${level} / ${SEGMENTS}` }}
    >
      <Text variant="micro" tone="ivoryMuted" style={styles.meterLabel}>
        {label}
      </Text>
      <View style={styles.segments}>
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <Segment key={index} index={index} on={index < level} progress={progress} offset={offset} />
        ))}
      </View>
    </View>
  );
}

function Segment({ index, on, progress, offset }: { index: number; on: boolean; progress?: SharedValue<number>; offset: number }) {
  const accent = useThemeColor("accent400");
  const fill = useAnimatedStyle(() => {
    const local = progress ? interpolate(progress.value, [offset + index * 0.1, offset + index * 0.1 + 0.3], [0, 1], "clamp") : 1;
    return { backgroundColor: accent.value, transform: [{ scaleX: on ? local : 0 }] };
  });
  return (
    <View style={styles.segment}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fill, fill]} />
    </View>
  );
}

function Tags({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={styles.tags} accessible accessibilityLabel={`${label}: ${values.join(", ")}`}>
      <Text variant="micro" tone="ivoryMuted">
        {label}
      </Text>
      <View style={styles.tagRow}>
        {values.map((value) => (
          <View key={value} style={styles.tag}>
            <Text variant="micro" tone="gold200">
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  meter: { gap: 8 },
  meterLabel: {},
  segments: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 4, backgroundColor: palette.line, overflow: "hidden" },
  fill: { transformOrigin: "left" },
  tags: { gap: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold700, paddingHorizontal: 10, paddingVertical: 6 },
});
