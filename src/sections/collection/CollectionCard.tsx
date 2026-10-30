import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Bottle } from "@/components/product/Bottle";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { fromPrice } from "@/lib/format";
import { sizesOf } from "@/lib/catalogue";
import { useCatalogue } from "@/stores/catalogue";
import { useReducedMotion } from "@/stores/motion";
import { spring } from "@/theme/motion";
import { alpha, palette } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import type { Product } from "@/types/product";

type CollectionCardProps = {
  product: Product;
  width: number;
  comparing: boolean;
  selected: boolean;
  /** Pressing in adopts the product's theme. */
  onPressIn: (product: Product) => void;
  onPress: (product: Product) => void;
};

/**
 * A product card: bottle, name, "Inspired by …" and the from-price. Press-in adopts its theme,
 * tilts the bottle and reveals the notes. In compare mode a tap selects it instead of opening it.
 */
export function CollectionCard({ product, width, comparing, selected, onPressIn, onPress }: CollectionCardProps) {
  const reduced = useReducedMotion();
  const catalogue = useCatalogue((state) => state.catalogue);
  const sizes = sizesOf(product, catalogue);
  const soldOut = !sizes.some((size) => size.inStock);
  const { tokens } = getTheme(product.slug);
  const press = useSharedValue(0);

  const bottle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateZ: `${press.value * -6}deg` }, { rotateY: `${press.value * 14}deg` }, { scale: 1 + press.value * 0.04 }],
  }));
  const notes = useAnimatedStyle(() => ({ opacity: press.value, transform: [{ translateY: (1 - press.value) * 8 }] }));
  const card = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.02 }] }));

  const notesLine = [...product.notes.top, ...product.notes.heart, ...product.notes.base].join(" · ");
  const label = `${product.name}. ${brand.copy.collection.inspiredBy} ${product.inspiredBy}. ${soldOut ? brand.copy.cart.outOfStock : ""}`;

  return (
    <Pressable
      accessibilityRole={comparing ? "checkbox" : "button"}
      accessibilityState={comparing ? { checked: selected } : undefined}
      accessibilityLabel={label}
      accessibilityHint={comparing ? brand.copy.collection.select : undefined}
      onPressIn={() => {
        onPressIn(product);
        press.value = reduced ? 1 : withSpring(1, spring.snap);
      }}
      onPressOut={() => {
        press.value = reduced ? 0 : withTiming(0, { duration: 420 });
      }}
      onPress={() => onPress(product)}
      style={{ width }}
    >
      <Animated.View style={[styles.card, { borderColor: selected ? tokens.accentBorder : palette.line }, card]}>
        <View style={[styles.stage, { backgroundColor: alpha(tokens.accentAlt, 0.55) }]}>
          <View style={[styles.glow, { backgroundColor: alpha(tokens.accentGlow, 0.18) }]} />
          <Animated.View style={bottle}>
            <Bottle product={product} height={width * 1.1} decorative />
          </Animated.View>
          <Animated.View style={[styles.notes, notes]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text variant="micro" tone="gold100" numberOfLines={3} align="center" maxFontSizeMultiplier={1.3}>
              {notesLine}
            </Text>
          </Animated.View>
          {comparing ? (
            <View style={[styles.check, selected && { backgroundColor: palette.gold300 }]}>
              {selected ? <Text variant="micro" tone="ink950">✓</Text> : null}
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
            {product.name}
          </Text>
          <Text variant="micro" style={{ color: tokens.accentInk }} numberOfLines={2}>
            {brand.copy.collection.inspiredBy} {product.inspiredBy}
          </Text>
          {soldOut ? (
            <Text variant="label" tone="ivoryMuted">
              {brand.copy.cart.outOfStock}
            </Text>
          ) : (
            <Price value={fromPrice(sizes)} variant="label" tone="gold200" />
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, backgroundColor: palette.ink900 },
  stage: { alignItems: "center", justifyContent: "center", paddingVertical: 16, overflow: "hidden" },
  glow: { position: "absolute", width: "90%", aspectRatio: 1, borderRadius: 999 },
  notes: { position: "absolute", left: 8, right: 8, bottom: 10, padding: 6, backgroundColor: alpha(palette.ink950, 0.7) },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: palette.gold300,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { padding: 12, gap: 4 },
});
