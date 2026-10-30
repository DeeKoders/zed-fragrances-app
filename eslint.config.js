// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const HEX = String.raw`#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b`;
const RGB = String.raw`\brgba?\s*\(`;
const message =
  "Colour literals belong in src/config, src/data or src/theme. Use palette tokens or useThemeColor() instead.";

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".export-check/*", "node_modules/*", "scripts/*", "expo-env.d.ts"],
  },
  {
    // The React Compiler is off (app.json), so its lint rules don't apply. Reanimated shared values
    // are mutated by design.
    rules: {
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
    },
  },
  {
    // Colours come only from the theme: no hex or rgb() literals in components, screens or libs.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/config/**", "src/data/**", "src/theme/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=/${HEX}/]`, message },
        { selector: `Literal[value=/${RGB}/i]`, message },
        { selector: `TemplateElement[value.raw=/${HEX}/]`, message },
        { selector: `TemplateElement[value.raw=/${RGB}/i]`, message },
      ],
    },
  },
]);
