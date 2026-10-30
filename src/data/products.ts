import type { Product } from "@/types/product";

/**
 * The catalogue. Adding a perfume = adding one object here plus its images in
 * assets/images/products/<slug>/ (and its rows in the sheet's Catalogue tab). Notes are placeholders.
 * Sizes and prices here are bundled fallbacks: live prices and stock come from the catalogue.
 */
export const products: Product[] = [
  {
    slug: "sovereign",
    name: "Sovereign",
    inspiredBy: "Baccarat Rouge 540",
    tagline: "Velvet heat. Ruby light.",
    story:
      "A slow amber glow of saffron and jasmine that settles into amberwood, oud and cedar. Sovereign wears like red velvet after midnight: sweet, warm and impossible to ignore.",
    gender: "unisex",
    concentration: "Eau de Parfum",
    sizes: [{ ml: 30, price: 1399, inStock: true }],
    notes: {
      top: ["Saffron"],
      heart: ["Jasmine"],
      base: ["Amberwood", "Oud", "Cedar"],
    },
    vibe: {
      longevity: 5,
      projection: 4,
      seasons: ["autumn", "winter"],
      occasions: ["evening", "date night", "celebration"],
      moodTags: ["velvet", "night", "luxurious", "magnetic", "sweet-warm"],
    },
    features: [
      { icon: "lotus", label: "Luxury Scent" },
      { icon: "clock", label: "Long Lasting" },
      { icon: "diamond", label: "Premium Quality" },
      { icon: "leaves", label: "Rich & Captivating" },
    ],
    emblem: require("@/assets/brand/emblems/lotus.svg"),
    props: [],
    images: {
      bottle: require("@/assets/images/products/sovereign/bottle.png"),
      hero: require("@/assets/images/reference/sovereign-poster.webp"),
      poster: require("@/assets/images/reference/sovereign-poster.webp"),
      gallery: [
        require("@/assets/images/reference/sovereign-poster.webp"),
        require("@/assets/images/reference/duo-banner.webp"),
      ],
    },
    theme: {
      accent: "#B3122E",
      accentAlt: "#4A0A16",
      glow: "#E8364A",
      texture: "marble-veins",
      mood: "warm",
    },
  },
  {
    slug: "dominator",
    name: "Dominator",
    inspiredBy: "Office for Men",
    tagline: "Cold steel. Clear power.",
    story:
      "A crack of lime and black pepper over aromatic spice, grounded in woods and worn leather. Dominator is the sharp collar and the steady handshake: fresh, electric and in control.",
    gender: "men",
    concentration: "Eau de Parfum",
    sizes: [{ ml: 30, price: 1499, inStock: true }],
    notes: {
      top: ["Lime", "Black Pepper"],
      heart: ["Aromatic Spices"],
      base: ["Woods", "Leather"],
    },
    vibe: {
      longevity: 4,
      projection: 4,
      seasons: ["spring", "summer", "autumn"],
      occasions: ["office", "daytime", "meetings"],
      moodTags: ["powerful", "fresh", "office", "confident", "electric"],
    },
    features: [
      { icon: "crown", label: "Long Lasting" },
      { icon: "bottle", label: "Bold & Distinctive" },
      { icon: "diamond", label: "Premium Quality" },
      { icon: "lion", label: "Confidence in Every Spray" },
    ],
    emblem: require("@/assets/brand/emblems/lion-crowned.svg"),
    props: [],
    images: {
      bottle: require("@/assets/images/products/dominator/bottle.png"),
      hero: require("@/assets/images/reference/dominator-poster.webp"),
      poster: require("@/assets/images/reference/dominator-poster.webp"),
      gallery: [
        require("@/assets/images/reference/dominator-poster.webp"),
        require("@/assets/images/reference/duo-banner.webp"),
      ],
    },
    theme: {
      accent: "#1F4BFF",
      accentAlt: "#0A1640",
      glow: "#5B8CFF",
      texture: "lightning",
      mood: "cold",
    },
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
