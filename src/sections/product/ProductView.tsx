import { Image } from "expo-image";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { Bottle, bottleAlt } from "@/components/product/Bottle";
import { FloatingBottle } from "@/components/product/FloatingBottle";
import { NotesPyramid } from "@/components/product/NotesPyramid";
import { VibeMeters } from "@/components/product/VibeMeters";
import { WorldBackdrop } from "@/components/product/WorldBackdrop";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Icon } from "@/components/ui/Icon";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { useAddToBag } from "@/hooks/useAddToBag";
import { useTilt } from "@/hooks/useTilt";
import { sizesOf } from "@/lib/catalogue";
import { FeatureStrip } from "@/sections/home/FeatureStrip";
import { useCart } from "@/stores/cart";
import { useCatalogue } from "@/stores/catalogue";
import { useReducedMotion } from "@/stores/motion";
import { ease } from "@/theme/motion";
import { palette, scrim } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import { useTheme } from "@/theme/ThemeProvider";
import type { Product } from "@/types/product";
import { Lightbox } from "./Lightbox";
import { SizeSelector } from "./SizeSelector";

const copy = brand.copy;

/**
 * A product's screen: a full themed takeover while focused (the previous theme returns on leaving),
 * opened with a theme-coloured ink wipe. Hero, gallery with lightbox, details, "Pairs well with",
 * and a sticky bar with the price, Add to bag and Buy now.
 */
