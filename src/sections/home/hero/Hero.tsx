import type { SharedValue } from "react-native-reanimated";
import { products } from "@/data/products";
import type { Product } from "@/types/product";
import { OrbitHero } from "./OrbitHero";
import { SplitHero } from "./SplitHero";

/** Two products: the split world. Any other count: the orbit (one product: a single still world). */
export function Hero({ width, height, scrollY }: { width: number; height: number; scrollY: SharedValue<number> }) {
  if (products.length === 2) {
    return <SplitHero products={products as [Product, Product]} width={width} height={height} scrollY={scrollY} />;
  }
  return <OrbitHero products={products} width={width} height={height} scrollY={scrollY} />;
}
