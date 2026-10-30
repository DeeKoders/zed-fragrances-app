import { Canvas, ColorMatrix, Fill, FractalNoise, RadialGradient, Rect, useCanvasSize, vec } from "@shopify/react-native-skia";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { alpha, palette } from "@/theme/palette";

/** How much the grain shows (the website's 0.07). */
const GRAIN_OPACITY = 0.07;
/**
 * Noise → white specks whose alpha follows the noise's brightness, scaled by GRAIN_OPACITY. The
 * opacity lives in the alpha row because Skia applies paint opacity before the colour filter, and
 * this row rebuilds alpha from RGB, so an `opacity` prop would be discarded.
 */
const GRAIN = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, ...[0.9, 0.9, 0.9, 0, -1.25].map((v) => v * GRAIN_OPACITY)];

/**
 * Film grain and vignette over the whole app: one static Skia canvas (fractal noise at low opacity
 * plus a radial vignette). Re-renders only when its size changes, never takes touches, hidden from
 * screen readers. Sized by the canvas, not the window: on Android the window leaves out the system
 * bars the app draws behind, which cut the vignette off above the bottom of the screen.
 */
export const GrainOverlay = memo(function GrainOverlay() {
  const { ref, size } = useCanvasSize();
  const { width, height } = size;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Canvas ref={ref} style={StyleSheet.absoluteFill}>
        <Fill>
          <FractalNoise freqX={0.8} freqY={0.8} octaves={2} seed={7} />
          <ColorMatrix matrix={GRAIN} />
        </Fill>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width / 2, height / 2)}
            r={Math.hypot(width, height) / 2}
            colors={[palette.clear, palette.clear, alpha(palette.ink950, 0.55)]}
            positions={[0, 0.6, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
});
