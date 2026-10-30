import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { buildOrder, orderTotals } from "@/lib/checkout";
import { BagLine } from "@/sections/bag/BagLine";
import { Totals } from "@/sections/bag/Totals";
import { selectCount, useCart } from "@/stores/cart";
import { useCatalogue } from "@/stores/catalogue";
import { palette } from "@/theme/palette";

const copy = brand.copy.cart;

/**
 * The bag: lines with steppers and swipe-to-remove, live totals (prices, stock and the delivery fee
 * follow the latest catalogue) and the way into checkout.
 */
export default function BagScreen() {
  const insets = useSafeAreaInsets();
  const items = useCart((state) => state.items);
  const count = useCart(selectCount);
  const catalogue = useCatalogue((state) => state.catalogue);
  const order = useMemo(() => buildOrder(items, catalogue), [items, catalogue]);
  const totals = orderTotals(order, "wallet", catalogue);
  const soldOut = order.lines.some((line) => !line.inStock);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="h2" accessibilityRole="header">
            {copy.title}
          </Text>
          {count > 0 ? <Text variant="micro" tone="ivoryMuted">{`${count} ${copy.items}`}</Text> : null}
        </View>

        {order.lines.length === 0 ? (
          <View style={styles.empty}>
            <DiamondDivider style={styles.emptyRule} />
            <Text variant="editorial" tone="ivoryMuted" align="center">
              {copy.empty}
            </Text>
            <Button label={copy.emptyCta} onPress={() => router.navigate("/collection")} />
          </View>
        ) : (
          <>
            <View style={styles.lines}>
              {order.lines.map((line) => (
                <BagLine key={`${line.product.slug}-${line.ml}`} line={line} />
              ))}
            </View>
            <View style={styles.summary}>
              <Totals totals={totals} onRequest={order.hasPriceOnRequest} />
              {soldOut ? (
                <Text variant="body" tone="gold200" accessibilityLiveRegion="polite">
                  {brand.copy.checkout.soldOut}
                </Text>
              ) : null}
              <Button label={copy.checkout} disabled={soldOut} onPress={() => router.push("/checkout")} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink950 },
  content: { paddingBottom: 48, flexGrow: 1 },
  header: { paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  lines: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  summary: { paddingHorizontal: 16, paddingTop: 20, gap: 18, borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  empty: { flex: 1, justifyContent: "center", gap: 24, paddingHorizontal: 24, paddingBottom: 64 },
  emptyRule: { marginHorizontal: 48 },
});
