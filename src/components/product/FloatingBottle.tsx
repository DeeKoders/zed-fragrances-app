import { useEffect } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useReducedMotion } from "@/stores/motion";
import type { Product } from "@/types/product";
import { Bottle } from "./Bottle";

const MAX_TILT_Y = 12;
const MAX_TILT_X = 8;
/** One float cycle (up and down), ms. */
const FLOAT = 3200;

type FloatingBottleProps = {
  product: Product;
  height: number;
  /** -1..1 horizontal / vertical pointer (touch or tilt). */
  tiltX?: SharedValue<number>;
  tiltY?: SharedValue<number>;
  /** How strongly this bottle follows the pointer. */
  depth?: number;
  /** Starts the float cycle later, so two bottles don't bob in sync. */
  floatDelay?: number;
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A bottle that floats and turns in 3D after the touch / tilt pointer. Still with reduced motion. */
export function FloatingBottle({
  product,
  height,
  tiltX,
  tiltY,
  depth = 1,
  floatDelay = 0,
  decorative = false,
  style,
}: FloatingBottleProps) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      float.value = 0;
      return;
    }
    float.value = withDelay(
      floatDelay,
      withRepeat(withTiming(1, { duration: FLOAT / 2, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [reduced, floatDelay, float]);

  const animated = useAnimatedStyle(() => {
    const x = reduced || !tiltX ? 0 : tiltX.value;
    const y = reduced || !tiltY ? 0 : tiltY.value;
    return {
      transform: [
        { perspective: 900 },
        { translateY: (float.value - 0.5) * 14 + y * 6 * depth },
        { translateX: x * 8 * depth },
        { rotateY: `${x * MAX_TILT_Y * depth}deg` },
        { rotateX: `${-y * MAX_TILT_X * depth}deg` },
        { rotateZ: `${(float.value - 0.5) * 1.6}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[animated, style]}>
      <Bottle product={product} height={height} decorative={decorative} />
    </Animated.View>
  );
}
