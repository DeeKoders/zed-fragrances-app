import { Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeOut, LinearTransition, type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { router } from "expo-router";
import { Bottle } from "@/components/product/Bottle";
import { Icon } from "@/components/ui/Icon";
import { Price } from "@/components/ui/Price";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { haptics } from "@/lib/haptics";
import type { OrderLine } from "@/lib/checkout";
import { MAX_QUANTITY, useCart } from "@/stores/cart";
import { useReducedMotion } from "@/stores/motion";
import { palette } from "@/theme/palette";

const copy = brand.copy.cart;

/** One bag line: thumbnail, name, size, price, a 1–20 stepper and remove (button or swipe left). */
export function BagLine({ line }: { line: OrderLine }) {
  const reduced = useReducedMotion();
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const { product, ml, quantity } = line;
  const removeLine = () => {
    haptics.light();
    remove(product.slug, ml);
  };

  return (
    <Animated.View layout={reduced ? undefined : LinearTransition} exiting={reduced ? undefined : FadeOut.duration(200)}>
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={60}
        overshootRight={false}
        onSwipeableOpen={removeLine}
        renderRightActions={(progress) => <RemoveAction progress={progress} />}
      >
        <View style={styles.line}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={product.name}
            onPress={() => router.push(`/fragrances/${product.slug}`)}
            style={styles.thumb}
          >
            <Bottle product={product} height={88} decorative />
          </Pressable>
          <View style={styles.info}>
            <Text variant="h3" numberOfLines={1}>
              {product.name}
            </Text>
            <Text variant="micro" tone="ivoryMuted">{`${ml}ml`}</Text>
            {line.inStock ? (
              <Price value={line.unitPrice} variant="label" tone="gold200" />
            ) : (
              <Text variant="label" tone="gold200">
                {copy.outOfStock}
              </Text>
            )}
            <View style={styles.controls}>
              <View style={styles.stepper} accessible={false}>
                <StepButton
                  icon="minus"
                  label={`${copy.decrease}, ${product.name}`}
                  disabled={quantity <= 1}
                  onPress={() => setQuantity(product.slug, ml, quantity - 1)}
                />
                <Text
                  variant="label"
                  style={styles.quantity}
                  accessibilityLabel={`${copy.quantity}: ${quantity}`}
                  accessibilityLiveRegion="polite"
                >
                  {quantity}
                </Text>
                <StepButton
                  icon="plus"
                  label={`${copy.increase}, ${product.name}`}
                  disabled={quantity >= MAX_QUANTITY}
                  onPress={() => setQuantity(product.slug, ml, quantity + 1)}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${copy.remove}, ${product.name}`}
                onPress={removeLine}
                style={styles.remove}
                hitSlop={6}
              >
                <Icon name="trash" size={18} color={palette.ivoryMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: "plus" | "minus"; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={[styles.step, disabled && styles.disabled]}
    >
      <Icon name={icon} size={16} />
    </Pressable>
  );
}

function RemoveAction({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 1.5) }));
  return (
    <Animated.View style={[styles.action, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Icon name="trash" size={20} color={palette.ink950} />
      <Text variant="micro" tone="ink950">
        {copy.remove}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: "row", gap: 14, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: palette.ink950 },
  thumb: { width: 72, alignItems: "center", justifyContent: "center", backgroundColor: palette.ink900 },
  info: { flex: 1, gap: 4 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold700 },
  step: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.35 },
  quantity: { minWidth: 28, textAlign: "center", fontVariant: ["tabular-nums"], letterSpacing: 0 },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  action: { width: 96, backgroundColor: palette.gold300, alignItems: "center", justifyContent: "center", gap: 4 },
});
