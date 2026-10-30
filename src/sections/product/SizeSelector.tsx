import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { formatPrice } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { palette } from "@/theme/palette";
import type { ProductSize } from "@/types/product";

const copy = brand.copy;

/** Size chips; sold-out sizes are disabled. */
export function SizeSelector({ sizes, value, onChange }: { sizes: ProductSize[]; value: number | null; onChange: (ml: number) => void }) {
  return (
    <View style={styles.root} accessibilityRole="radiogroup" accessibilityLabel={copy.product.size}>
      <Text variant="micro" tone="ivoryMuted">
        {copy.product.size}
      </Text>
      <View style={styles.row}>
        {sizes.map((size) => {
          const selected = size.ml === value;
          return (
            <Pressable
              key={size.ml}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: !size.inStock }}
              accessibilityLabel={`${size.ml}ml, ${size.inStock ? formatPrice(size.price) : copy.cart.outOfStock}`}
              disabled={!size.inStock}
              onPress={() => {
                haptics.selection();
                onChange(size.ml);
              }}
              style={[styles.chip, selected && styles.selected, !size.inStock && styles.soldOut]}
            >
              <Text variant="label" tone={selected ? "ink950" : "ivory"}>{`${size.ml}ml`}</Text>
              {!size.inStock ? (
                <Text variant="micro" tone="ivoryMuted" style={styles.small}>
                  {copy.cart.outOfStock}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    minWidth: 76,
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.gold600,
  },
  selected: { backgroundColor: palette.gold300, borderColor: palette.gold300 },
  soldOut: { opacity: 0.45, borderStyle: "dashed" },
  small: { fontSize: 9 },
});
