# ZED Fragrances: iOS and Android app

The ZED Fragrances storefront as a native app (Expo SDK 58, Expo Router, React Native, Reanimated, Skia). It's standalone: it never calls the website. Both read prices, stock and fees from the same Google Apps Script and send orders to it, so app and website orders land in the same sheet and admin portal. The app has no admin portal and no secrets.

## Running the app

```bash
npm install
cp .env.example .env     # then fill in the two values (see "Configuration")
npx expo start           # scan the QR code with Expo Go (iPhone: Camera app; Android: inside Expo Go)
```

- After editing `.env` or pulling changes: `npx expo start --clear`.
- Judge smoothness with `npx expo start --no-dev --minify` (development mode is slower).
- **Expo Go vs a development build:** everything here runs in Expo Go. Only if you add a library with native code that Expo Go doesn't include do you need a development build (`npx expo install expo-dev-client`, then `eas build --profile development`).
- **`npm run check`** runs ESLint (including the colour-literal rule), the TypeScript check, the Jest tests, and bundles iOS and Android with `expo export` (into the git-ignored `.export-check/`). A change isn't done until it passes.
- `npm run assets` re-copies brand and product images from the website repo (`~/Projects/zed-fragrances`, or set `WEBSITE_REPO`), converts the posters to WebP and regenerates the icon and splash from the official logo.

## Where things live

| What | Where |
|---|---|
| Brand settings, palette, fees (fallbacks), wallet, drop banner, every interface string | `src/config/brand.ts` |
| Products | `src/data/products.ts` |
| Scent Finder questions / reviews | `src/data/quiz.ts`, `src/data/reviews.ts` |
| Theme engine (token generation, AA checks, registry, morphing provider), palette, type scale, motion tokens | `src/theme/` |
| Live catalogue overlay (`sizesOf`, `feesOf`) | `src/lib/catalogue.ts` |
| Orders script client (`fetchCatalogue`, `placeOrder`) | `src/lib/orders.ts` |
| Totals, payment methods, phone check, WhatsApp fallback | `src/lib/checkout.ts` |
| Bag (AsyncStorage `zed-cart`), live catalogue cache, checkout session | `src/stores/` |
| Routes (tabs, product, checkout sheet) | `src/app/` |
| Home sections, Finder, Collection, Bag, Product, Checkout | `src/sections/` |
| UI kit, Skia shaders, textures, product pieces, intro, tab bar | `src/components/` |
| Tests | `tests/` |
| Images | `assets/brand/`, `assets/images/`, `assets/app/` (icon, splash) |

## Adding a new product

1. **Add one object to `src/data/products.ts`** and its images to `assets/images/products/<slug>/`:

   ```ts
   {
     slug: "midnight-oud",                  // lowercase-dashes, unique, never "house"
     name: "Midnight Oud",
     inspiredBy: "Reference Fragrance",
     tagline: "Smoke. Silk. Midnight.",
     story: "Two or three sentences in the brand voice. A second sentence. A third.",
     gender: "unisex",
     concentration: "Eau de Parfum",
     sizes: [{ ml: 30, price: 1599, inStock: true }],   // fallback only: the sheet is live
     notes: { top: ["Bergamot"], heart: ["Rose"], base: ["Oud", "Amber"] },
     vibe: {
       longevity: 5,
       projection: 4,
       seasons: ["autumn", "winter"],
       occasions: ["evening", "celebration"],
       moodTags: ["luxurious", "night", "magnetic"],     // the Scent Finder matches these
     },
     features: [
       { icon: "flame", label: "Long Lasting" },
       { icon: "diamond", label: "Premium Quality" },
       { icon: "crown", label: "Bold & Distinctive" },
       { icon: "shield", label: "Made to Last" },
     ],
     emblem: require("@/assets/brand/emblems/midnight.svg"),
     props: [],                              // ingredient PNGs; [] shows orbs named after the notes
     images: {
       bottle: require("@/assets/images/products/midnight-oud/bottle.png"),  // transparent, 9:20
       hero: require("@/assets/images/products/midnight-oud/hero.webp"),
       gallery: [require("@/assets/images/products/midnight-oud/gallery-1.webp")],
     },
     theme: { accent: "#6B2FBF", texture: "smoke", mood: "warm" },  // accent is the only colour required
   }
   ```

   The theme engine builds its colour world; the hero, chapters, Finder, Collection and product screen pick it up with no component changes. Run `npm run check`: an invalid colour, a duplicate slug or a failed contrast check fails it.
