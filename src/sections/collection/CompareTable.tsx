import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { formatPrice } from "@/lib/format";
import { sizesOf } from "@/lib/catalogue";
import { useCatalogue } from "@/stores/catalogue";
import { palette } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import type { Product } from "@/types/product";

const copy = brand.copy;
const COLUMN = 168;
const LABEL = 116;

/** Side-by-side comparison of up to three products; scrolls sideways on narrow screens. */
export function CompareTable({ products }: { products: Product[] }) {
  const catalogue = useCatalogue((state) => state.catalogue);
  const rows: { label: string; value: (product: Product) => string }[] = [
    { label: copy.collection.inspiredBy, value: (p) => p.inspiredBy },
    { label: copy.collection.concentration, value: (p) => p.concentration },
    {
      label: copy.collection.sizes,
      value: (p) =>
        sizesOf(p, catalogue)
          .map((size) => `${size.ml}ml · ${size.inStock ? formatPrice(size.price) : copy.cart.outOfStock}`)
          .join("\n"),
    },
    { label: copy.worlds.notes.top, value: (p) => p.notes.top.join(", ") },
    { label: copy.worlds.notes.heart, value: (p) => p.notes.heart.join(", ") },
    { label: copy.worlds.notes.base, value: (p) => p.notes.base.join(", ") },
    { label: copy.worlds.vibe.longevity, value: (p) => `${"◆".repeat(p.vibe.longevity)}${"◇".repeat(5 - p.vibe.longevity)}` },
    { label: copy.worlds.vibe.projection, value: (p) => `${"◆".repeat(p.vibe.projection)}${"◇".repeat(5 - p.vibe.projection)}` },
    { label: copy.worlds.vibe.seasons, value: (p) => p.vibe.seasons.join(", ") },
    { label: copy.worlds.vibe.occasions, value: (p) => p.vibe.occasions.join(", ") },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.table}>
        <View style={styles.row}>
          <View style={[styles.cell, styles.labelCell]} />
          {products.map((product) => (
            <View key={product.slug} style={[styles.cell, styles.head]}>
              <Text variant="h3" accessibilityRole="header" style={{ color: getTheme(product.slug).tokens.accentInk }}>
                {product.name}
              </Text>
            </View>
          ))}
        </View>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text variant="micro" tone="ivoryMuted">
                {row.label}
              </Text>
            </View>
            {products.map((product) => (
              <View key={product.slug} style={styles.cell} accessible accessibilityLabel={`${product.name}, ${row.label}: ${row.value(product)}`}>
                <Text variant="body" style={styles.value}>
                  {row.value(product)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  table: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.gold800 },
  row: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  cell: { width: COLUMN, paddingVertical: 12, paddingHorizontal: 10 },
  labelCell: { width: LABEL, paddingLeft: 0 },
  head: { paddingTop: 16 },
  value: { fontSize: 14, lineHeight: 21 },
});
