import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { palette } from "@/theme/palette";

function Rule({ flip }: { flip?: boolean }) {
  return (
    <Svg style={styles.rule} height={1} preserveAspectRatio="none" viewBox="0 0 10 1">
      <Defs>
        <LinearGradient id={flip ? "ruleL" : "ruleR"} x1={flip ? "1" : "0"} y1="0" x2={flip ? "0" : "1"} y2="0">
          <Stop offset="0" stopColor={palette.gold400} stopOpacity={0} />
          <Stop offset="1" stopColor={palette.gold400} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="10" height="1" fill={`url(#${flip ? "ruleL" : "ruleR"})`} />
    </Svg>
  );
}

/** Thin gold rule with a small diamond in the centre, as on the posters. */
export function DiamondDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.row, style]}>
      <Rule />
      <View style={styles.diamond} />
      <Rule flip />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { flex: 1, height: 1 },
  diamond: { width: 6, height: 6, transform: [{ rotate: "45deg" }], backgroundColor: palette.gold300 },
});
