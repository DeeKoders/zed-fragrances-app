import { createContext, useContext, useEffect } from "react";
import { useWindowDimensions, type View } from "react-native";
import {
  measure,
  useAnimatedReaction,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

type ScrollContextValue = { scrollY: SharedValue<number> };

/** The vertical scroll offset of the screen's main scroll view, for scroll-driven effects. */
export const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScrollY() {
  return useContext(ScrollContext)?.scrollY ?? null;
}

/**
 * Calls `onEnter` (a worklet) once, the first time the element is on screen: on mount if it's
 * already visible, otherwise when scrolling brings it in. Measured on the UI thread.
 */
export function useInView(ref: AnimatedRef<View>, onEnter: () => void, enabled = true) {
  const scrollY = useScrollY();
  const { height } = useWindowDimensions();
  const seen = useSharedValue(false);
  const tick = useSharedValue(0);

  useAnimatedReaction(
    () => (scrollY ? scrollY.value : 0) + tick.value * 0,
    () => {
      if (!enabled || seen.value) return;
      const box = measure(ref);
      if (!box) return;
      if (box.pageY < height * 0.92 && box.pageY + box.height > 0) {
        seen.value = true;
        onEnter();
      }
    },
    [enabled, height],
  );

  // Re-check after layout settles (the first measure can run before the view exists).
  useEffect(() => {
    const timers = [80, 400, 1200].map((delay) =>
      setTimeout(() => scheduleOnUI(() => {
        "worklet";
        tick.value += 1;
      }), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [tick]);
}
