import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type GestureResponderEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RevealText } from "@/components/motion/Reveal";
import { FloatingBottle } from "@/components/product/FloatingBottle";
import { Atmosphere } from "@/components/shaders/Atmosphere";
import { Button } from "@/components/ui/Button";
import { DiamondDivider } from "@/components/ui/DiamondDivider";
import { Text, ThemedText } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { quiz } from "@/data/quiz";
import { useAddToBag } from "@/hooks/useAddToBag";
import { useTilt } from "@/hooks/useTilt";
import { announce, focusOn } from "@/lib/a11y";
import { firstInStock } from "@/lib/catalogue";
import { haptics } from "@/lib/haptics";
import { rankProducts, type FinderResult } from "@/lib/scent-finder";
import { useCatalogue } from "@/stores/catalogue";
import { useReducedMotion } from "@/stores/motion";
import { duration, ease } from "@/theme/motion";
import { palette, scrim } from "@/theme/palette";
import { getTheme } from "@/theme/registry";
import { useTheme, useThemeColor } from "@/theme/ThemeProvider";

const copy = brand.copy.finder;

type Burst = { x: number; y: number; color: string; key: number };

/**
 * The Scent Finder: four quick choices from quiz.ts, scored with rankProducts (so new products join
 * automatically). The result is a full-app takeover: an accent burst from the last tapped choice
 * while the whole app morphs into the matched world, with a success haptic.
 */
