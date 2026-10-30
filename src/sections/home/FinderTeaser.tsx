import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Text, ThemedText } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { scrim } from "@/theme/palette";
import { useThemeColor } from "@/theme/ThemeProvider";

const copy = brand.copy.finder;

/** A themed card that opens the Scent Finder tab. */
export function FinderTeaser() {
  const border = useThemeColor("accentBorder");
  const glow = useThemeColor("accentGlow");
  const card = useAnimatedStyle(() => ({ borderColor: border.value, shadowColor: glow.value }));
  return (
    <View style={styles.section}>
      <Reveal>
        <Animated.View style={[styles.card, card]}>
          <ThemedText variant="micro" token="accentInk">
            {copy.eyebrow}
          </ThemedText>
          <RevealText text={copy.title} variant="h2" align="left" />
          <Text variant="editorial" tone="ivoryMuted">
            {copy.intro}
          </Text>
          <DiamondDivider style={styles.divider} />
          <Button variant="accent" label={copy.teaser} onPress={() => router.navigate("/finder")} />
        </Animated.View>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingVertical: 56 },
  card: {
    gap: 14,
    padding: 24,
    borderWidth: 1,
    backgroundColor: scrim.glass,
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  divider: { marginVertical: 6 },
});
