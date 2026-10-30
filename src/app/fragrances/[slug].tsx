import { useLocalSearchParams } from "expo-router";
import { getProduct } from "@/data/products";
import { NotFoundView } from "@/sections/NotFoundView";
import { ProductView } from "@/sections/product/ProductView";

/** /fragrances/[slug]: the same path as the website. zed://fragrances/sovereign opens it. */
export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const product = typeof slug === "string" ? getProduct(slug.toLowerCase()) : undefined;
  if (!product) return <NotFoundView />;
  return <ProductView key={product.slug} product={product} />;
}
