import Svg, { Path } from "react-native-svg";
import { palette } from "@/theme/palette";

// Interface line icons (24 box, gold hairline style). Brand emblems and feature icons live elsewhere.

const PATHS = {
  home: ["M12 3l7 9-7 9-7-9z", "M12 8l3.5 4-3.5 4-3.5-4z"],
  finder: ["M12 3v3M12 18v3M3 12h3M18 12h3", "M12 8l1.4 2.6L16 12l-2.6 1.4L12 16l-1.4-2.6L8 12l2.6-1.4z"],
  collection: ["M4 4h6v7H4zM14 4h6v7h-6zM4 15h6v5H4zM14 15h6v5h-6z"],
  bag: ["M5 8h14l-1 12H6z", "M9 8V6a3 3 0 0 1 6 0v2"],
  back: ["M15 5l-7 7 7 7"],
  forward: ["M9 5l7 7-7 7"],
  close: ["M6 6l12 12M18 6L6 18"],
  share: ["M12 15V4", "M8 8l4-4 4 4", "M6 12v7h12v-7"],
  plus: ["M12 6v12M6 12h12"],
  minus: ["M6 12h12"],
  trash: ["M5 7h14", "M9 7V5h6v2", "M7 7l1 13h8l1-13"],
  copy: ["M9 9h10v11H9z", "M5 15V4h10"],
  upload: ["M12 16V5", "M8 9l4-4 4 4", "M5 19h14"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  whatsapp: [
    "M4 20l1.3-4A8 8 0 1 1 8 18.7z",
    "M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2z",
  ],
  compare: ["M8 4v16M16 4v16", "M4 8h8M12 16h8"],
  external: ["M14 5h5v5", "M19 5l-8 8", "M17 14v5H5V7h5"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  color = palette.gold200,
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      {PATHS[name].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
