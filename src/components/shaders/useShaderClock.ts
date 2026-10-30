import { useEffect } from "react";
import { useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";

/**
 * Shader time in seconds. Advances only while `running` (screen focused, app active, motion
 * allowed) and `paused` (an opaque section covering it, decided on the UI thread) is false, so a
 * paused canvas stops redrawing entirely.
 */
export function useShaderClock(running: boolean, paused?: SharedValue<boolean>) {
  const time = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    if (paused?.value) return;
    const delta = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    time.value += delta;
  }, false);
  useEffect(() => {
    frame.setActive(running);
    return () => frame.setActive(false);
  }, [running, frame]);
  return time;
}
