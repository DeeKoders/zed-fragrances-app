import type { ComponentRef, Ref } from "react";
import { Text as RNText, useWindowDimensions, type TextProps as RNTextProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { palette, type PaletteToken } from "@/theme/palette";
import { useThemeColor } from "@/theme/ThemeProvider";
import type { ThemeToken } from "@/theme/types";
import { maxScaleFor, typeStyle, type TextVariant } from "@/theme/typography";

export type TextProps = RNTextProps & {
  ref?: Ref<ComponentRef<typeof RNText>>;
  variant?: TextVariant;
  /** A constant palette colour (default ivory). */
  tone?: PaletteToken;
  align?: "left" | "center" | "right";
};

/** Brand text: the type scale in points, system font scaling with display styles capped. */
export function Text({ ref, variant = "body", tone = "ivory", align, style, maxFontSizeMultiplier, ...props }: TextProps) {
  const { width } = useWindowDimensions();
  return (
    <RNText
      ref={ref}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxScaleFor(variant)}
      style={[typeStyle(variant, width), { color: palette[tone] }, align && { textAlign: align }, style]}
      {...props}
    />
  );
}

type ThemedTextProps = Omit<TextProps, "tone" | "ref"> & { token?: ThemeToken };

/** Text in a themed colour that morphs with the app (accentInk by default: AA on dark surfaces). */
export function ThemedText({ variant = "body", token = "accentInk", align, style, maxFontSizeMultiplier, ...props }: ThemedTextProps) {
  const { width } = useWindowDimensions();
  const color = useThemeColor(token);
  const colorStyle = useAnimatedStyle(() => ({ color: color.value }));
  return (
    <Animated.Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxScaleFor(variant)}
      style={[typeStyle(variant, width), align && { textAlign: align }, style, colorStyle]}
      {...props}
    />
  );
}
