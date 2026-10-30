import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { BackHandler, FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RevealText } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Text, ThemedText } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { announce } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { CollectionCard } from "@/sections/collection/CollectionCard";
import { CompareTable } from "@/sections/collection/CompareTable";
import { useReducedMotion } from "@/stores/motion";
import { palette } from "@/theme/palette";
import { useTheme } from "@/theme/ThemeProvider";
import type { Product } from "@/types/product";

const copy = brand.copy.collection;
const MAX_COMPARE = 3;
const GAP = 12;
const SIDE = 16;

/**
 * The collection: a two-column grid that scales to any number of products, and a compare mode
 * (up to three, side by side). Android back leaves compare mode before the tab.
 */
export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const { setTheme } = useTheme();
  const [comparing, setComparing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const columns = width >= 700 ? 3 : 2;
  const cardWidth = (width - SIDE * 2 - GAP * (columns - 1)) / columns;

  const stopComparing = useCallback(() => {
    setComparing(false);
    setSelected([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!comparing) return false;
        stopComparing();
        return true;
      });
      return () => subscription.remove();
    }, [comparing, stopComparing]),
  );

  const onPress = (product: Product) => {
    if (!comparing) {
      router.push(`/fragrances/${product.slug}`);
      return;
    }
    haptics.selection();
    setSelected((current) => {
      if (current.includes(product.slug)) return current.filter((slug) => slug !== product.slug);
      if (current.length >= MAX_COMPARE) {
        announce(copy.compareHint);
        return current;
      }
      return [...current, product.slug];
    });
  };

  const chosen = products.filter((product) => selected.includes(product.slug));

  return (
    <View style={styles.root}>
      <FlatList
        data={products}
        key={columns}
        numColumns={columns}
        keyExtractor={(product) => product.slug}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText variant="micro">{copy.eyebrow}</ThemedText>
            <RevealText text={copy.title} variant="h2" />
            <View style={styles.controls}>
              {comparing ? (
                <>
                  <Button compact variant="outline" label={copy.clear} onPress={() => setSelected([])} disabled={selected.length === 0} />
                  <Button compact variant="gold" label={copy.compareDone} onPress={stopComparing} />
                </>
              ) : (
                <Button compact variant="outline" label={copy.compare} onPress={() => setComparing(true)} />
              )}
            </View>
            {comparing ? (
              <Animated.View entering={reduced ? undefined : FadeIn} exiting={reduced ? undefined : FadeOut}>
                <Text variant="body" tone="ivoryMuted" accessibilityLiveRegion="polite">
                  {`${copy.compareHint} (${selected.length}/${MAX_COMPARE})`}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <CollectionCard
            product={item}
            width={cardWidth}
            comparing={comparing}
            selected={selected.includes(item.slug)}
            onPressIn={(product) => setTheme(product.slug)}
            onPress={onPress}
          />
        )}
        ListFooterComponent={
          comparing && chosen.length > 0 ? (
            <Animated.View entering={reduced ? undefined : FadeIn} style={styles.compare}>
              <CompareTable products={chosen} />
            </Animated.View>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink950 },
  content: { paddingHorizontal: SIDE, paddingBottom: 48, gap: GAP },
  columns: { gap: GAP },
  header: { gap: 14, marginBottom: 12 },
  controls: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  compare: { marginTop: 24, marginHorizontal: -SIDE },
});
