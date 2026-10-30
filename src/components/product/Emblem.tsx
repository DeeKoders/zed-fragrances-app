import { Image } from "expo-image";
import { type StyleProp, type ImageStyle } from "react-native";
import type { Product } from "@/types/product";

/** The product's emblem artwork, rendered as it is (never redrawn). Decorative unless labelled. */
export function Emblem({ product, size, opacity = 1, style }: { product: Product; size: number; opacity?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={product.emblem}
      accessible={false}
      contentFit="contain"
      style={[{ width: size, height: size, opacity }, style]}
    />
  );
}
