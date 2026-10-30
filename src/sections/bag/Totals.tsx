import { StyleSheet, View } from "react-native";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import type { OrderTotals } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { palette } from "@/theme/palette";

const copy = brand.copy;

/** Subtotal, delivery, the COD charge when it applies, and the total; plus the on-request note. */
export function Totals({ totals, onRequest, showCod = false }: { totals: OrderTotals; onRequest: boolean; showCod?: boolean }) {
  return (
    <View style={styles.root}>
      <Row label={copy.cart.subtotal} value={totals.subtotal} />
      <Row label={copy.cart.delivery} value={totals.delivery} />
      {showCod && totals.codFee > 0 ? <Row label={copy.checkout.codFee} value={totals.codFee} /> : null}
      <View style={styles.rule} />
      <Row label={copy.cart.total} value={totals.total} strong />
      {onRequest ? (
        <Text variant="body" tone="ivoryMuted" style={styles.note}>
          {copy.cart.onRequestNote}
        </Text>
      ) : null}
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${formatPrice(value)}`}>
      <Text variant={strong ? "label" : "micro"} tone={strong ? "ivory" : "ivoryMuted"}>
        {label}
      </Text>
      <Price value={value} variant={strong ? "h3" : "body"} tone={strong ? "gold200" : "ivory"} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: palette.gold700, marginVertical: 4 },
  note: { fontSize: 13, lineHeight: 20 },
});
