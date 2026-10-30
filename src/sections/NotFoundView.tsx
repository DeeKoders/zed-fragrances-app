import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Atmosphere } from "@/components/shaders/Atmosphere";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Logo } from "@/components/ui/Logo";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { palette } from "@/theme/palette";

const copy = brand.copy.notFound;

/** Unknown routes and unknown product slugs, with a way home. */
export function NotFoundView() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <Atmosphere />
      <Logo kind="wordmark" width={200} />
      <DiamondDivider style={styles.rule} />
      <Text variant="h2" align="center" accessibilityRole="header">
        {copy.title}
      </Text>
      <Text variant="editorial" tone="ivoryMuted" align="center">
        {copy.text}
      </Text>
      <Button label={copy.cta} onPress={() => router.replace("/")} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, paddingHorizontal: 24, backgroundColor: palette.ink950 },
  rule: { width: 160 },
  cta: { alignSelf: "stretch", marginTop: 12 },
});
