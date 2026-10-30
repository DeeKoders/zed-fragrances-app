export type Level = 1 | 2 | 3 | 4 | 5;

export type TextureKind = "marble-veins" | "lightning" | "smoke" | "silk" | "none";

export type Mood = "warm" | "cold";

/** A bundled image: what `require("…png")` returns. React Native can't load images from dynamic string paths. */
export type ImageSource = number;

/** A product's colour world. `accent` is the only colour required; the theme engine derives the rest. */
export type ThemeSpec = {
  accent: string;
  accentAlt?: string;
  glow?: string;
  texture: TextureKind;
  mood: Mood;
};

/** Keys of the line icons used in feature strips. */
export type FeatureIcon =
  | "lotus"
  | "clock"
  | "diamond"
  | "leaves"
  | "crown"
  | "bottle"
  | "lion"
  | "shield"
  | "flame";

export type ProductSize = { ml: number; price: number; inStock: boolean };

export type Product = {
  /** Unique, lowercase-dashes, never "house". */
  slug: string;
  name: string;
  inspiredBy: string;
  tagline: string;
  /** 2–3 sentence mood description. */
  story: string;
  gender: "men" | "women" | "unisex";
  concentration: string;
  /**
   * Bundled fallback only: live prices and stock come from the catalogue. Read sizes through
   * sizesOf() (src/lib/catalogue.ts), never from here. A price of 0 renders as "Price on request".
   */
  sizes: ProductSize[];
  notes: { top: string[]; heart: string[]; base: string[] };
  vibe: {
    longevity: Level;
    projection: Level;
    seasons: string[];
    occasions: string[];
    moodTags: string[];
  };
  /** 4 items. */
  features: { icon: FeatureIcon; label: string }[];
  /** The emblem artwork, e.g. require("@/assets/brand/emblems/lotus.svg"). */
  emblem: ImageSource;
  /** Ingredient PNGs for the parallax layers; [] shows placeholder orbs named after the notes. */
  props: ImageSource[];
  images: {
    /** Transparent bottle cutout, 9:20 portrait. */
    bottle: ImageSource;
    hero: ImageSource;
    poster?: ImageSource;
    gallery: ImageSource[];
    /** Alt text overrides; sensible defaults are generated from the product data. */
    alt?: { bottle?: string; hero?: string };
  };
  theme: ThemeSpec;
};
