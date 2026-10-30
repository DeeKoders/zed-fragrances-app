import { useIsFocused } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";
import { useReducedMotion } from "@/stores/motion";
import { spring } from "@/theme/motion";
import { useAppActive } from "./useAppActive";

/** How far the phone tips (in g) for a full ±1. Gentle by design. */
const RANGE = 0.35;
/** How quickly the neutral pose follows the way the phone is held (per reading). */
const FOLLOW = 0.02;

export type Tilt = { x: SharedValue<number>; y: SharedValue<number> };

/**
 * Device tilt relative to how the phone is being held, as two springs in -1..1 (x: left/right,
 * y: towards/away). Listens only while the screen is focused, the app is active and motion is allowed.
 */
export function useTilt(enabled = true): Tilt {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const active = useAppActive();
  const listening = enabled && !reduced && focused && active;

  useEffect(() => {
    if (!listening) {
      x.value = withSpring(0, spring.magnet);
      y.value = withSpring(0, spring.magnet);
      return;
    }
    // Android reports the opposite sign to iOS.
    const sign = Platform.OS === "android" ? -1 : 1;
    let neutral: { x: number; y: number } | null = null;
    Accelerometer.setUpdateInterval(50);
    const subscription = Accelerometer.addListener((reading) => {
      const rx = reading.x * sign;
      const ry = reading.y * sign;
      neutral = neutral ? { x: neutral.x + (rx - neutral.x) * FOLLOW, y: neutral.y + (ry - neutral.y) * FOLLOW } : { x: rx, y: ry };
      const clamp = (value: number) => Math.max(-1, Math.min(1, value / RANGE));
      x.value = withSpring(clamp(rx - neutral.x), spring.magnet);
      y.value = withSpring(clamp(-(ry - neutral.y)), spring.magnet);
    });
    return () => subscription.remove();
  }, [listening, x, y]);

  return { x, y };
}
