import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { formatPrice } from "@/lib/format";
import type { PaymentMethod } from "@/lib/checkout";
import { haptics } from "@/lib/haptics";
import { palette } from "@/theme/palette";
import { useThemeColor } from "@/theme/ThemeProvider";

const copy = brand.copy.checkout;

/** A payment radio card: label, hint and its extra fee ("+ Rs 50" for COD). */
export function PaymentOption({
  method,
  selected,
  disabled,
  fee,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  disabled: boolean;
  fee: number;
  onSelect: (method: PaymentMethod) => void;
}) {
  const border = useThemeColor("accentBorder");
  const style = useAnimatedStyle(() => ({ borderColor: selected ? border.value : palette.line }));
  const { label, hint } = copy[method];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${label}. ${hint}${fee > 0 ? `. + ${formatPrice(fee)}` : ""}`}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onSelect(method);
      }}
    >
      <Animated.View style={[styles.card, disabled && styles.disabled, style]}>
        <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
        <View style={styles.text}>
          <Text variant="label">{label}</Text>
          <Text variant="body" tone="ivoryMuted" style={styles.hint}>
            {hint}
          </Text>
        </View>
        {fee > 0 ? <Text variant="label" tone="gold200">{`+ ${formatPrice(fee)}`}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1, backgroundColor: palette.ink950, minHeight: 72 },
  disabled: { opacity: 0.45 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: palette.gold400, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: palette.gold200 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.gold200 },
  text: { flex: 1, gap: 2 },
  hint: { fontSize: 14, lineHeight: 20 },
});
