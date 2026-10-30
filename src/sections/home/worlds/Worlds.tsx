import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { Chapter } from "./Chapter";

type WorldsProps = {
  width: number;
  height: number;
  scrollY: SharedValue<number>;
  time: SharedValue<number>;
  /** Lay chapters out in flow (reduced motion, very large text). */
  flow: boolean;
  /** Reports each chapter's top and height in the scroll content, for scroll-driven theming. */
  onChapters: (chapters: { top: number; height: number }[]) => void;
};

/** "The Worlds": one scroll-driven chapter per product, generated from the data. */
export function Worlds({ width, height, scrollY, time, flow, onChapters }: WorldsProps) {
  const [origin, setOrigin] = useState(0);
  const [boxes, setBoxes] = useState<{ top: number; height: number }[]>([]);

  const report = (index: number, top: number, boxHeight: number) => {
    setBoxes((current) => {
      if (current[index]?.top === top && current[index]?.height === boxHeight) return current;
      const next = [...current];
      next[index] = { top, height: boxHeight };
      return next;
    });
  };

  useEffect(() => {
    if (boxes.filter(Boolean).length === products.length) {
      onChapters(boxes.map((box) => ({ top: origin + box.top, height: box.height })));
    }
  }, [boxes, origin, onChapters]);

  return (
    <View
      onLayout={(event) => setOrigin(event.nativeEvent.layout.y)}
    >
      <Text variant="h2" accessibilityRole="header" style={styles.hidden}>
        {brand.copy.worlds.title}
      </Text>
      {products.map((product, index) => (
        <View key={product.slug} onLayout={(event) => report(index, event.nativeEvent.layout.y, event.nativeEvent.layout.height)}>
          <Chapter
            product={product}
            index={index}
            total={products.length}
            width={width}
            height={height}
            top={origin + (boxes[index]?.top ?? 0)}
            scrollY={scrollY}
            time={time}
            reduced={flow}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" },
});
