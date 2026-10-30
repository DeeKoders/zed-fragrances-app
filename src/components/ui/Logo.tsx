import { Image } from "expo-image";
import { type StyleProp, type ImageStyle } from "react-native";
import { brand } from "@/config/brand";

/** The official logo (full: ZED + FRAGRANCES + flame rule) or the transparent wordmark. Never redrawn. */
export function Logo({ kind = "wordmark", width, style }: { kind?: "full" | "wordmark"; width: number; style?: StyleProp<ImageStyle> }) {
  const asset = brand.logo[kind];
  return (
    <Image
      source={asset.source}
      accessibilityLabel={brand.name}
      accessible
      contentFit="contain"
      style={[{ width, height: (width * asset.height) / asset.width }, style]}
    />
  );
}
