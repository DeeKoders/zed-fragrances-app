import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Text, ThemedText } from "@/components/ui/Text";
import { useReducedMotion } from "@/stores/motion";
import { duration, ease, easeFn, stagger } from "@/theme/motion";
import type { PaletteToken } from "@/theme/palette";
import type { ThemeToken } from "@/theme/types";
import type { TextVariant } from "@/theme/typography";
import { useInView } from "./ScrollContext";

/** Fades and lifts its children in when they scroll into view (lux ease). */
export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const ref = useAnimatedRef<View>();
  const progress = useSharedValue(reduced ? 1 : 0);
  useInView(ref, () => {
    "worklet";
    progress.value = withDelay(delay, withTiming(1, { duration: duration.reveal, easing: ease.lux }));
  }, !reduced);
  const animated = useAnimatedStyle(() => ({
    opacity: reduced ? 1 : progress.value,
    transform: [{ translateY: reduced ? 0 : (1 - progress.value) * 24 }],
  }));
  return (
    <Animated.View ref={ref} style={[style, animated]}>
      {children}
    </Animated.View>
  );
}

type RevealTextProps = {
  text: string;
  variant?: TextVariant;
  tone?: PaletteToken;
  token?: ThemeToken;
  align?: "left" | "center";
  heading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A heading revealed letter by letter (short text, 40 ms stagger) or word by word (longer text,
 * 80 ms stagger) as it enters the viewport. Screen readers get the whole text once.
 */
export function RevealText({ text, variant = "h2", tone, token, align = "left", heading = true, style }: RevealTextProps) {
  const reduced = useReducedMotion();
  const ref = useAnimatedRef<View>();
  const byLetter = text.length <= 14;
  const units = byLetter ? Array.from(text) : text.split(/(\s+)/).filter((part) => part.length > 0);
  const gap = byLetter ? stagger.chars : stagger.lines;
  const total = duration.reveal + units.length * gap;
  const progress = useSharedValue(reduced ? 1 : 0);

  useInView(ref, () => {
    "worklet";
    progress.value = withTiming(1, { duration: total });
  }, !reduced);

  return (
    <View
      ref={ref}
      accessible
      accessibilityRole={heading ? "header" : "text"}
      accessibilityLabel={text}
      style={[{ flexDirection: "row", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }, style]}
    >
      {units.map((unit, index) => (
        <Unit
          key={`${unit}-${index}`}
          unit={unit}
          index={index}
          gap={gap}
          total={total}
          progress={progress}
          variant={variant}
          tone={tone}
          token={token}
        />
      ))}
    </View>
  );
}

function Unit({
  unit,
  index,
  gap,
  total,
  progress,
  variant,
  tone,
  token,
}: {
  unit: string;
  index: number;
  gap: number;
  total: number;
  progress: SharedValue<number>;
  variant: TextVariant;
  tone?: PaletteToken;
  token?: ThemeToken;
}) {
  const start = (index * gap) / total;
  const end = (index * gap + duration.reveal) / total;
  const style = useAnimatedStyle(() => {
    const local = easeFn.lux(Math.min(1, Math.max(0, interpolate(progress.value, [start, end], [0, 1]))));
    return { opacity: local, transform: [{ translateY: (1 - local) * 18 }] };
  });
  const content = unit.trim() === "" ? " " : unit;
  return (
    <Animated.View style={style} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {token ? (
        <ThemedText variant={variant} token={token}>
          {content}
        </ThemedText>
      ) : (
        <Text variant={variant} tone={tone}>
          {content}
        </Text>
      )}
    </Animated.View>
  );
}
