import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { getTheme } from "@/theme/registry";
import type { Product } from "@/types/product";

/** Reference, name, tagline and the "Discover" call to action for one product, in its own colours. */
export function WorldCopy({ product, align = "left" }: { product: Product; align?: "left" | "right" | "center" }) {
  const { tokens } = getTheme(product.slug);
  const textAlign = align;
  return (
    <View style={[styles.root, align === "right" && styles.right, align === "center" && styles.center]}>
      <Text variant="micro" style={{ color: tokens.accentInk, textAlign }} numberOfLines={2}>
        {brand.copy.inspiredBy} {product.inspiredBy}
      </Text>
      <Text variant="h3" style={[styles.name, { textAlign }]} accessibilityRole="header">
        {product.name}
      </Text>
      <Text variant="editorial" tone="ivoryMuted" style={{ textAlign }}>
        {product.tagline}
      </Text>
      <Button
        compact
        variant="outline"
        label={brand.copy.hero.cta}
        accessibilityLabel={`${brand.copy.hero.cta} ${product.name}`}
        onPress={() => router.push(`/fragrances/${product.slug}`)}
        icon={<View style={styles.diamond} />}
        colors={{ border: tokens.accentBorder }}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6, alignItems: "flex-start" },
  right: { alignItems: "flex-end" },
  center: { alignItems: "center" },
  name: { marginTop: 2 },
  cta: { marginTop: 10 },
  diamond: { width: 6, height: 6, transform: [{ rotate: "45deg" }], backgroundColor: brand.palette.gold["300"] },
});
