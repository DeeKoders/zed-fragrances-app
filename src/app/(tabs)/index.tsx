import { useIsFocused } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ScrollContext } from "@/components/motion/ScrollContext";
import { Atmosphere } from "@/components/shaders/Atmosphere";
import { products } from "@/data/products";
import { DropBanner } from "@/sections/home/DropBanner";
import { FeatureStrip } from "@/sections/home/FeatureStrip";
import { FinderTeaser } from "@/sections/home/FinderTeaser";
import { Footer } from "@/sections/home/Footer";
import { Hero } from "@/sections/home/hero/Hero";
import { Marquee } from "@/sections/home/Marquee";
import { Reviews } from "@/sections/home/Reviews";
import { Worlds } from "@/sections/home/worlds/Worlds";
import { useReducedMotion } from "@/stores/motion";
import { palette } from "@/theme/palette";
import { useTheme } from "@/theme/ThemeProvider";
import { HOUSE_THEME } from "@/theme/types";

type Box = { top: number; height: number };

/**
 * Home: one vertical scroll. Hero → marquee → the worlds → Scent Finder teaser → drop banner →
 * feature strip → reviews → footer. The theme follows the chapter holding the middle of the
 * screen; the atmosphere shader runs only where no opaque section covers it.
 */
export default function HomeScreen() {
  const { width, height: windowHeight, fontScale } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const height = windowHeight - tabBarHeight;
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const flow = reduced || fontScale > 1.35;
  const { setTheme } = useTheme();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scrollRef);
  const scrollContext = useMemo(() => ({ scrollY }), [scrollY]);

  const boxes = useSharedValue<Box[]>([]);
  const activeChapter = useSharedValue(-2);
  const covered = useSharedValue(true);
  const worldTime = useSharedValue(0);

  const onChapters = useCallback(
    (chapters: Box[]) => {
      boxes.value = chapters;
    },
    [boxes],
  );

  const onChapter = useCallback(
    (index: number) => setTheme(index < 0 ? HOUSE_THEME : (products[index]?.slug ?? HOUSE_THEME)),
    [setTheme],
  );

  // Theme and atmosphere follow the scroll position (UI thread; React only hears about changes).
  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      const chapters = boxes.value;
      let index = activeChapter.value;
      if (chapters.length === 0 || y < chapters[0].top - height * 0.55) index = -1;
      else {
        for (let i = 0; i < chapters.length; i++) {
          const box = chapters[i];
          if (y >= box.top - height * 0.55 && y < box.top + box.height - height * 0.45) index = i;
        }
      }
      if (index !== activeChapter.value) {
        activeChapter.value = index;
        scheduleOnRN(onChapter, index);
      }
      const heroCovers = y < height * 0.9;
      const chapterCovers = !flow && chapters.some((box) => y >= box.top && y + height <= box.top + box.height);
      covered.value = heroCovers || chapterCovers;
    },
    [height, flow, onChapter],
  );

  // One clock for the worlds' textures and bokeh, running only while a chapter is on screen.
  const frame = useFrameCallback((info) => {
    const y = scrollY.value;
    const visible = boxes.value.some((box) => y + height > box.top && y < box.top + box.height);
    if (visible) worldTime.value += Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
  }, false);
  useEffect(() => {
    frame.setActive(focused && !reduced);
  }, [focused, reduced, frame]);

  const [heroHeight] = useState(() => Math.max(560, height));

  return (
    <View style={styles.root}>
      <Atmosphere covered={covered} scrollY={scrollY} />
      <ScrollContext.Provider value={scrollContext}>
        <Animated.ScrollView
          ref={scrollRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          decelerationRate="normal"
        >
          <Hero width={width} height={heroHeight} scrollY={scrollY} />
          <Marquee scrollY={scrollY} />
          <Worlds width={width} height={height} scrollY={scrollY} time={worldTime} flow={flow} onChapters={onChapters} />
          <FinderTeaser />
          <DropBanner />
          <FeatureStrip />
          <Reviews />
          <Footer />
        </Animated.ScrollView>
      </ScrollContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink950 },
});
