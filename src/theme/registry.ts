import { brand } from "@/config/brand";
import { products } from "@/data/products";
import type { ThemeSpec } from "@/types/product";
import { assertContrast } from "./contrast";
import { createThemeTokens, type ThemeBase } from "./tokens";
import { HOUSE_THEME, type ThemeMeta } from "./types";

// Builds every theme once, at startup. An invalid colour, a duplicate slug, the reserved slug
// "house" or a failed AA check throws, and so fails `npm run check` (tests/theme.test.ts).

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkPalette() {
  const { ink, ivory, ivoryMuted, gold } = brand.palette;
  assertContrast(ivory, ink["700"], "palette ivory");
  assertContrast(ivoryMuted, ink["700"], "palette ivoryMuted");
  assertContrast(gold["400"], ink["700"], "palette gold-400");
}

export function buildThemes(): ThemeMeta[] {
  checkPalette();

  const { palette } = brand;
  const base: ThemeBase = {
    surface: palette.ink["700"],
    ivory: palette.ivory,
    ink: palette.ink["950"],
    gold: palette.gold["600"],
  };

  const entries: { id: string; name: string; spec: ThemeSpec }[] = [
    { id: HOUSE_THEME, name: brand.name, spec: brand.houseTheme },
    ...products.map((product) => ({ id: product.slug, name: product.name, spec: product.theme })),
  ];

  const seen = new Set<string>();
  for (const { id } of entries) {
    if (!SLUG.test(id)) throw new Error(`[theme] "${id}" is not a valid slug (lowercase letters, digits, dashes).`);
    if (seen.has(id)) {
      throw new Error(`[theme] Duplicate theme id "${id}". Product slugs must be unique and "${HOUSE_THEME}" is reserved.`);
    }
    seen.add(id);
  }

  return entries.map(({ id, name, spec }) => ({
    id,
    name,
    tokens: createThemeTokens(spec, base, name),
    texture: spec.texture,
    mood: spec.mood,
  }));
}

let cache: ThemeMeta[] | undefined;

/** Every theme: the house world first, then one per product. */
export function getThemes() {
  cache ??= buildThemes();
  return cache;
}

/** A theme by id, falling back to the house world. */
export function getTheme(id: string): ThemeMeta {
  const themes = getThemes();
  return themes.find((theme) => theme.id === id) ?? themes[0];
}
