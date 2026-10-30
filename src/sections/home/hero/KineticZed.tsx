import { Canvas, Group, LinearGradient, Text as SkiaText, useFont, vec } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { brand } from "@/config/brand";
import { goldGradient, palette } from "@/theme/palette";

/** Per-letter parallax depth, so the letters drift apart with the pointer. */
const DEPTHS = [1.3, 0.7, 1.1, 0.9];
/** Pointer travel per depth unit, as a share of the letter size. */
const TRAVEL = 0.07;

type KineticZedProps = {
  width: number;
  /** Letter size (pt): ~32% of the screen width. */
  size: number;
  pointerX: SharedValue<number>;
  pointerY: SharedValue<number>;
  /** Seconds, for the glint; omit for a still word. */
  time?: SharedValue<number>;
  /** 0..1 entrance. */
  enter: SharedValue<number>;
};

/**
 * The massive kinetic brand word in gold Cinzel, drawn with Skia: each letter has its own parallax
 * depth following touch and tilt, and a glint pulses letter by letter. Decorative (the screen's
 * heading carries the name).
 */
export function KineticZed({ width, size, pointerX, pointerY, time, enter }: KineticZedProps) {
  const font = useFont(require("@expo-google-fonts/cinzel/700Bold/Cinzel_700Bold.ttf"), size);
  const letters = useMemo(() => Array.from(brand.shortName.toUpperCase()), []);
  const layout = useMemo(() => {
    if (!font) return null;
    const tracking = -0.03 * size;
    const widths = letters.map((letter) => font.measureText(letter).width);
    const total = widths.reduce((sum, w) => sum + w, 0) + tracking * (letters.length - 1);
    let x = (width - total) / 2;
    return letters.map((letter, index) => {
      const at = x;
      x += widths[index] + tracking;
      return { letter, x: at, width: widths[index] };
    });
  }, [font, letters, size, width]);

  const height = size * 1.05;
  const baseline = size * 0.86;

  return (
    <View pointerEvents="none" style={[styles.root, { height }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {font && layout ? (
        <Canvas style={{ width, height }}>
          {layout.map((item, index) => (
            <Letter
              key={`${item.letter}-${index}`}
              index={index}
              letter={item.letter}
              x={item.x}
              baseline={baseline}
              size={size}
              font={font}
              pointerX={pointerX}
              pointerY={pointerY}
              time={time}
              enter={enter}
              count={layout.length}
            />
          ))}
        </Canvas>
      ) : null}
    </View>
  );
}

function Letter({
  index,
  letter,
  x,
  baseline,
  size,
  font,
  pointerX,
  pointerY,
  time,
  enter,
  count,
}: {
  index: number;
  letter: string;
  x: number;
  baseline: number;
  size: number;
  font: NonNullable<ReturnType<typeof useFont>>;
  pointerX: SharedValue<number>;
  pointerY: SharedValue<number>;
  time?: SharedValue<number>;
  enter: SharedValue<number>;
  count: number;
}) {
  const depth = DEPTHS[index % DEPTHS.length];
  const transform = useDerivedValue(() => {
    const local = Math.min(1, Math.max(0, enter.value * (1 + count * 0.15) - index * 0.15));
    return [
      { translateX: pointerX.value * depth * size * TRAVEL },
      { translateY: pointerY.value * depth * size * TRAVEL * 0.6 + (1 - local) * size * 0.35 },
    ];
  });
  const opacity = useDerivedValue(() => Math.min(1, Math.max(0, enter.value * (1 + count * 0.15) - index * 0.15)));
  const glint = useDerivedValue(() => {
    if (!time) return 0;
    const wave = Math.sin(time.value * 1.1 - index * 0.75);
    return Math.pow(Math.max(0, wave), 10) * 0.85;
  });
  return (
    <Group transform={transform} opacity={opacity}>
      <SkiaText x={x} y={baseline} text={letter} font={font}>
        <LinearGradient start={vec(0, 0)} end={vec(0, baseline)} colors={[...goldGradient]} positions={[0, 0.3, 0.55, 0.82, 1]} />
      </SkiaText>
      <Group opacity={glint}>
        <SkiaText x={x} y={baseline} text={letter} font={font} color={palette.gold100} />
      </Group>
    </Group>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center" },
});
