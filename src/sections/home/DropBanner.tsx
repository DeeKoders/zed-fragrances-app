import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { palette, scrim } from "@/theme/palette";

const { dropBanner } = brand;
const copy = brand.copy.drop;

function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
}

/** "First Batch Ready": entirely driven by brand.dropBanner; hidden when disabled. */
export function DropBanner() {
  const target = dropBanner.countdownTo ? Date.parse(dropBanner.countdownTo) : NaN;
  const counting = Number.isFinite(target);
  const now = useNow(counting);
  if (!dropBanner.enabled) return null;

  const left = counting ? Math.max(0, target - now) : 0;
  const units = [
    { label: copy.units.days, value: Math.floor(left / 86_400_000) },
    { label: copy.units.hours, value: Math.floor(left / 3_600_000) % 24 },
    { label: copy.units.minutes, value: Math.floor(left / 60_000) % 60 },
    { label: copy.units.seconds, value: Math.floor(left / 1000) % 60 },
  ];
  const stock = dropBanner.stock;

  return (
    <View style={styles.root}>
      {dropBanner.image ? (
        <Image source={dropBanner.image.source} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: scrim.heavy }]} />
      <Reveal style={styles.content}>
        <RevealText text={dropBanner.eyebrow} variant="h1" tone="gold200" align="center" />
        <Text variant="editorial" tone="ivory" align="center">
          {dropBanner.text}
        </Text>
        {stock ? (
          <View style={styles.stock} accessible accessibilityLabel={`${stock.remaining} ${copy.stock}`}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(100, (stock.remaining / Math.max(1, stock.total)) * 100)}%` }]} />
            </View>
            <Text variant="micro" tone="gold200">{`${stock.remaining} ${copy.stock}`}</Text>
          </View>
        ) : null}
        {counting ? (
          <View style={styles.countdown} accessible accessibilityLabel={`${copy.endsIn} ${units.map((u) => `${u.value} ${u.label}`).join(", ")}`}>
            <Text variant="micro" tone="ivoryMuted" align="center">
              {copy.endsIn}
            </Text>
            <View style={styles.units}>
              {units.map((unit) => (
                <View key={unit.label} style={styles.unit}>
                  <Text variant="h2" tone="gold200" style={styles.digits}>
                    {String(unit.value).padStart(2, "0")}
                  </Text>
                  <Text variant="micro" tone="ivoryMuted">
                    {unit.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <Button label={copy.cta} onPress={() => router.navigate("/collection")} style={styles.cta} />
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden", minHeight: 480, justifyContent: "center", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.gold800 },
  content: { paddingHorizontal: 24, paddingVertical: 72, gap: 18, alignItems: "center" },
  stock: { width: "100%", maxWidth: 320, gap: 8, alignItems: "center" },
  track: { width: "100%", height: 3, backgroundColor: palette.line },
  fill: { height: 3, backgroundColor: palette.gold300 },
  countdown: { gap: 10 },
  units: { flexDirection: "row", gap: 18 },
  unit: { alignItems: "center", minWidth: 52 },
  digits: { fontVariant: ["tabular-nums"] },
  cta: { alignSelf: "stretch", marginTop: 8 },
});
