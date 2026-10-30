import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { haptics } from "@/lib/haptics";
import { useReducedMotion } from "@/stores/motion";
import { ease, spring } from "@/theme/motion";
import { palette } from "@/theme/palette";
import { useThemeColor } from "@/theme/ThemeProvider";
import { Sheen } from "./Sheen";
import { Text, ThemedText } from "./Text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = "gold" | "accent" | "outline" | "ghost";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Icon after the label (decorative). */
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  /** Haptic on press; "none" for buttons that trigger their own (e.g. order results). */
  haptic?: "light" | "selection" | "none";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  /** Fixed colours instead of the morphing theme (a product's own world, whatever the app's theme). */
  colors?: { background?: string; border?: string };
};

/**
 * The brand button. Press: a snap-spring scale to 0.97 and a gold sheen sweeping across.
 * Reduced motion: no sheen, a quick fade instead of the scale.
 */
export function Button({
  label,
  onPress,
  variant = "gold",
  icon,
  disabled = false,
  loading = false,
  haptic = "light",
  accessibilityLabel,
  accessibilityHint,
  style,
  compact = false,
  colors,
}: ButtonProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const sheen = useSharedValue(0);
  const width = useSharedValue(0);
  const accent = useThemeColor("accent");
  const border = useThemeColor("accentBorder");

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 - pressed.value * 0.3,
    backgroundColor:
      variant === "accent" ? (colors?.background ?? accent.value) : variant === "gold" ? palette.gold300 : palette.clear,
    borderColor: variant === "outline" ? (colors?.border ?? border.value) : palette.clear,
  }));

  const inactive = disabled || loading;
  const pressIn = () => {
    if (reduced) {
      pressed.value = withTiming(1, { duration: 80 });
      return;
    }
    scale.value = withSpring(0.97, spring.snap);
    sheen.value = 0;
    sheen.value = withTiming(1, { duration: 750, easing: ease.lux });
  };
  const pressOut = () => {
    pressed.value = withTiming(0, { duration: 120 });
    scale.value = withSpring(1, spring.snap);
  };
  const press = () => {
    if (haptic === "light") haptics.light();
    else if (haptic === "selection") haptics.selection();
    onPress?.();
  };

  const labelNode =
    variant === "accent" ? (
      <ThemedText variant="label" token="onAccent" numberOfLines={2} align="center">
        {label}
      </ThemedText>
    ) : (
      <Text variant="label" tone={variant === "gold" ? "ink950" : variant === "ghost" ? "gold200" : "ivory"} numberOfLines={2} align="center">
        {label}
      </Text>
    );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={press}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onLayout={(event) => {
        width.value = event.nativeEvent.layout.width;
      }}
      hitSlop={compact ? 6 : 0}
      style={[
        styles.base,
        compact && styles.compact,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        inactive && styles.inactive,
        animated,
        style,
      ]}
    >
      {variant !== "ghost" && !reduced ? <Sheen progress={sheen} width={width} /> : null}
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={variant === "gold" ? palette.ink950 : palette.gold200} /> : null}
        {labelNode}
        {icon}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  compact: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10 },
  outline: { borderWidth: 1 },
  ghost: { paddingHorizontal: 8, borderWidth: 0 },
  inactive: { opacity: 0.55 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
});
