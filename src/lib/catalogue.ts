import { brand } from "@/config/brand";
import type { Product, ProductSize } from "@/types/product";

// The live catalogue: prices and stock from the sheet's Catalogue tab, fees from the orders script.
// products.ts and brand.checkout only hold bundled fallbacks, used until a catalogue has loaded.
// Read sizes only through sizesOf() and fees only through feesOf().

export type CatalogueItem = { slug: string; name: string; ml: number; price: number; inStock: boolean };

export type Catalogue = {
  currency: string;
  deliveryFee: number;
  codFee: number;
  items: CatalogueItem[];
  /** When this copy was fetched (ms since epoch). */
  fetchedAt: number;
};

export type Fees = { deliveryFee: number; codFee: number };

/** Checkout refreshes a catalogue older than this before showing the amount to send. */
export const CATALOGUE_MAX_AGE = 5 * 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Validates the script's `?action=catalogue` answer (or the `catalogue` sent back with an order error). */
export function parseCatalogue(value: unknown, fetchedAt = Date.now()): Catalogue | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  if (!isAmount(value.deliveryFee) || !isAmount(value.codFee)) return null;
  const items = value.items.flatMap((item): CatalogueItem[] => {
    if (!isRecord(item) || typeof item.slug !== "string") return [];
    const ml = Number(item.ml);
    const price = Number(item.price);
    if (!Number.isFinite(ml) || ml <= 0 || !isAmount(price)) return [];
    return [
      {
        slug: item.slug.trim().toLowerCase(),
        name: typeof item.name === "string" ? item.name : item.slug,
        ml,
        price,
        inStock: item.inStock === true,
      },
    ];
  });
  return {
    currency: typeof value.currency === "string" ? value.currency : brand.currency,
    deliveryFee: value.deliveryFee,
    codFee: value.codFee,
    items,
    fetchedAt,
  };
}

/**
 * A product's sizes with live prices and stock. Without a catalogue: the bundled sizes. With one:
 * its rows for this product, plus any bundled size it doesn't list, which counts as sold out.
 */
export function sizesOf(product: Product, catalogue: Catalogue | null): ProductSize[] {
  if (!catalogue) return product.sizes;
  const live = catalogue.items
    .filter((item) => item.slug === product.slug)
    .map((item) => ({ ml: item.ml, price: item.price, inStock: item.inStock }));
  const missing = product.sizes
    .filter((size) => !live.some((item) => item.ml === size.ml))
    .map((size) => ({ ...size, inStock: false }));
  return [...live, ...missing].sort((a, b) => a.ml - b.ml);
}

/** The first size that can be bought, if any. */
export function firstInStock(product: Product, catalogue: Catalogue | null) {
  return sizesOf(product, catalogue).find((size) => size.inStock);
}

export function feesOf(catalogue: Catalogue | null): Fees {
  return catalogue
    ? { deliveryFee: catalogue.deliveryFee, codFee: catalogue.codFee }
    : { deliveryFee: brand.checkout.deliveryFee, codFee: brand.checkout.codFee };
}

export function isStale(catalogue: Catalogue | null, now = Date.now()) {
  return !catalogue || now - catalogue.fetchedAt > CATALOGUE_MAX_AGE;
}
