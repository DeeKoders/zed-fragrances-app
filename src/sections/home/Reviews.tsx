import { StyleSheet, View } from "react-native";
import { Reveal, RevealText } from "@/components/motion/Reveal";
import { Text } from "@/components/ui/Text";
import { brand } from "@/config/brand";
import { getProduct } from "@/data/products";
import { reviews } from "@/data/reviews";
import { palette } from "@/theme/palette";

const copy = brand.copy.reviews;

/** Customer reviews from reviews.ts. Hidden while it's empty (reviews are never invented). */
export function Reviews() {
  if (reviews.length === 0) return null;
  return (
    <View style={styles.root}>
      <Text variant="micro" tone="gold300">
        {copy.eyebrow}
      </Text>
      <RevealText text={copy.title} variant="h2" />
      {reviews.map((review, index) => (
        <Reveal key={`${review.name}-${index}`} delay={index * 80}>
          <View style={styles.card} accessible accessibilityLabel={`${review.rating} / 5. ${review.text} ${review.name}`}>
            <Text variant="label" tone="gold300">
              {"◆".repeat(review.rating)}
            </Text>
            <Text variant="editorial">“{review.text}”</Text>
            <Text variant="micro" tone="ivoryMuted">
              {[review.name, review.location, review.product ? getProduct(review.product)?.name : undefined].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </Reveal>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 16, paddingVertical: 40, gap: 16 },
  card: { gap: 10, padding: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.gold800 },
});
