import { useEffect } from "react";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useReducedMotion } from "@/stores/motion";
import { ease } from "@/theme/motion";
import { palette } from "@/theme/palette";
import type { FeatureIcon as FeatureIconKey } from "@/types/product";

/** Line icons for feature strips: the website's path data (src/components/ui/FeatureIcon.tsx). */
const PATHS: Record<FeatureIconKey, string[]> = {
  lotus: [
    "M24 10c4 5 6 11 0 22c-6-11-4-17 0-22Z",
    "M24 32c-3-8-9-12-15-12c0 7 5 12 15 12Z",
    "M24 32c3-8 9-12 15-12c0 7-5 12-15 12Z",
    "M9 36c5 2 10 3 15 3s10-1 15-3",
  ],
  clock: ["M24 8a16 16 0 1 0 0 32a16 16 0 1 0 0-32Z", "M24 15v9l6 4", "M24 4v2M24 42v2M4 24h2M42 24h2"],
  diamond: ["M10 18l6-8h16l6 8l-14 20Z", "M10 18h28", "M18 18l6 20l6-20", "M16 10l2 8l6-8l6 8l2-8"],
  leaves: [
    "M14 36c0-14 8-24 22-26c0 14-8 24-22 26Z",
    "M14 36l14-16",
    "M14 36c-4-6-4-12 0-18c4 6 4 12 0 18Z",
    "M10 40h12",
  ],
  crown: ["M8 34l-2-18l10 8l8-12l8 12l10-8l-2 18Z", "M8 38h32", "M24 12v-2M6 16v-2M42 16v-2"],
  bottle: [
    "M18 6h12v6H18Z",
    "M20 12v4h8v-4",
    "M14 20c0-2 2-4 4-4h12c2 0 4 2 4 4v20c0 2-2 2-2 2H16s-2 0-2-2Z",
    "M18 26h12v10H18Z",
  ],
  lion: [
    "M24 10c8 0 14 6 14 14s-6 14-14 14s-14-6-14-14s6-14 14-14Z",
    "M18 22c0-3 3-5 6-5s6 2 6 5v4c0 4-3 6-6 6s-6-2-6-6Z",
    "M21 24h.01M27 24h.01",
    "M22 29h4",
    "M16 8l3 4l5-4l5 4l3-4",
  ],
  shield: ["M24 6l14 5v11c0 10-6 17-14 20c-8-3-14-10-14-20V11Z", "M18 24l4 4l8-9"],
  flame: [
    "M24 6c2 7 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 5-12c0 4 2 6 4 6c-1-5-1-10 1-15Z",
    "M24 40a4 4 0 0 1-4-4c0-3 4-6 4-9c0 3 4 6 4 9a4 4 0 0 1-4 4Z",
  ],
};

/** Longer than any path in the 48 box, so a dash of this length hides a whole stroke. */
const DASH = 160;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function DrawnPath({ d, draw, index, color }: { d: string; draw: SharedValue<number>; index: number; color: string }) {
  const props = useAnimatedProps(() => {
    const local = Math.min(1, Math.max(0, draw.value * 1.6 - index * 0.14));
    return { strokeDashoffset: DASH * (1 - local) };
  });
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[DASH, DASH]}
      animatedProps={props}
    />
  );
}

/**
 * A feature line icon. With `drawn` it line-draws in (1.1 s, lux ease) once `drawn` turns true;
 * reduced motion shows it at once.
 */
export function FeatureIcon({
  icon,
  size = 40,
  color = palette.gold300,
  drawn = true,
  delay = 0,
}: {
  icon: FeatureIconKey;
  size?: number;
  color?: string;
  drawn?: boolean;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const draw = useSharedValue(reduced || drawn === true ? 1 : 0);
  useEffect(() => {
    if (reduced) draw.value = 1;
    else if (drawn) draw.value = withDelay(delay, withTiming(1, { duration: 1100, easing: ease.lux }));
  }, [drawn, reduced, delay, draw]);
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" accessible={false}>
      {PATHS[icon].map((d, index) => (
        <DrawnPath key={d} d={d} draw={draw} index={index} color={color} />
      ))}
    </Svg>
  );
}
