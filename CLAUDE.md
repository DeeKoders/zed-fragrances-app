# ZED Fragrances app: rules for Claude Code

The official iOS / Android app (Expo SDK 58, Expo Router, TypeScript strict). `PROMPT.md` is the full brief; `GUIDE.md` is the owner's step-by-step guide.

## Ground rules
- Never delete, move or rename `PROMPT.md` or `.git`.
- The website repo (`~/Projects/zed-fragrances`) is the reference implementation. Read it; never modify it.
- The orders script (`google-apps-script/Code.gs` in the website repo) is shared. Don't copy or change it; if the app needs a script change, say so.
- You may run only package installs (`npx expo install …`, `npm install -D …`), `npx expo-doctor` and `npm run check`. Never start `npx expo start`, simulators, emulators or EAS builds. No git commands.
- Work efficiently: plan first, keep replies short, don't re-read files or scan either repo in full.
- Where the Expo plugin's defaults (system colours, SF Symbols, stock tab bars and sheets) differ from the brief, the brief wins: the look is the ZED brand, built custom.
- A change isn't done until `npm run check` passes (lint, typecheck, Jest, iOS + Android bundles).

## Core rules (everything is dynamic)
- `src/config/brand.ts` and `src/data/products.ts` are the only places for brand settings, product data, colours and copy. Adding a perfume = one object in `products.ts` + its images. No component changes.
- Every interface string lives in `brand.copy` (shared strings read the same as the website's; app-only ones are marked "App").
- Prices, stock and fees are live (the sheet's Catalogue tab and the script). Bundled values are fallbacks. Read sizes only through `sizesOf()` and fees only through `feesOf()` (`src/lib/catalogue.ts`).
- Colours come only from the theme: `palette` (constant, gold never morphs) and `useThemeColor()` (morphs over 800 ms, silk ease, UI thread). ESLint rejects hex / `rgb()` literals outside `src/config`, `src/data` and `src/theme`.
- Theme validation (invalid colour, duplicate slug, slug `house`, failed AA) fails the tests.
- Every animation respects reduced motion (`useReducedMotion()` from `src/stores/motion.ts`, live). Animate transforms, opacity and colours on the UI thread; never `setState` per frame.
- Never put the script's `SECRET` or any admin code in the app. Only `EXPO_PUBLIC_ORDERS_SCRIPT_URL` and `EXPO_PUBLIC_ORDERS_APP_KEY` (public by design).
- Never recreate the logo or emblems; never use `first-batch-poster` for bottle close-ups; never invent reviews.
