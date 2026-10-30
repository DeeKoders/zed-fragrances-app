import { Cinzel_500Medium, Cinzel_600SemiBold, Cinzel_700Bold } from "@expo-google-fonts/cinzel";
import { CormorantGaramond_400Regular_Italic, CormorantGaramond_500Medium_Italic } from "@expo-google-fonts/cormorant-garamond";
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Asset } from "expo-asset";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import { DarkTheme, Stack, ThemeProvider as NavigationTheme } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CatalogueSync } from "@/components/layout/CatalogueSync";
import { GrainOverlay } from "@/components/layout/GrainOverlay";
import { Intro } from "@/components/layout/Intro";
import { Toast } from "@/components/layout/Toast";
import { products } from "@/data/products";
import { useIntro } from "@/stores/intro";
import { useMotionStore, watchReducedMotion } from "@/stores/motion";
import { palette } from "@/theme/palette";
import { ThemeProvider } from "@/theme/ThemeProvider";

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.ink950,
    card: palette.ink950,
    border: palette.line,
    primary: palette.gold300,
    text: palette.ivory,
    notification: palette.gold300,
  },
};

/** True when the app was opened by a link to anything but Home (the intro is skipped then). */
async function openedFromDeepLink() {
  try {
    const url = await Linking.getInitialURL();
    if (!url) return false;
    const { path } = Linking.parse(url);
    return Boolean(path && path.replace(/^\/+|\/+$/g, "").length > 0);
  } catch {
    return false;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const motionKnown = useMotionStore((state) => state.known);
  const status = useIntro((state) => state.status);
  const advance = useIntro((state) => state.advance);
  const ready = (fontsLoaded || fontError !== null) && status !== "pending";

  useEffect(() => watchReducedMotion(), []);

  // Bottles show on every screen: decode them while the splash is up.
  useEffect(() => {
    void Asset.loadAsync(products.map((product) => product.images.bottle)).catch(() => undefined);
  }, []);

  // Decide the intro once the system's motion setting is known: once per cold start, never with
  // reduced motion or when the app opens from a deep link.
  useEffect(() => {
    if (!motionKnown || status !== "pending") return;
    let cancelled = false;
    void openedFromDeepLink().then((deepLink) => {
      if (cancelled) return;
      advance(useMotionStore.getState().reduced || deepLink ? "done" : "playing");
    });
    return () => {
      cancelled = true;
    };
  }, [motionKnown, status, advance]);

  const onLayout = useCallback(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayout}>
      <ThemeProvider>
        <NavigationTheme value={navigationTheme}>
          <StatusBar style="light" />
          <CatalogueSync />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ink950 } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="fragrances/[slug]" options={{ animation: "fade", animationDuration: 260 }} />
            <Stack.Screen name="checkout" options={{ presentation: "modal", contentStyle: { backgroundColor: palette.ink900 } }} />
            <Stack.Screen name="+not-found" options={{ animation: "fade" }} />
          </Stack>
          <Toast />
          <GrainOverlay />
          <Intro />
        </NavigationTheme>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink950 },
});