2. **Add one row per size to the sheet's Catalogue tab** (slug, name, ml, price, in stock). Without rows, the app shows the product as sold out once a catalogue has loaded.
3. **Publish an update:** `eas update --channel production` (see `RELEASE.md`).

## Changing brand colours, copy, taglines and the drop banner

All in `src/config/brand.ts`: `palette` (gold stays constant), `houseTheme`, `taglines`, `copy` (keep shared strings identical to the website's `brand.ts`), `dropBanner` (`enabled: false` hides it; set `stock` / `countdownTo` to show the meter and countdown). Then `npm run check` and publish an update.

## Prices, stock and fees

- **Prices and stock:** edit the Catalogue tab in the orders sheet. The app picks it up at launch, when returning to the foreground (at most every 5 minutes) and whenever checkout opens. No app update needed.
- **Delivery and COD fees:**
  1. Change `DELIVERY_FEE` / `COD_FEE` in the website repo's `google-apps-script/Code.gs` and publish a new script version. The website and the app both pick them up.
  2. Update the fallbacks `checkout.deliveryFee` / `checkout.codFee` in `brand.ts` (and the website's `brand.ts`).

## Wallet account, WhatsApp, currency

- **Wallet account** (EasyPaisa / JazzCash number and title): `brand.checkout.wallet`, then publish an update.
- **WhatsApp number:** `brand.whatsapp` (international format, no "+").
- **Currency / locale:** `brand.currency`, `brand.locale`.

## Configuration: the two `EXPO_PUBLIC_ORDERS_*` values

| Name | Value |
|---|---|
| `EXPO_PUBLIC_ORDERS_SCRIPT_URL` | The orders script's `/exec` URL (the website's `ORDERS_SCRIPT_URL`) |
| `EXPO_PUBLIC_ORDERS_APP_KEY` | The script's `APP_KEY` (orders and prices only) |

Locally they live in `.env` (git-ignored). For EAS builds and updates, set them as EAS environment variables for **preview** and **production** (see `RELEASE.md`). They are compiled into the app and public by design; **never** put the script's `SECRET` here. Without them, browsing works with bundled prices and orders fall back to WhatsApp.

## The orders script

It lives in the website repo (`google-apps-script/Code.gs`), with its setup guide in `google-apps-script/README.md` there. The app needs its `?action=catalogue` action and the `APP_KEY` check. Don't copy or change it here: script changes are made in the website repo, where the website and admin portal can be checked with them.

## Images and placeholders

- **Bottles:** `assets/images/products/<slug>/bottle.png`, transparent, 9:20 portrait.
- **Ingredient props:** PNGs in `assets/images/products/<slug>/props/`, listed in the product's `props`. While empty, glowing orbs named after the notes stand in.
- **Gallery / hero:** `hero.webp`, `gallery-*.webp` per product (currently the reference posters).
- **Placeholders to replace:** `assets/brand/emblems/lotus.svg` and `assets/brand/emblems/lion-crowned.svg` are placeholder emblems; replace them with the official ones (keep the file names). Social links in `brand.socials` are placeholders too.
- Never recreate the logo or emblems, and never use `first-batch-poster` for bottle close-ups (its labels contain text errors).
- After the website's images change, `npm run assets` copies them again.

## Building and releasing with EAS

See **`RELEASE.md`** for the full guide and store checklist. In short:

- **Over-the-air updates** (`eas update --channel production`): JavaScript, copy, colours, images and new products. No store review.
- **New store build** (`eas build` + `eas submit`, after bumping `version` in `app.json`): new native libraries, new permissions, a changed icon or splash, or an Expo SDK upgrade.
