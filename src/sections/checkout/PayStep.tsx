import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState, type ComponentRef, type Ref } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { announce } from "@/lib/a11y";
import { formatPrice } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { prepareScreenshot } from "@/lib/screenshot";
import { useCheckout } from "@/stores/checkout";
import { palette } from "@/theme/palette";

const copy = brand.copy.checkout;
const wallet = brand.checkout.wallet;

type PayStepProps = {
  headingRef: Ref<ComponentRef<typeof View>>;
  total: number;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
  onBack: () => void;
  disabled: boolean;
};

/** Step 2 (wallet only): the account to pay into, the amount, and the payment screenshot. */
export function PayStep({ headingRef, total, uploadError, setUploadError, onBack, disabled }: PayStepProps) {
  const screenshot = useCheckout((state) => state.screenshot);
  const setScreenshot = useCheckout((state) => state.setScreenshot);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const pick = async () => {
    setUploadError(null);
    setDenied(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsMultipleSelection: false, exif: false });
      if (result.canceled || !result.assets[0]) return;
      setBusy(true);
      const asset = result.assets[0];
      setScreenshot(
        await prepareScreenshot({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        }),
      );
    } catch (error) {
      const permission = error instanceof Error && /permission/i.test(error.message);
      if (permission) setDenied(true);
      else setUploadError(copy.screenshot.invalid);
      haptics.warning();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel={copy.back} onPress={onBack} disabled={disabled} style={styles.back} hitSlop={8}>
        <Icon name="back" size={18} />
        <Text variant="micro" tone="gold200">
          {copy.back}
        </Text>
      </Pressable>
      <View ref={headingRef} accessible accessibilityRole="header" accessibilityLabel={copy.pay.title}>
        <Text variant="h3">{copy.pay.title}</Text>
      </View>
      <Text variant="body" tone="ivoryMuted">
        {copy.pay.intro}
      </Text>

      <View style={styles.card}>
        <View style={styles.chips}>
          {wallet.providers.map((provider) => (
            <View key={provider} style={styles.chip}>
              <Text variant="micro" tone="gold200">
                {provider}
              </Text>
            </View>
          ))}
        </View>
        <CopyRow label={copy.pay.accountNumber} display={wallet.accountNumber} value={wallet.accountNumber.replace(/\D/g, "")} large />
        <View style={styles.row} accessible accessibilityLabel={`${copy.pay.accountTitle}: ${wallet.accountTitle}`}>
          <Text variant="micro" tone="ivoryMuted">
            {copy.pay.accountTitle}
          </Text>
          <Text variant="bodyLg">{wallet.accountTitle}</Text>
        </View>
        <CopyRow label={copy.pay.amount} display={formatPrice(total)} value={String(total)} price={total} />
      </View>

      <View style={styles.upload}>
        <Text variant="micro" tone="ivoryMuted">
          {copy.screenshot.label}
        </Text>
        <Text variant="body" tone="ivoryMuted" style={styles.small}>
          {copy.screenshot.hint}
        </Text>
        {screenshot ? (
          <View style={styles.preview}>
            <Image source={{ uri: screenshot.uri }} style={styles.thumb} contentFit="cover" accessibilityLabel={copy.screenshot.preview} accessible />
            <View style={styles.previewActions}>
              <Text variant="body" numberOfLines={1} style={styles.small}>
                {screenshot.name}
              </Text>
              <View style={styles.previewButtons}>
                <Button compact variant="outline" label={copy.screenshot.replace} onPress={() => void pick()} disabled={disabled || busy} />
                <Button compact variant="ghost" label={copy.screenshot.remove} onPress={() => setScreenshot(null)} disabled={disabled} />
              </View>
            </View>
          </View>
        ) : (
          <Button variant="outline" label={copy.screenshot.choose} loading={busy} onPress={() => void pick()} icon={<Icon name="upload" size={18} />} disabled={disabled} />
        )}
        {uploadError ? (
          <Text variant="body" tone="gold200" accessibilityLiveRegion="polite">
            {uploadError}
          </Text>
        ) : null}
        {denied ? (
          <View style={styles.denied}>
            <Text variant="body" tone="gold200" accessibilityLiveRegion="polite">
              {copy.screenshot.permission}
            </Text>
            <Button compact variant="ghost" label={copy.screenshot.settings} onPress={() => void Linking.openSettings()} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CopyRow({ label, display, value, large = false, price }: { label: string; display: string; value: string; large?: boolean; price?: number }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copyValue = async () => {
    await Clipboard.setStringAsync(value);
    haptics.light();
    announce(copy.pay.copied);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View style={styles.copyRow}>
      <View style={styles.row} accessible accessibilityLabel={`${label}: ${display}`}>
        <Text variant="micro" tone="ivoryMuted">
          {label}
        </Text>
        {price !== undefined ? (
          <Price value={price} variant="h3" tone="gold200" selectable />
        ) : (
          <Text variant={large ? "h2" : "bodyLg"} tone="gold200" selectable style={styles.number}>
            {display}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${copy.pay.copy} ${label}`}
        onPress={() => void copyValue()}
        style={styles.copy}
        hitSlop={6}
      >
        <Icon name={copied ? "check" : "copy"} size={18} />
        <Text variant="micro" tone="gold200">
          {copied ? copy.pay.copied : copy.pay.copy}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  back: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start" },
  card: { gap: 16, padding: 18, borderWidth: 1, borderColor: palette.gold700, backgroundColor: palette.ink950 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold500, paddingHorizontal: 10, paddingVertical: 6 },
  row: { gap: 4, flexShrink: 1 },
  copyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  number: { fontVariant: ["tabular-nums"], letterSpacing: 1 },
  copy: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, minWidth: 44, paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold700 },
  upload: { gap: 10, marginTop: 6 },
  small: { fontSize: 13, lineHeight: 19 },
  preview: { flexDirection: "row", gap: 14, alignItems: "center" },
  thumb: { width: 84, height: 112, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold700 },
  previewActions: { flex: 1, gap: 8 },
  previewButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  denied: { gap: 4 },
});
