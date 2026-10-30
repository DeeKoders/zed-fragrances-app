import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useAnimatedRef } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useInView } from "@/components/motion/ScrollContext";
import { FeatureIcon } from "@/components/ui/FeatureIcon";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import type { FeatureIcon as FeatureIconKey } from "@/types/product";
import { palette } from "@/theme/palette";

type Feature = { icon: FeatureIconKey; label: string };

/**
 * Four feature icons separated by thin gold rules: one row on wide screens, a 2×2 grid with
 * dividers on phones. The icons line-draw in when they scroll into view.
 */
export function FeatureStrip({ features = brand.features }: { features?: Feature[] }) {
  const { width } = useWindowDimensions();
  const ref = useAnimatedRef<View>();
  const [drawn, setDrawn] = useState(false);
  useInView(ref, () => {
    "worklet";
    scheduleOnRN(setDrawn, true);
  });
  const wide = width >= 600;
  const rows = wide ? [features] : [features.slice(0, 2), features.slice(2, 4)];

  return (
    <View ref={ref} style={styles.root}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, rowIndex > 0 && styles.rowRule]}>
          {row.map((feature, index) => (
            <View key={feature.label} style={[styles.cell, index > 0 && styles.cellRule]} accessible accessibilityLabel={feature.label}>
              <FeatureIcon icon={feature.icon} size={40} drawn={drawn} delay={(rowIndex * row.length + index) * 140} />
              <Text variant="micro" tone="gold200" align="center">
                {feature.label}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginHorizontal: 16, marginVertical: 40 },
  row: { flexDirection: "row" },
  rowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.gold700 },
  cell: { flex: 1, alignItems: "center", gap: 12, paddingVertical: 22, paddingHorizontal: 8 },
  cellRule: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: palette.gold700 },
});
