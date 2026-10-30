import { type ComponentRef, type Ref } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import type { PaymentMethod } from "@/lib/checkout";
import { whatsappUrl } from "@/lib/whatsapp";
import { palette } from "@/theme/palette";

const copy = brand.copy.checkout.done;

/** Step 3: the gold diamond check, the order ID (selectable) and what happens next. */
export function DoneStep({
  headingRef,
  id,
  payment,
  onClose,
}: {
  headingRef: Ref<ComponentRef<typeof View>>;
  id: string;
  payment: PaymentMethod;
  onClose: () => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.mark} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={styles.markInner}>
          <Icon name="check" size={28} color={palette.gold200} />
        </View>
      </View>
      <View ref={headingRef} accessible accessibilityRole="header" accessibilityLabel={`${copy.title}. ${copy.order} ${id}`}>
        <Text variant="h3" align="center">
          {copy.title}
        </Text>
      </View>
      <Text variant="label" tone="ivoryMuted" align="center" selectable>
        {copy.order}{" "}
        <Text variant="label" tone="gold200" selectable style={styles.id}>
          {id}
        </Text>
      </Text>
      <DiamondDivider style={styles.rule} />
      <Text variant="editorial" align="center" style={styles.message}>
        {copy[payment]}
      </Text>
      <Button label={copy.cta} onPress={onClose} style={styles.cta} />
      <Button
        variant="ghost"
        label={copy.help}
        icon={<Icon name="whatsapp" size={16} />}
        onPress={() => void Linking.openURL(whatsappUrl(`${brand.copy.whatsapp.question} ${id}`))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: 14, paddingVertical: 32 },
  mark: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: palette.gold400,
    backgroundColor: palette.ink950,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  markInner: { transform: [{ rotate: "-45deg" }] },
  id: { fontVariant: ["tabular-nums"] },
  rule: { width: 160, marginVertical: 6 },
  message: { maxWidth: 360 },
  cta: { alignSelf: "stretch", marginTop: 18 },
});
