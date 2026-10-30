import type { BottomTabBarProps } from "expo-router/tabs";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { haptics } from "@/lib/haptics";
import { selectCount, useCart } from "@/stores/cart";
import { useReducedMotion } from "@/stores/motion";
import { spring } from "@/theme/motion";
import { palette } from "@/theme/palette";
import { useThemeColor } from "@/theme/ThemeProvider";
import type { TabRoute } from "@/types/brand";

const ICONS: Record<TabRoute, IconName> = { index: "home", finder: "finder", collection: "collection", bag: "bag" };
const copy = brand.copy;

/**
 * The custom tab bar: ink with a hairline gold rule on top. A gold diamond slides to the active
 * tab, haloed in the morphing accent. The Bag tab shows the item count and bumps when it grows.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabWidth = width / Math.max(1, count);
  const position = useSharedValue(state.index);
  const halo = useThemeColor("accentGlow");

  useEffect(() => {
    position.value = reduced ? state.index : withSpring(state.index, spring.snap);
  }, [state.index, reduced, position]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * tabWidth + tabWidth / 2 - 5 }, { rotate: "45deg" }],
    shadowColor: halo.value,
  }));

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Svg style={styles.rule} height={1} width="100%" preserveAspectRatio="none" viewBox="0 0 10 1">
        <Defs>
          <LinearGradient id="tabRule" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.gold600} stopOpacity={0.15} />
            <Stop offset="0.5" stopColor={palette.gold300} stopOpacity={0.9} />
            <Stop offset="1" stopColor={palette.gold600} stopOpacity={0.15} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="10" height="1" fill="url(#tabRule)" />
      </Svg>
      {width > 0 ? <Animated.View style={[styles.indicator, indicator]} /> : null}
      <View style={styles.row} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const name = route.name as TabRoute;
          const label = copy.tabs[name] ?? descriptors[route.key]?.options.title ?? route.name;
          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptics.selection();
              navigateToTab(route.key);
            }
          };
          return (
            <Tab key={route.key} name={name} label={label} focused={focused} onPress={onPress} index={index} total={count} />
          );
        })}
      </View>
    </View>
  );
}

function Tab({
  name,
  label,
  focused,
  onPress,
  index,
  total,
}: {
  name: TabRoute;
  label: string;
  focused: boolean;
  onPress: () => void;
  index: number;
  total: number;
}) {
  const itemCount = useCart(selectCount);
  const isBag = name === "bag";
  const a11yLabel = isBag && itemCount > 0 ? `${label}, ${itemCount} ${copy.cart.items}` : label;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={a11yLabel}
      accessibilityHint={`${index + 1} / ${total}`}
      style={styles.tab}
    >
      <View>
        <Icon name={ICONS[name]} size={22} color={focused ? palette.gold200 : palette.ivoryMuted} />
        {isBag ? <BagBadge count={itemCount} /> : null}
      </View>
      <Text variant="micro" tone={focused ? "gold200" : "ivoryMuted"} numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

function BagBadge({ count }: { count: number }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const previous = useRef(count);
  useEffect(() => {
    if (count > previous.current && !reduced) {
      scale.value = withSequence(withTiming(1.45, { duration: 140 }), withSpring(1, spring.magnet));
    }
    previous.current = count;
  }, [count, reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (count === 0) return null;
  return (
    <Animated.View style={[styles.badge, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text variant="micro" tone="ink950" style={styles.badgeText} maxFontSizeMultiplier={1}>
        {count > 99 ? "99" : count}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: palette.ink950, paddingTop: 8 },
  rule: { position: "absolute", top: 0, left: 0, right: 0 },
  indicator: {
    position: "absolute",
    top: -5,
    left: 0,
    width: 10,
    height: 10,
    backgroundColor: palette.gold300,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  row: { flexDirection: "row" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52, gap: 4, paddingTop: 6 },
  label: { letterSpacing: 2.2, fontSize: 10 },
  badge: {
    position: "absolute",
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: palette.gold300,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, letterSpacing: 0, lineHeight: 13 },
});
