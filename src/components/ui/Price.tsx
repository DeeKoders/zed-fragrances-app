import { formatPrice } from "@/lib/format";
import { Text, type TextProps } from "./Text";

/** A price in the brand currency; 0 reads "Price on request". Tabular figures. */
export function Price({ value, ...props }: { value: number } & TextProps) {
  return (
    <Text {...props} style={[{ fontVariant: ["tabular-nums"] }, props.style]}>
      {formatPrice(value)}
    </Text>
  );
}