export function ProductView({ product }: { product: Product }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const { takeover } = useTheme();
  const tilt = useTilt();
  const { tokens } = getTheme(product.slug);
  const catalogue = useCatalogue((state) => state.catalogue);
  const items = useCart((state) => state.items);
  const { addSize } = useAddToBag();
  const sizes = sizesOf(product, catalogue);
  const [ml, setMl] = useState<number | null>(() => (sizes.find((size) => size.inStock) ?? sizes[0])?.ml ?? null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const size = sizes.find((entry) => entry.ml === ml);
  const canBuy = Boolean(size?.inStock);

  // Keep a valid selection when live stock changes.
  useEffect(() => {
    if (size?.inStock) return;
    const next = sizes.find((entry) => entry.inStock);
    if (next && next.ml !== ml) setMl(next.ml);
  }, [sizes, size, ml]);

  useFocusEffect(
    useCallback(() => {
      takeover(product.slug);
      return () => takeover(null);
    }, [takeover, product.slug]),
  );

  // The world's clock runs while this screen is focused.
  const time = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    time.value += Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
  }, false);
  useEffect(() => {
    frame.setActive(focused && !reduced);
  }, [focused, reduced, frame]);

  // The theme-coloured ink wipe that opens the screen.
  const wipe = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) wipe.value = withTiming(1, { duration: 720, easing: ease.silk });
  }, [reduced, wipe]);
  const wipeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -wipe.value * (height + 40) }] }));

  const share = () =>
    void Share.share({
      message: `${product.name} · ${copy.inspiredBy} ${product.inspiredBy}\n${product.tagline}\n${brand.siteUrl}`,
    }).catch(() => undefined);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const buyNow = () => {
    if (!size) return;
    if (!items.some((item) => item.slug === product.slug && item.ml === size.ml)) addSize(product, size.ml, { toast: false });
    router.push("/checkout");
  };

  const pairs = useMemo(() => products.filter((other) => other.slug !== product.slug), [product.slug]);
  const heroHeight = Math.max(560, height * 0.82);
  const gallery = product.images.gallery;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ height: heroHeight }}>
          <WorldBackdrop product={product} width={width} height={heroHeight} time={time} />
          <View style={[styles.heroContent, { paddingTop: insets.top + 64 }]}>
            <FloatingBottle product={product} height={Math.min(heroHeight * 0.48, 400)} tiltX={tilt.x} tiltY={tilt.y} />
            <View style={styles.heroCopy}>
              <Text variant="micro" style={{ color: tokens.accentInk }} align="center">
                {copy.inspiredBy} {product.inspiredBy}
              </Text>
              <Text variant="display" align="center" accessibilityRole="header">
                {product.name}
              </Text>
              <Text variant="editorial" tone="gold200" align="center">
                {product.tagline}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Reveal>
            <Text variant="bodyLg">{product.story}</Text>
          </Reveal>
          <DiamondDivider />
        </View>

        {gallery.length > 0 ? (
          <View style={styles.gallery}>
            <Text variant="micro" tone="gold300" style={styles.sectionLabel} accessibilityRole="header">
              {copy.product.gallery}
            </Text>
            <FlatList
              data={gallery}
              horizontal
              pagingEnabled={false}
              snapToInterval={width * 0.78 + 12}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => `${index}`}
              contentContainerStyle={styles.galleryRow}
              renderItem={({ item, index }) => (
                <Pressable
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${copy.product.openImage}: ${product.images.alt?.hero ?? product.name} ${index + 1}`}
                  onPress={() => setLightbox(index)}
                >
                  <Image source={item} contentFit="cover" style={{ width: width * 0.78, height: width * 0.78 * 1.3 }} transition={200} />
                </Pressable>
              )}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <RevealText text={copy.product.details} variant="h2" />
          <SizeSelector sizes={sizes} value={ml} onChange={setMl} />
          <NotesPyramid product={product} />
          <VibeMeters product={product} />
        </View>

        <FeatureStrip features={product.features} />

        {pairs.length > 0 ? (
          <View style={styles.pairs}>
            <Text variant="micro" tone="gold300" style={styles.sectionLabel} accessibilityRole="header">
              {copy.product.pairs}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pairRow}>
              {pairs.map((other) => (
                <Pressable
                  key={other.slug}
                  accessibilityRole="link"
                  accessibilityLabel={`${other.name}. ${copy.inspiredBy} ${other.inspiredBy}`}
                  onPress={() => router.push(`/fragrances/${other.slug}`)}
                  style={[styles.pair, { borderColor: getTheme(other.slug).tokens.accentBorder }]}
                >
                  <Bottle product={other} height={150} decorative />
                  <Text variant="h3">{other.name}</Text>
                  <Text variant="editorial" tone="ivoryMuted" numberOfLines={1}>
                    {other.tagline}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.header, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel={copy.product.back} onPress={back} style={styles.headerButton} hitSlop={6}>
          <Icon name="back" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.product.share} onPress={share} style={styles.headerButton} hitSlop={6}>
          <Icon name="share" />
        </Pressable>
      </View>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.barPrice}>
          {size && size.inStock ? (
            <Price value={size.price} variant="h3" tone="gold200" numberOfLines={1} adjustsFontSizeToFit />
          ) : (
            <Text variant="label" tone="ivoryMuted">
              {copy.cart.outOfStock}
            </Text>
          )}
          {size ? <Text variant="micro" tone="ivoryMuted">{`${size.ml}ml`}</Text> : null}
        </View>
        <Button
          compact
          variant="outline"
          label={copy.cart.addToBag}
          disabled={!canBuy}
          accessibilityLabel={`${copy.cart.addToBag}: ${product.name}${size ? ` ${size.ml}ml` : ""}`}
          onPress={() => size && addSize(product, size.ml)}
          style={styles.barButton}
        />
        <Button compact variant="accent" label={copy.cart.buyNow} disabled={!canBuy} onPress={buyNow} style={styles.barButton} />
      </View>

      <Lightbox images={gallery} index={lightbox} label={product.images.alt?.hero ?? bottleAlt(product)} onClose={() => setLightbox(null)} />

      {reduced ? null : (
        <Animated.View
          pointerEvents="none"
          style={[styles.wipe, { backgroundColor: tokens.accentAlt }, wipeStyle]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <View style={[styles.wipeEdge, { backgroundColor: tokens.accent }]} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink950 },
  heroContent: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 28 },
  heroCopy: { gap: 8, alignItems: "center" },
  section: { paddingHorizontal: 20, paddingVertical: 32, gap: 24 },
  sectionLabel: { paddingHorizontal: 20, marginBottom: 12 },
  gallery: { paddingVertical: 8 },
  galleryRow: { paddingHorizontal: 20, gap: 12 },
  pairs: { paddingVertical: 24 },
  pairRow: { paddingHorizontal: 20, gap: 12 },
  pair: { width: 200, padding: 16, gap: 8, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, backgroundColor: palette.ink900 },
  header: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: scrim.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold700,
  },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: scrim.heavy,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.gold700,
  },
  barPrice: { flex: 1, minWidth: 0 },
  barButton: { flexShrink: 1 },
  wipe: { ...StyleSheet.absoluteFill, justifyContent: "flex-end" },
  wipeEdge: { height: 3 },
});
