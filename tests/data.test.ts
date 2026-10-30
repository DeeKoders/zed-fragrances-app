import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { quiz } from "@/data/quiz";
import { reviews } from "@/data/reviews";

const ICONS = ["lotus", "clock", "diamond", "leaves", "crown", "bottle", "lion", "shield", "flame"];

describe("catalogue data", () => {
  it("has unique, valid slugs", () => {
    const slugs = products.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(slug).not.toBe("house");
    }
  });

  it.each(products.map((product) => [product.name, product] as const))("%s is complete", (_, product) => {
    expect(product.name).toBeTruthy();
    expect(product.inspiredBy).toBeTruthy();
    expect(product.tagline).toBeTruthy();
    expect(product.story.split(/(?<=[.!?])\s+/).length).toBeGreaterThanOrEqual(2);
    expect(["men", "women", "unisex"]).toContain(product.gender);
    expect(product.sizes.length).toBeGreaterThan(0);
    for (const size of product.sizes) {
      expect(size.ml).toBeGreaterThan(0);
      expect(size.price).toBeGreaterThanOrEqual(0);
    }
    expect(product.notes.top.length + product.notes.heart.length + product.notes.base.length).toBeGreaterThan(0);
    for (const level of [product.vibe.longevity, product.vibe.projection]) {
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(5);
    }
    expect(product.features).toHaveLength(4);
    for (const feature of product.features) expect(ICONS).toContain(feature.icon);
    expect(product.emblem).toBeDefined();
    expect(product.images.bottle).toBeDefined();
    expect(product.images.hero).toBeDefined();
    expect(Array.isArray(product.images.gallery)).toBe(true);
    expect(["marble-veins", "lightning", "smoke", "silk", "none"]).toContain(product.theme.texture);
    expect(["warm", "cold"]).toContain(product.theme.mood);
  });

  it("matches the live seed values", () => {
    const [sovereign, dominator] = products;
    expect(sovereign.sizes).toEqual([{ ml: 30, price: 1399, inStock: true }]);
    expect(dominator.sizes).toEqual([{ ml: 30, price: 1499, inStock: true }]);
  });

  it("has a four-step quiz with options and tags", () => {
    expect(quiz).toHaveLength(4);
    for (const step of quiz) {
      expect(step.options.length).toBeGreaterThan(1);
      for (const option of step.options) expect(option.tags.length).toBeGreaterThan(0);
    }
  });

  it("never invents reviews", () => {
    for (const review of reviews) {
      expect(review.text).toBeTruthy();
      if (review.product) expect(products.map((product) => product.slug)).toContain(review.product);
    }
  });

  it("keeps the brand settings shared with the website", () => {
    expect(brand.whatsapp).toBe("923127373848");
    expect(brand.currency).toBe("PKR");
    expect(brand.checkout.deliveryFee).toBe(150);
    expect(brand.checkout.codFee).toBe(50);
    expect(brand.features).toHaveLength(4);
    expect(brand.tabs).toEqual(["index", "finder", "collection", "bag"]);
  });
});
