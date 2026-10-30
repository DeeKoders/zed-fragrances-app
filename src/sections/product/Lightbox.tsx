import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
  useExclusiveGestures,
} from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { useReducedMotion } from "@/stores/motion";
import { spring } from "@/theme/motion";
import { palette } from "@/theme/palette";
import type { ImageSource } from "@/types/product";

const copy = brand.copy.product;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const CLOSE_DISTANCE = 120;

type LightboxProps = {
  images: ImageSource[];
  /** Index to open at, or null when closed. */
  index: number | null;
  label: string;
  onClose: () => void;
};

/**
 * Full-screen gallery: swipe between images, pinch and double-tap to zoom, pan while zoomed, swipe
 * down to close. Android back closes it.
 */
export function Lightbox({ images, index, label, onClose }: LightboxProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(index ?? 0);
  const [zoomed, setZoomed] = useState(false);
  const list = useRef<ComponentRef<typeof FlatList<ImageSource>>>(null);
  const backdrop = useSharedValue(1);

  useEffect(() => {
    if (index !== null) {
      setPage(index);
      setZoomed(false);
      backdrop.value = 1;
    }
  }, [index, backdrop]);

  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(images.length - 1, next));
      list.current?.scrollToIndex({ index: target, animated: true });
      setPage(target);
    },
    [images.length],
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  return (
    <Modal visible={index !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root} accessibilityViewIsModal>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
        {index !== null ? (
          <FlatList
            ref={list}
            data={images}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(_, i) => `${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index: i }) => (
              <ZoomableImage
                source={item}
                width={width}
                height={height}
                active={i === page}
                label={`${label}, ${copy.image} ${i + 1} / ${images.length}`}
                backdrop={backdrop}
                onZoom={setZoomed}
                onClose={onClose}
              />
            )}
          />
        ) : null}
        <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Text variant="micro" tone="ivoryMuted">{`${page + 1} / ${images.length}`}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={onClose} style={styles.button} hitSlop={8}>
            <Icon name="close" />
          </Pressable>
        </View>
        {images.length > 1 ? (
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
            <Pressable accessibilityRole="button" accessibilityLabel={copy.previous} disabled={page === 0} onPress={() => go(page - 1)} style={[styles.button, page === 0 && styles.dim]}>
              <Icon name="back" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.next}
              disabled={page === images.length - 1}
              onPress={() => go(page + 1)}
              style={[styles.button, page === images.length - 1 && styles.dim]}
            >
              <Icon name="forward" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

type ZoomableImageProps = {
  source: ImageSource;
  width: number;
  height: number;
  active: boolean;
  label: string;
  backdrop: SharedValue<number>;
  onZoom: (zoomed: boolean) => void;
  onClose: () => void;
};

function ZoomableImage({ source, width, height, active, label, backdrop, onZoom, onClose }: ZoomableImageProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const [zoomed, setZoomed] = useState(false);

  const report = useCallback(
    (value: boolean) => {
      setZoomed(value);
      onZoom(value);
    },
    [onZoom],
  );

  // Leaving a page resets its zoom.
  useEffect(() => {
    if (active) return;
    scale.value = 1;
    x.value = 0;
    y.value = 0;
  }, [active, scale, x, y]);

  const clampPan = (value: number, size: number, s: number) => {
    "worklet";
    const max = Math.max(0, (size * s - size) / 2);
    return Math.min(max, Math.max(-max, value));
  };

  const pinch = usePinchGesture({
    onBegin: () => {
      "worklet";
      startScale.value = scale.value;
    },
    onUpdate: (event) => {
      "worklet";
      scale.value = Math.max(0.8, Math.min(MAX_SCALE, startScale.value * event.scale));
    },
    onFinalize: () => {
      "worklet";
      if (scale.value <= 1.02) {
        scale.value = withSpring(1, spring.snap);
        x.value = withSpring(0, spring.snap);
        y.value = withSpring(0, spring.snap);
        scheduleOnRN(report, false);
      } else scheduleOnRN(report, true);
    },
  });

  const pan = usePanGesture({
    // Not zoomed: only a vertical drag (swipe down to close); horizontal swipes go to the pager.
    activeOffsetX: zoomed ? [-1, 1] : [-10000, 10000],
    activeOffsetY: zoomed ? [-1, 1] : [-12, 12],
    failOffsetX: zoomed ? [-10000, 10000] : [-14, 14],
    onBegin: () => {
      "worklet";
      startX.value = x.value;
      startY.value = y.value;
    },
    onUpdate: (event) => {
      "worklet";
      if (scale.value > 1.02) {
        x.value = clampPan(startX.value + event.translationX, width, scale.value);
        y.value = clampPan(startY.value + event.translationY, height, scale.value);
      } else {
        y.value = Math.max(0, event.translationY);
        backdrop.value = 1 - Math.min(0.7, y.value / (height * 0.6));
      }
    },
    onDeactivate: (event) => {
      "worklet";
      if (scale.value > 1.02) return;
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > 900) {
        scheduleOnRN(onClose);
      } else {
        y.value = withSpring(0, spring.snap);
        backdrop.value = withTiming(1);
      }
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: (event) => {
      "worklet";
      if (scale.value > 1.02) {
        scale.value = reduced ? 1 : withSpring(1, spring.snap);
        x.value = reduced ? 0 : withSpring(0, spring.snap);
        y.value = reduced ? 0 : withSpring(0, spring.snap);
        scheduleOnRN(report, false);
      } else {
        const target = DOUBLE_TAP_SCALE;
        const tx = clampPan((width / 2 - event.x) * (target - 1), width, target);
        const ty = clampPan((height / 2 - event.y) * (target - 1), height, target);
        scale.value = reduced ? target : withSpring(target, spring.snap);
        x.value = reduced ? tx : withSpring(tx, spring.snap);
        y.value = reduced ? ty : withSpring(ty, spring.snap);
        scheduleOnRN(report, true);
      }
    },
  });

  const zoom = useSimultaneousGestures(pinch, pan);
  const gesture = useExclusiveGestures(doubleTap, zoom);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, styles.page, style]} accessible accessibilityRole="image" accessibilityLabel={label} accessibilityHint={copy.zoom}>
        <Image source={source} contentFit="contain" style={{ width, height }} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: palette.ink950 },
  page: { alignItems: "center", justifyContent: "center" },
  top: { position: "absolute", top: 0, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bottom: { position: "absolute", bottom: 0, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  button: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold700,
    backgroundColor: palette.ink950,
  },
  dim: { opacity: 0.35 },
});
