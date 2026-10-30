import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { Text, ThemedText } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import type { Product } from "@/types/product";

const copy = brand.copy.worlds.notes;
const TIERS = ["top", "heart", "base"] as const;

/**
 * Top → heart → base. With `progress` (0..1) the tiers reveal in order; without it they show at once.
 */
export function NotesPyramid({ product, progress }: { product: Product; progress?: SharedValue<number> }) {
  return (
    <View style={styles.root}>
      <Text variant="micro" tone="gold300" accessibilityRole="header">
        {copy.title}
      </Text>
      {TIERS.map((tier, index) => (
        <Tier key={tier} index={index} label={copy[tier]} notes={product.notes[tier]} progress={progress} />
      ))}
    </View>
  );
}

function Tier({ index, label, notes, progress }: { index: number; label: string; notes: string[]; progress?: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    if (!progress) return {};
    const local = interpolate(progress.value, [index * 0.22, index * 0.22 + 0.4], [0, 1], "clamp");
    return { opacity: local, transform: [{ translateY: (1 - local) * 14 }] };
  });
  return (
    <Animated.View style={[styles.tier, { marginHorizontal: index * 10 }, style]} accessible accessibilityLabel={`${label}: ${notes.join(", ")}`}>
      <ThemedText variant="micro" token="accentInk" style={styles.tierLabel}>
        {label}
      </ThemedText>
      <Text variant="body" style={styles.notes}>
        {notes.join(" · ")}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  tier: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: brand.palette.line, paddingTop: 10, gap: 2 },
  tierLabel: {},
  notes: { flexShrink: 1 },
});
