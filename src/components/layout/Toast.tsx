import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { useReducedMotion } from "@/stores/motion";
import { useToast } from "@/stores/toast";
import { palette, scrim } from "@/theme/palette";

const VISIBLE_MS = 3200;

/** The app's toast ("Added to bag" · "View bag"), floating above the tab bar / bottom bar. */
export function Toast() {
  const toast = useToast((state) => state.toast);
  const hide = useToast((state) => state.hide);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => hide(toast.id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 96 }]}>
      <Animated.View
        key={toast.id}
        entering={reduced ? undefined : FadeInDown.springify().stiffness(420).damping(32)}
        exiting={reduced ? undefined : FadeOutDown.duration(160)}
        style={styles.toast}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.diamond} />
        <Text variant="label" style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.action ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              toast.action?.onPress();
              hide(toast.id);
            }}
            hitSlop={8}
            style={styles.action}
          >
            <Text variant="label" tone="gold200">
              {toast.action.label}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 52,
    backgroundColor: scrim.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold600,
    maxWidth: 520,
    width: "100%",
  },
  diamond: { width: 6, height: 6, backgroundColor: palette.gold300, transform: [{ rotate: "45deg" }] },
  message: { flex: 1, paddingVertical: 12 },
  action: { minHeight: 44, minWidth: 44, justifyContent: "center", paddingHorizontal: 10 },
});
