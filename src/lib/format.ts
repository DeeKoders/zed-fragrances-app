import { brand } from "@/config/brand";

const money = new Intl.NumberFormat(brand.locale, {
  style: "currency",
  currency: brand.currency,
  maximumFractionDigits: 0,
});

/** A price in the configured currency; 0 means "Price on request". */
export function formatPrice(price: number) {
  return price > 0 ? money.format(price) : brand.copy.priceOnRequest;
}

/** Lowest price across a product's sizes (0 if any size is still on request). */
export function fromPrice(sizes: { price: number }[]) {
  const prices = sizes.map((size) => size.price);
  return prices.some((price) => price === 0) ? 0 : Math.min(...prices);
}
