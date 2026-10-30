import { Image } from "expo-image";
import { type StyleProp, type ViewStyle, View } from "react-native";
import { brand } from "@/config/brand";
import type { Product } from "@/types/product";

export function bottleAlt(product: Product) {
  const size = product.sizes[0];
  return (
    product.images.alt?.bottle ??
    `${product.name} by ${brand.name}, ${product.concentration}${size ? ` ${size.ml}ml` : ""} bottle`
  );
}

/** Transparent bottle cutout in a 9:20 frame; any cutout aspect fits via contain. */
export function Bottle({
  product,
  height,
  decorative = false,
  style,
}: {
  product: Product;
  height: number;
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ height, width: (height * 9) / 20 }, style]}>
      <Image
        source={product.images.bottle}
        accessible={!decorative}
        accessibilityLabel={decorative ? undefined : bottleAlt(product)}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}