export default function FinderScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const { setTheme } = useTheme();
  const tilt = useTilt();
  const catalogue = useCatalogue((state) => state.catalogue);
  const { addSize } = useAddToBag();

  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<FinderResult | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const progressColor = useThemeColor("accent");
  const progress = useSharedValue(0);
  useEffect(() => {
    const value = step < 0 ? 0 : (step + 1) / quiz.length;
    progress.value = reduced ? value : withTiming(value, { duration: duration.ui, easing: ease.lux });
  }, [step, reduced, progress]);
  const bar = useAnimatedStyle(() => ({ backgroundColor: progressColor.value, transform: [{ scaleX: progress.value }] }));

  const moveTo = useCallback((next: number) => {
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
    focusOn(heading);
  }, []);

  const restart = useCallback(() => {
    setAnswers([]);
    setResult(null);
    setBurst(null);
    moveTo(-1);
  }, [moveTo]);

  const back = useCallback(() => {
    if (result) return restart();
    if (step <= 0) return moveTo(-1);
    setAnswers((current) => current.slice(0, step - 1));
    moveTo(step - 1);
  }, [result, step, moveTo, restart]);

  // Android back steps back through the quiz before leaving the tab.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (step < 0 && !result) return false;
        back();
        return true;
      });
      return () => subscription.remove();
    }, [step, result, back]),
  );

  const choose = (option: number, event: GestureResponderEvent) => {
    haptics.selection();
    const next = [...answers.slice(0, step), option];
    setAnswers(next);
    if (step < quiz.length - 1) {
      moveTo(step + 1);
      return;
    }
    const [best] = rankProducts(products, quiz, next);
    if (!best) return;
    const { pageX, pageY } = event.nativeEvent;
    setBurst({ x: pageX, y: pageY, color: getTheme(best.product.slug).tokens.accent, key: Date.now() });
    setTheme(best.product.slug);
    setResult(best);
    haptics.success();
    announce(`${copy.resultEyebrow}: ${best.product.name}, ${best.match}% ${copy.match}`);
    moveTo(quiz.length);
  };

  const current = step >= 0 && step < quiz.length ? quiz[step] : null;
  const size = result ? firstInStock(result.product, catalogue) : undefined;

  return (
    <View style={styles.root}>
      <Atmosphere />
      <ScrollView
        ref={scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {step < 0 ? (
          <View style={styles.block}>
            <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={copy.title}>
              <ThemedText variant="micro">{copy.eyebrow}</ThemedText>
            </View>
            <RevealText text={copy.title} variant="h1" />
            <Text variant="editorial" tone="ivoryMuted">
              {copy.intro}
            </Text>
            <DiamondDivider style={styles.divider} />
            <Button label={copy.start} onPress={() => moveTo(0)} />
          </View>
        ) : null}

        {current ? (
          <View style={styles.block}>
            <View style={styles.progressRow}>
              <Text variant="micro" tone="ivoryMuted">{`${copy.step} ${step + 1} ${copy.of} ${quiz.length}`}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={copy.back} onPress={back} hitSlop={10} style={styles.backButton}>
                <Text variant="micro" tone="gold200">
                  {copy.back}
                </Text>
              </Pressable>
            </View>
            <View
              style={styles.track}
              accessible
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: quiz.length, now: step + 1 }}
            >
              <Animated.View style={[styles.trackFill, bar]} />
            </View>
            <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={current.question}>
              <Text variant="h2" key={`q-${step}`}>
                {current.question}
              </Text>
            </View>
            <View style={styles.options}>
              {current.options.map((option, index) => (
                <OptionCard
                  key={`${step}-${option.label}`}
                  label={option.label}
                  hint={option.hint}
                  selected={answers[step] === index}
                  index={index}
                  reduced={reduced}
                  onPress={(event) => choose(index, event)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {result ? (
          <Animated.View entering={reduced ? undefined : FadeIn.delay(380).duration(duration.reveal)} style={[styles.block, styles.result]}>
            <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={`${copy.resultEyebrow}: ${result.product.name}`}>
              <ThemedText variant="micro" align="center">
                {copy.resultEyebrow}
              </ThemedText>
            </View>
            <FloatingBottle product={result.product} height={Math.min(height * 0.36, 320)} tiltX={tilt.x} tiltY={tilt.y} />
            <Text variant="h1" align="center">
              {result.product.name}
            </Text>
            <Text variant="editorial" tone="ivoryMuted" align="center">
              {result.product.tagline}
            </Text>
            <ThemedText variant="label" align="center">{`${result.match}% ${copy.match}`}</ThemedText>
            <DiamondDivider style={styles.divider} />
            <View style={styles.actions}>
              <Button
                variant="accent"
                label={`${brand.copy.hero.cta} ${result.product.name}`}
                onPress={() => router.push(`/fragrances/${result.product.slug}`)}
              />
              <Button
                variant="outline"
                label={size ? brand.copy.cart.addToBag : brand.copy.cart.outOfStock}
                disabled={!size}
                onPress={() => size && addSize(result.product, size.ml)}
              />
              <Button variant="ghost" label={copy.restart} onPress={restart} />
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
      {burst && !reduced ? <AccentBurst key={burst.key} burst={burst} width={width} height={height} /> : null}
    </View>
  );
}

function OptionCard({
  label,
  hint,
  selected,
  index,
  reduced,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  index: number;
  reduced: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const border = useThemeColor("accentBorder");
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    borderColor: selected || pressed.value > 0.5 ? border.value : palette.line,
    transform: [{ scale: 1 - pressed.value * 0.02 }],
  }));
  return (
    <Animated.View entering={reduced ? undefined : FadeIn.delay(index * 80).duration(duration.ui)}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={hint ? `${label}. ${hint}` : label}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 120 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 200 });
        }}
      >
        <Animated.View style={[styles.option, style]}>
          <View style={styles.optionText}>
            <Text variant="h3">{label}</Text>
            {hint ? (
              <Text variant="editorial" tone="ivoryMuted">
                {hint}
              </Text>
            ) : null}
          </View>
          <View style={[styles.optionDiamond, selected && styles.optionDiamondOn]} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** The result's accent burst, expanding from the last tapped choice. Decorative. */
function AccentBurst({ burst, width, height }: { burst: Burst; width: number; height: number }) {
  const size = 40;
  const reach = (Math.hypot(Math.max(burst.x, width - burst.x), Math.max(burst.y, height - burst.y)) * 2) / size;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: duration.theme + 400, easing: ease.silk });
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.55 ? 0.85 : 0.85 * (1 - (progress.value - 0.55) / 0.45),
    transform: [{ scale: 0.2 + progress.value * reach }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.burst,
        { left: burst.x - size / 2, top: burst.y - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: burst.color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink950 },
  content: { paddingHorizontal: 20, paddingBottom: 48, flexGrow: 1 },
  block: { gap: 16 },
  divider: { marginVertical: 8 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  backButton: { minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center" },
  track: { height: 2, backgroundColor: palette.line, overflow: "hidden" },
  trackFill: { ...StyleSheet.absoluteFill, transformOrigin: "left" },
  options: { gap: 12, marginTop: 8 },
  option: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    backgroundColor: scrim.glass,
  },
  optionText: { flex: 1, gap: 2 },
  optionDiamond: { width: 10, height: 10, borderWidth: 1, borderColor: palette.gold400, transform: [{ rotate: "45deg" }] },
  optionDiamondOn: { backgroundColor: palette.gold300 },
  result: { alignItems: "center" },
  actions: { alignSelf: "stretch", gap: 10 },
  burst: { position: "absolute" },
});
