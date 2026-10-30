import { Tabs } from "expo-router/tabs";
import { TabBar } from "@/components/layout/TabBar";
import { brand } from "@/config/brand";
import { palette } from "@/theme/palette";

/** Home, Scent Finder, Collection and Bag, with the custom gold tab bar. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.ink950 }, animation: "fade" }}
    >
      {brand.tabs.map((route) => (
        <Tabs.Screen key={route} name={route} options={{ title: brand.copy.tabs[route] }} />
      ))}
    </Tabs>
  );
}
