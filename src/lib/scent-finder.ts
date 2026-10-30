import type { Product } from "@/types/product";
import type { QuizStep } from "@/types/content";

export type FinderResult = { product: Product; score: number; match: number };

const tagsOf = (product: Product) =>
  new Set(
    [...product.vibe.moodTags, ...product.vibe.seasons, ...product.vibe.occasions, product.theme.mood].map((tag) =>
      tag.toLowerCase(),
    ),
  );

/**
 * Scores every product against the chosen options (index per step). Each matching tag adds the
 * step's weight; `match` is the share of the best possible score for those answers, as a percentage.
 * Ties go to the earlier product in the catalogue.
 */
export function rankProducts(products: Product[], steps: QuizStep[], answers: number[]): FinderResult[] {
  const chosen = answers.map((option, step) => ({ option: steps[step]?.options[option], weight: steps[step]?.weight ?? 1 }));
  const best = chosen.reduce((total, { option, weight }) => total + (option ? option.tags.length * weight : 0), 0) || 1;

  return products
    .map((product) => {
      const tags = tagsOf(product);
      const score = chosen.reduce(
        (total, { option, weight }) =>
          total + (option ? option.tags.filter((tag) => tags.has(tag.toLowerCase())).length * weight : 0),
        0,
      );
      return { product, score, match: Math.round(Math.min(1, score / best) * 100) };
    })
    .sort((a, b) => b.score - a.score);
}
