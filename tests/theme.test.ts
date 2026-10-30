import { wcagContrast } from "culori";
import { brand } from "@/config/brand";
import { products } from "@/data/products";
import { AA } from "@/theme/contrast";
import { buildThemes } from "@/theme/registry";
import { createThemeTokens, type ThemeBase } from "@/theme/tokens";
import { HOUSE_THEME, THEME_TOKENS } from "@/theme/types";

const base: ThemeBase = {
  surface: brand.palette.ink["700"],
  ivory: brand.palette.ivory,
  ink: brand.palette.ink["950"],
  gold: brand.palette.gold["600"],
};

describe("theme engine", () => {
  const themes = buildThemes();

  it("builds the house theme first, then one per product", () => {
    expect(themes.map((theme) => theme.id)).toEqual([HOUSE_THEME, ...products.map((product) => product.slug)]);
  });

  it("generates every token as a hex colour", () => {
    for (const theme of themes) {
      for (const token of THEME_TOKENS) expect(theme.tokens[token]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("passes AA for accent text on ink-700 and text on the accent", () => {
    for (const { tokens } of themes) {
      expect(wcagContrast(tokens.accentInk, base.surface)).toBeGreaterThanOrEqual(AA);
      expect(wcagContrast(tokens.onAccent, tokens.accent)).toBeGreaterThanOrEqual(AA);
    }
  });

  it("keeps the accent itself at stop 500", () => {
    const sovereign = themes.find((theme) => theme.id === "sovereign");
    expect(sovereign?.tokens.accent).toBe("#b3122e");
    expect(sovereign?.tokens.accent500).toBe("#b3122e");
  });

  it("derives alt and glow when they are missing", () => {
    const tokens = createThemeTokens({ accent: "#2E8B57", texture: "silk", mood: "cold" }, base, "Test");
    expect(tokens.accentAlt).toMatch(/^#[0-9a-f]{6}$/i);
    expect(tokens.accentGlow).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("rejects an invalid colour", () => {
    expect(() => createThemeTokens({ accent: "not-a-colour", texture: "none", mood: "warm" }, base, "Bad")).toThrow(
      /not a valid colour/,
    );
  });

  it("rejects duplicate slugs and the reserved slug", () => {
    const original = [...products];
    try {
      products.push({ ...products[0] });
      expect(() => buildThemes()).toThrow(/Duplicate theme id/);
      products.splice(0, products.length, ...original, { ...original[0], slug: HOUSE_THEME });
      expect(() => buildThemes()).toThrow(/Duplicate theme id/);
      products.splice(0, products.length, ...original, { ...original[0], slug: "Not A Slug" });
      expect(() => buildThemes()).toThrow(/not a valid slug/);
    } finally {
      products.splice(0, products.length, ...original);
    }
  });
});
