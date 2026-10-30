# ZED Fragrances: Mobile App Build Brief

You are building the official iOS and Android app for ZED Fragrances, a luxury "inspired-by" perfume brand. The website is already live at https://zed-fragrances.netlify.app.

The website's source code is the reference implementation for this app. The app keeps the same:
- brand, products, copy and theme engine;
- Scent Finder;
- checkout and ordering.

Rebuild all of it as a native app designed for phones, not a website in a wrapper.

**The app is standalone.** It never calls the website. Both talk to the same Google Apps Script web app and Google Sheet (section 7):
- **Prices, stock and fees:** both read them from it, so they always show the same values.
- **Orders:** both send them to it. The script prices every order itself.
- **Handling orders:** app and website orders sit side by side and are handled in the same admin portal.

The app is for customers only. It has **no admin portal**. Orders are handled on the website's private `/admin` page, and none of that code, text or configuration goes into the app.

The catalogue currently has 2 products, SOVEREIGN and DOMINATOR. More will be added later, so products, colours, copy and imagery must all stay data-driven.

---

## 0. Project context (read first)

- **Environment:** macOS, Node.js installed, npm as the package manager.
- **This folder:**
  - It is `~/Projects/zed-fragrances-app` and contains `PROMPT.md` (this file).
  - It may also contain an initialized git repo (`.git`).
  - Never delete, move or rename either of them.
- **The website repo:**
  - It is at `~/Projects/zed-fragrances`. Read it for exact behaviour, data and timings.
  - Never modify it.
  - Section 2 lists the files that matter.
- **The orders script is shared:**
  - It lives in the website repo (`google-apps-script/Code.gs`) and already handles app orders and the catalogue.
  - Don't copy or change it.
  - If the app ever needs a script change, tell me; it gets made in the website repo, where the website and admin portal can be checked with it.
- **Scaffolding:** create-expo-app wants an empty folder.
  1. Scaffold into a temporary folder.
  2. Move the files into this folder, keeping `PROMPT.md` and `.git`.
  3. Delete the temporary folder.
  4. Remove the template's example screens and assets.
- **Usage limits:** I'm on a Claude Pro plan, so work efficiently:
  - plan before coding;
  - keep replies short;
  - don't re-read files you've already read in this session;
  - don't scan either repo in full.
- **What you may run:**
  - I run the dev server (`npx expo start`) and test on my own phones.
  - Never start long-running processes, simulators, emulators or EAS builds.
  - You may only run package installs (`npx expo install …`, `npm install -D …`), `npx expo-doctor` and `npm run check` (defined in Phase 1).
- **Expo plugin:** the official Expo plugin for Claude Code is installed.
  - Use its skills for Expo mechanics, starting with `expo-overview`. The most relevant are `expo-web-to-native`, `expo-router`, `expo-animation`, `eas-app-stores` and `eas-update`.
  - **Where its defaults differ from this brief, the brief wins.** That covers system colours, SF Symbols, stock sheets and tab bars, Apple-style screens and folder layout: the look is the ZED brand, built custom.
- **Git:** I handle it myself. Don't run git commands.
- **Phases:** work strictly phase by phase (section 11). Stop after each phase and wait for me.

---

## 1. What the app is, and what it isn't

**It is the website's storefront as a native app:**
- the intro;
- the split-world hero;
- the scroll-driven product worlds;
- the Scent Finder;
- the collection with compare;
- the drop banner, feature strip, reviews and footer content;
- product screens;
- the bag;
- the same two-step checkout: EasyPaisa / JazzCash with a payment screenshot, or Cash on Delivery.

**Orders:** they go directly to the Apps Script web app (section 7). They land in the same Google Sheet and Drive folder, trigger the same order emails, and appear in the website's admin portal.

**It isn't, and must never contain:**
- an admin portal, any admin screen, or any sign-in;
- order management;
- the script's `SECRET` (the website's `ORDERS_SCRIPT_SECRET`);
- `ADMIN_PASSWORD`;
- any other secret.

The app bundle is public: anything inside it can be extracted. The app only carries the script URL and an app-only key that can do nothing except read prices and place orders (section 7).

---

## 2. The website as the reference

| What | Website file | In the app |
|---|---|---|
| Brand settings and every interface string | `src/config/brand.ts` | Copy it, then adapt it (section 4) |
| Catalogue | `src/data/products.ts` | Copy it. Image paths become `require()` sources |
| Scent Finder questions | `src/data/quiz.ts` | Copy verbatim |
| Reviews | `src/data/reviews.ts` | Copy verbatim (it's empty; never invent reviews) |
| Types | `src/types/*.ts` | Copy, and change image fields to image sources |
| Theme engine | `src/lib/theme/tokens.ts`, `contrast.ts`, `types.ts`, `css.ts` | Port the logic. Tokens become a JS object instead of CSS variables |
| Motion tokens | `src/lib/motion.ts` | Port (section 4) |
| Totals, payment methods, phone check, WhatsApp fallback message | `src/lib/checkout.ts` | Port verbatim, except `placeOrder` (section 7) |
| Price formatting | `src/lib/format.ts` | Copy verbatim |
| WhatsApp links | `src/lib/whatsapp.ts` | Copy verbatim |
| Scent Finder scoring | `src/lib/scent-finder.ts` | Copy verbatim |
| Procedural textures (marble veins, lightning, smoke, silk) | `src/lib/texture.ts` | Copy verbatim. Its SVG path strings draw with Skia |
| Atmosphere and seam shaders | `src/lib/webgl.ts`, `src/components/webgl/*` | Port the GLSL to Skia SkSL |
| Screenshot preparation | `src/lib/screenshot.ts` | Same limits, using native APIs (section 6) |
| Newsletter handler (placeholder) | `src/lib/newsletter.ts` | Copy verbatim |
| Cart store | `src/stores/cart.ts` | Same store and limits, persisted to AsyncStorage |
| Feature icons | `src/components/ui/FeatureIcon.tsx` | Reuse the same path data with react-native-svg |
| Section and component behaviour | `src/sections/**`, `src/components/**` | Read for behaviour, thresholds and timing; rebuild natively |
| Live catalogue (prices, stock, fees) | `src/lib/catalogue.ts`, `src/providers/CatalogueProvider.tsx` | Port: the same parsing, the same `sizesOf` overlay, and refresh rules (section 7) |
| How checkout handles the script's answers | `src/components/cart/CheckoutDialog.tsx` (`submit`, `onDetails`) | Same behaviour (section 6) |
| Orders script and its setup guide | `google-apps-script/Code.gs`, `README.md` | Read only. The live script the app calls (section 7) |
| Logo, emblems, product and reference images | `public/brand/`, `public/images/` | Copy into `assets/` (section 10) |
| Original brand files | `_brand/` | Source of truth if something in `public/` looks wrong |

**Don't port:**
- anything admin: `src/app/admin`, `src/components/admin`, `src/lib/admin`, `src/config/admin.ts`;
- `src/lib/orders-script.ts` and `src/app/api/` (server code holding the secret);
- the SEO files (metadata, sitemap, robots, OG images, JSON-LD);
- the custom cursor;
- Lenis.

---

## 3. Visual language

Same DNA as the website. Study `public/images/reference/` in the website repo before writing any code.

**Base and brand gold:**
- **Base:** near-black and cinematic. High-contrast lighting, warm gold bokeh, reflective black surfaces (wet stone, polished marble).
- **Brand gold:**
  - a metallic gold gradient on the ZED wordmark;
  - "F R A G R A N C E S" in widely tracked caps;
  - dividers are thin gold rules with a small diamond in the centre.
- **Typography:**
  - classical Roman serif caps (Cinzel) for names and headings;
  - Cormorant Garamond italic for editorial lines;
  - Manrope for body and UI;
  - wide letter-spacing on every small label.

**Each product owns a world:**
- **SOVEREIGN:**
  - crimson/ruby + gold;
  - red marble veins, red velvet, ruby crystals, saffron threads, oud wood, white flower;
  - lotus emblem;
  - warm.
- **DOMINATOR:**
  - electric/royal blue + gold;
  - blue lightning cracks, black rock, leather, fountain pen, lime, black pepper;
  - crowned gold lion emblem;
  - cold.

**Bottle:** black glass, a tiered black/chrome cap, and a black label with a gold border, textured in the product's colour.

**Feature strip:** 4 icons separated by thin gold vertical lines.

**Direction:**
- It must not look like a template, a generic Shopify app or a webview.
- Aim for the same Awwwards-level energy as the website, made native:
  - gestures, haptics, sheets;
  - scroll-driven storytelling;
  - a theme that morphs;
  - smooth 60fps motion on the UI thread.

---

## 4. Core rule: everything is dynamic

`src/config/brand.ts` and `src/data/products.ts` are the only places for brand settings, product data, colours and copy. Adding a perfume must require only one new object in `products.ts` plus its images. No component changes.

### Brand config (`src/config/brand.ts`)

Start from the website's `brand.ts`. These values must stay identical to the website's:

| Setting | Value |
|---|---|
| `name` / `shortName` | ZED Fragrances / ZED |
| `siteUrl` | `https://zed-fragrances.netlify.app` (the website link in the footer and in share text) |
| `taglines` | primary "Signature Scents. Distinctive You.", quality "Premium Quality. Timeless Scents.", drop "First Batch Ready", urgency "Limited Stock. Grab Yours Before It Ends." |
| `palette.ink` | 950 `#050505`, 900 `#0B0A09`, 800 `#14120F`, 700 `#1F1B16` |
| `palette.line` / `ivory` / `ivoryMuted` | `#2B261F` / `#F2EAD8` / `#B5AA95` |
| `palette.gold` | 100 `#F8E9B8`, 200 `#EED48A`, 300 `#E2BE62`, 400 `#D4A848`, 500 `#C5963A`, 600 `#A6782A`, 700 `#7F5A1E`, 800 `#5A3F15`, 900 `#33240C` |
| `houseTheme` | accent gold-500, texture smoke, mood warm |
| `whatsapp` | `923127373848` (international format, no "+") |
| `currency` / `locale` | `PKR` / `en-PK` |
| `checkout.deliveryFee` | 150 (fallback; the live value comes from the script) |
| `checkout.codFee` | 50 (fallback; the live value comes from the script) |
| `checkout.wallet` | providers EasyPaisa and JazzCash, account number `0312-7373848`, account title `Danyal Ahmad` |
| `dropBanner` | enabled, eyebrow "First Batch Ready", text "Limited Stock. Grab yours before it ends.", `stock: null`, `countdownTo: null`, image `first-batch-poster.png` (mood only) |
| `socials` | Instagram, TikTok, Facebook (placeholder URLs, same as the website) |
| `features` | lotus "Luxury Scent", clock "Long Lasting", diamond "Premium Quality", leaves "Rich & Captivating" |
| `disclaimer` | "ZED Fragrances is not affiliated with or endorsed by the brands referenced. Names are used for comparison only; all trademarks belong to their respective owners." |

**`copy`:**
- Copy the website's `copy` object verbatim. Every string the two share must read the same.
- Remove the web-only entries: `skipToContent`, `cursor`, and the `nav` labels that only make sense on the web.
- Add app-only strings to the same object, never in components:
  - tab labels;
  - Share;
  - "Added to bag" and "View bag";
  - photo-access-denied help;
  - the offline message;
  - prices changed, sold out and too many orders;
  - the app version label.

**Remove `googleSiteVerification`.** The website's `nav` becomes the tab configuration.

### Product schema

The same as the website (`src/types/product.ts`), except images are bundled sources. React Native can't load images from dynamic string paths.

```ts
type Product = {
  slug: string;                 // unique, lowercase-dashes, never "house"
  name: string;
  inspiredBy: string;
  tagline: string;
  story: string;                // 2–3 sentences
  gender: "men" | "women" | "unisex";
  concentration: string;
  sizes: { ml: number; price: number; inStock: boolean }[]; // price 0 = "Price on request"
  notes: { top: string[]; heart: string[]; base: string[] };
  vibe: {
    longevity: 1 | 2 | 3 | 4 | 5;
    projection: 1 | 2 | 3 | 4 | 5;
    seasons: string[];
    occasions: string[];
    moodTags: string[];
  };
  features: { icon: FeatureIcon; label: string }[]; // 4 items; icons: lotus, clock, diamond, leaves, crown, bottle, lion, shield, flame
  emblem: ImageSource;          // require("…/emblems/lotus.svg")
  props: ImageSource[];         // ingredient PNGs; [] = placeholder orbs named after the notes
  images: {
    bottle: ImageSource;        // transparent cutout, 9:20 portrait
    hero: ImageSource;
    poster?: ImageSource;
    gallery: ImageSource[];
    alt?: { bottle?: string; hero?: string }; // defaults generated from the data
  };
  theme: {
    accent: string;             // the only required colour
    accentAlt?: string;
    glow?: string;
    texture: "marble-veins" | "lightning" | "smoke" | "silk" | "none";
    mood: "warm" | "cold";
  };
};
```

### Seed data (copy from the website's `products.ts`; these are the live values)

| | Sovereign | Dominator |
|---|---|---|
| Inspired by | Baccarat Rouge 540 | Office for Men |
| Tagline | Velvet heat. Ruby light. | Cold steel. Clear power. |
| Gender / concentration | unisex / Eau de Parfum | men / Eau de Parfum |
| Sizes | 30 ml, Rs 1,399, in stock | 30 ml, Rs 1,499, in stock |
| Notes | top Saffron; heart Jasmine; base Amberwood, Oud, Cedar | top Lime, Black Pepper; heart Aromatic Spices; base Woods, Leather |
| Longevity / projection | 5 / 4 | 4 / 4 |
| Seasons | autumn, winter | spring, summer, autumn |
| Occasions | evening, date night, celebration | office, daytime, meetings |
| Mood tags | velvet, night, luxurious, magnetic, sweet-warm | powerful, fresh, office, confident, electric |
| Features | lotus Luxury Scent, clock Long Lasting, diamond Premium Quality, leaves Rich & Captivating | crown Long Lasting, bottle Bold & Distinctive, diamond Premium Quality, lion Confidence in Every Spray |
| Emblem | lotus.svg | lion-crowned.svg |
| Theme | accent `#B3122E`, alt `#4A0A16`, glow `#E8364A`, marble-veins, warm | accent `#1F4BFF`, alt `#0A1640`, glow `#5B8CFF`, lightning, cold |
| Images | bottle.png; hero, poster and gallery from the reference posters | same pattern |

Take the `story` text verbatim from the website.

**Live prices and stock (important):**
- Prices and stock live in the **Catalogue** tab of the orders Google Sheet, and the delivery and COD fees live in the script (section 7).
- The script prices every order from them. The website and the app both show the same live values.
- Prices, sizes and stock in `products.ts`, and the fees in `brand.ts`, are bundled fallbacks only. They are used until the first catalogue loads.
- Everything else stays in `products.ts`: names, stories, notes, themes and images.
- Read prices and stock only through one catalogue overlay (port of the website's `sizesOf`), never from `products.ts` directly.

### Theme engine

**Token generation:**
- Port `createThemeTokens` and the contrast checks unchanged.
- From `accent` (plus optional `accentAlt` / `glow`), generate:
  - an accent scale 50–900;
  - alt and glow;
  - `accentInk`: the accent lightened until it passes AA on `ink-700`;
  - `onAccent`: text on the accent, AA;
  - a gold-tinted border.
- Use culori (pure JS, works in React Native).
- Build tokens for the house theme and every product.

**Validation:** an invalid colour, a duplicate slug, the slug `house`, or a failed AA check fails `npm run check` (Jest), the way the website fails its build.

**Active theme:**
- `ThemeProvider` holds the active theme id.
- It changes when the user:
  - scrolls into a product chapter;
  - presses a collection card;
  - opens a product screen (the previous theme returns on back);
  - tips the hero balance;
  - gets a Scent Finder result.

**Morphing:**
- On a change, the whole app morphs over **800 ms with the silk ease**. Never hard-swap.
- Morph with Reanimated shared values and `interpolateColor`, on the UI thread.
- Everything morphs: backgrounds, glows, shader uniforms, buttons, borders, the tab bar indicator.
- An interrupted morph starts from the current mixed colour.

**Colours in components:**
- They come only from theme hooks (`useThemeColor("accent")`, palette tokens).
- Add an ESLint rule that rejects hex and `rgb()` colour literals outside `src/config`, `src/data` and `src/theme`.

**Gold is constant:** it's the brand anchor. Only accents morph.

**Textures:**
- Marble veins, lightning, smoke and silk come from `texture.ts`, drawn with Skia and coloured by theme tokens.
- A future product that picks an accent and a texture automatically gets its own world.

### Typography (points; scale the two largest styles with screen width)

| Style | Font | Size / line height | Tracking |
|---|---|---|---|
| mega (hero ZED) | Cinzel 700 | ~32% of screen width, line height 0.8 | −0.03em |
| display | Cinzel 600 | 56 / 0.9 | −0.01em |
| h1 | Cinzel 600 | 40 / 1.0 | 0.02em |
| h2 | Cinzel 500 | 32 / 1.05 | 0.04em |
| h3 | Cinzel 500 | 22 / 1.15 | 0.06em |
| editorial | Cormorant Garamond italic | 20 / 1.3 | |
| body-lg / body | Manrope 400 | 18 / 1.65, 16 / 1.6 | |
| label | Manrope 600, caps | 12 / 1.4 | 0.32em (≈3.8 pt) |
| micro | Manrope 600, caps | 11 / 1.4 | 0.48em (≈5.3 pt) |

React Native's `letterSpacing` is in points. Compute it from the em values.

**Font loading:** load with expo-font and the `@expo-google-fonts` packages. Keep the native splash screen up until the fonts are ready.

### Motion tokens (from the website's `motion.ts`)

- **Durations:** micro 160 ms, ui 400 ms, reveal 900 ms, theme 800 ms, intro 1.8 s at most.
- **Stagger:** 40 ms between characters, 80 ms between lines.
- **Eases:**
  - lux `cubic-bezier(0.16, 1, 0.3, 1)` for reveals;
  - silk `cubic-bezier(0.65, 0, 0.35, 1)` for theme changes and curtains.
- **Springs:**
  - snap: stiffness 420, damping 32;
  - magnet: stiffness 160, damping 14, mass 0.6.

---

## 5. Navigation and screens

Expo Router, with the routes in `src/app/`:

```
src/app/
  _layout.tsx              fonts, splash hand-off, providers, root Stack, grain overlay
  (tabs)/_layout.tsx       custom gold tab bar
  (tabs)/index.tsx         Home
  (tabs)/finder.tsx        Scent Finder
  (tabs)/collection.tsx    Collection + compare
  (tabs)/bag.tsx           Bag
  fragrances/[slug].tsx    Product (same path as the website)
  checkout.tsx             Checkout (modal sheet)
  +not-found.tsx
```

**Tab bar:**
- Custom, not the default: ink background with a hairline gold top rule.
- The active tab has a small gold diamond indicator that slides.
- The Bag tab shows the item count, and it bumps when something is added.

**Deep links:** scheme `zed`, so `zed://fragrances/sovereign` opens the product.

### Intro (the website's preloader)

1. **Native splash:** ink-950 with the official logo. It holds until the fonts are loaded.
2. **Gold reveal:** the in-app intro starts with a gold mask/shine reveal of the official wordmark (`zed-wordmark-alpha.png`), drawn with a Skia gradient mask.
3. **Divider:** the diamond divider expands.
4. **Curtain:** a curtain splits on the rule and reveals Home.

**Rules:**
- 1.8 s at most.
- Once per cold start.
- A tap speeds it up rather than cutting it.
- Skipped entirely with Reduce Motion, and when the app opens from a deep link.
- The hero's entrance waits for the intro to finish (website: `src/stores/intro.ts`, `useHeroEntrance.ts`).

### Home (one vertical scroll, in this order)

1. **Hero: split world, stacked top/bottom as on the website's phone layout.**
   - **Balance:** a tap or drag on a world sets the balance (−1 to 1).
     - The favoured world grows and brightens; the other dims.
     - Past the takeover threshold the whole app takes that world's theme, and it lets go below the release threshold. Use the website's constants in `SplitHero.tsx`.
     - Gentle device tilt (expo-sensors) also nudges the balance.
     - An idle sway keeps the hero from ever sitting still.
   - **Seam:** a living Skia shader band, ported from `SeamCanvas.tsx`:
     - a wandering gold core;
     - each world's glow on its own side;
     - curling smoke and sparks;
     - brighter as one world wins.
     - As the hero scrolls away, the seam rises.
   - **Type:** massive kinetic "ZED" in gold Cinzel. Per-letter parallax depth follows touch and tilt, with a glint that pulses letter by letter. It is decorative; the screen's accessible heading carries the name. Below it sits the tagline "Signature Scents. Distinctive You."
   - **Bottles:** they float and tilt in 3D (perspective transforms) following touch and tilt. Each world has a "Discover" CTA to its product.
   - **Product count:** with any count other than two, the hero becomes an orbit/carousel (see `OrbitHero.tsx`): swipe, buttons and autoplay, with the active product's theme across the app. One product shows a single still world.
2. **Marquee:**
   - An infinite strip of tracked gold caps: the feature labels separated by ◆.
   - Its speed reacts to scroll velocity.
3. **The Worlds:** one scroll-driven chapter per product, generated from data (`Chapter.tsx`).
   - **Stage:** each chapter keeps its stage fixed on screen for about 1.5–2 screen heights of scroll (Reanimated scroll offset).
   - **Through the chapter:**
     - the theme morphs in;
     - the product name goes from outlined to filled in huge type (Skia text, stroke then fill);
     - the bottle rotates and scales at centre stage;
     - the props drift in three parallax depth layers (placeholder orbs named after the notes while `props` is empty);
     - the notes pyramid reveals top → heart → base;
     - the longevity and projection meters fill;
     - the procedural texture plays behind it all.
   - **CTAs:**
     - "Discover {Name}" opens the product screen.
     - "Order Now" adds the first in-stock size to the bag and opens the Bag, as on the website.
4. **Scent Finder teaser:** a themed card that opens the Finder tab.
5. **Drop banner:**
   - It shows the eyebrow in big gold type and the text, with the first-batch poster as the mood background.
   - The stock meter and countdown (days/hrs/min/sec) appear only when they're set.
   - The CTA "Shop the first batch" opens Collection.
   - Everything comes from `brand.dropBanner`, and `enabled: false` hides it.
6. **Feature strip:**
   - `brand.features`: 4 icons with thin gold vertical dividers.
   - Use a 2×2 grid with dividers on narrow phones.
   - The icons line-draw in when they scroll into view.
7. **Reviews:** read from `reviews.ts` and hidden while it's empty.
8. **Footer content:**
   - the official logo and the quality tagline;
   - fragrance links;
   - socials and WhatsApp;
   - the newsletter (UI plus the placeholder handler);
   - the disclaimer;
   - © year and the app version.

### Scent Finder tab

- **Intro:** eyebrow, title "Find your world", intro line, and "Begin".
- **Steps:** four steps from `quiz.ts`, with:
  - "Step 1 of 4" progress;
  - Back;
  - large tappable option cards with hints.
- **Scoring:** use `rankProducts` unchanged, so new products join automatically.
- **Result:** a dramatic full-app theme takeover.
  - An accent burst comes from the last tapped choice while the whole app morphs, with a success haptic.
  - It then shows "Your signature", the bottle, the name, the tagline and the match %.
  - Actions: Discover, Add to bag, and "Start again".

### Collection tab

- **Grid:**
  - 2 columns on phones; it scales to many products.
  - Each card shows the bottle, name, "Inspired by …" and the from-price.
- **Cards:**
  - Press-in adopts that product's theme, tilts the bottle and reveals the notes.
  - Tap opens the product.
- **Compare mode:**
  - Pick up to three products.
  - A side-by-side table shows:
    - inspired by;
    - concentration;
    - sizes and prices;
    - notes;
    - longevity and projection;
    - seasons and occasions.
  - It scrolls sideways on narrow screens.
  - The hint, Clear and "Done comparing" copy comes from `brand.copy.collection`.

### Product screen (`/fragrances/[slug]`)

- **Theme:** a full themed takeover while focused; the previous theme returns on leaving.
- **Hero:** the bottle with the product's procedural texture and emblem, the name, "Inspired by …", the tagline and the story.
- **Gallery:** a horizontal pager. Tap opens a lightbox with:
  - pinch and double-tap zoom;
  - swipe between images;
  - swipe down to close.
- **Details:**
  - the size selector (sold-out sizes disabled);
  - the price, or "Price on request";
  - the notes pyramid and vibe meters;
  - seasons and occasions;
  - the product's 4-icon feature strip.
- **"Pairs well with":** the other products.
- **Sticky bottom bar:** above the safe area, with:
  - the price;
  - **Add to bag**;
  - **Buy now**, which adds the size if it isn't in the bag yet, then opens checkout.
- **Share:** shares the name, "Inspired by …", the tagline and `siteUrl` with React Native's `Share`.
  - Don't link to the product's page on the website. Products added only to the app have none.
- **Unknown slug:** the not-found screen, with a way home.

### Bag tab

- **Lines:** each has a thumbnail, name, size, price, a quantity stepper (1–20, `MAX_QUANTITY`) and remove (button, plus swipe-to-remove).
- **Totals:** subtotal, **Delivery** (Rs 150 today, from the live catalogue) and **Total**. When any price is on request, add the note.
- **Live updates:** prices and stock update as soon as a fresh catalogue loads.
- **Checkout** opens the checkout sheet.
- **Empty state:** "Your bag is empty." with "Explore the collection".
- **Persistence:** the bag persists to AsyncStorage (key `zed-cart`, items only).
- **Adding to the bag:** shows a short toast ("Added to bag", with "View bag"), a light haptic and a screen-reader announcement.

---

## 6. Checkout (identical to the website's `CheckoutDialog`)

A modal sheet that can't be dismissed while an order is sending. All text comes from `brand.copy.checkout` and `brand.copy.cart`.

### Step 1: Delivery details

**Fields:**

| Field | Rules | Keyboard and autofill |
|---|---|---|
| Full name | required, ≤ 80 | `textContentType="name"` |
| Phone number | required, Pakistani mobile, valid when `normalizePhone()` accepts it; hint "Pakistani mobile number, e.g. 0300 1234567" | phone keyboard, `textContentType="telephoneNumber"` |
| City | required, ≤ 60 | |
| Full address | required, ≤ 300, multiline | |
| Order notes | optional, ≤ 500 | |

**Form behaviour:**
- Fields chain with "next".
- The focused field stays above the keyboard on both platforms.
- On submit, invalid fields show inline errors and the first one is focused.

**Payment options** (radio cards):
- **EasyPaisa / JazzCash:** "Pay now and upload a screenshot". This is the default.
- **Cash on Delivery:** "Pay when your order arrives", with **+ Rs 50** shown on the card.
- When any item is price-on-request:
  - the wallet option is disabled;
  - the order is COD;
  - the `walletUnavailable` note shows.

**Order summary:**
- the lines;
- Subtotal;
- Delivery Rs 150;
- COD charges Rs 50 (COD only);
- the on-request note when it applies.

**Sticky total bar:**
- It shows **Total**: items + delivery fee, + COD fee for COD. Fees come from the live catalogue.
- Its button reads "Continue to payment" for the wallet, or "Place order" for COD.

**Fresh catalogue first:**
- Both buttons first make sure the catalogue is under 5 minutes old, so the "amount to send" is current.
- If prices or stock changed, stay on this step with the prices-changed notice and the new total.

### Step 2: Pay (wallet only)

- **Header:** Back, then "Send your payment" with its intro line.
- **Account card:**
  - the provider chips EasyPaisa and JazzCash;
  - **Account number** `0312-7373848`, large, with Copy (copies digits only: `03127373848`);
  - **Account title** Danyal Ahmad;
  - **Amount to send** (the total), with Copy (copies the plain number).
  - Copy uses expo-clipboard, with "Copied" for 2 s and a light haptic.
- **Payment screenshot:**
  - "Upload screenshot" opens the photo library (expo-image-picker, images only).
  - A preview thumbnail then shows with Replace and Remove.
- **Errors:**
  - required: "Please upload a screenshot of your payment.";
  - unreadable: the `invalid` message.
- **Preparing the image** (same limits as the website's `screenshot.ts`):
  - Refuse inputs over 10 MB.
  - Downscale with expo-image-manipulator to at most 2000 px on the longest side (never upscale).
  - Re-encode as JPEG at quality 0.85, with base64 output.
  - Refuse results over 3 MB.
  - Name: the original name with a `.jpg` extension.
- "Place order" sends the order.

### Step 3: Done

- **Mark and order ID:**
  - a gold diamond check mark;
  - "Order placed";
  - "Order **ZED-XXXXXX**", selectable;
  - the diamond divider.
- **Message by payment method:**
  - wallet: "Your order is placed. Please wait for confirmation (takes around 1 working day)."
  - COD: "Your order is placed. We'll contact you to confirm it before dispatch."
- **Actions:**
  - "Continue shopping" closes the sheet.
  - "Questions? Message us on WhatsApp" opens `wa.me` with `copy.whatsapp.question` + the order ID.
- **On success:**
  - The bag clears.
  - The screenshot and notes clear.
  - Name, phone, city and address stay filled for the rest of the session (in memory, like the website).
  - Reopening checkout starts at step 1.
- **Haptics:** success on placing the order, warning on failure.

### Failure

- **Message:** "We couldn't place your order. Please try again, or send it to us on WhatsApp."
- **"Order on WhatsApp":** opens `wa.me/923127373848` with the full order text from `orderMessage()`, so no order is lost.
- **Offline:** the offline copy shows instead, with the same WhatsApp fallback.
- **Prices changed** (`price-changed`):
  - Load the returned catalogue.
  - Go back to step 1 with the notice and the new total.
- **Sold out** (`sold-out`): show the message and mark the affected sizes sold out.
- **Too many** (`too-many`): ask the customer to wait a few minutes or use WhatsApp.
- **Retrying:** safe. The same `requestId` is reused, so a retry after a timeout never creates a second order (section 7).

---

## 7. Orders: the shared Google Sheet and Apps Script

The app talks directly to the Apps Script web app the website already uses. It shares the website's:
- deployment URL;
- "Orders" sheet;
- Drive folder for payment screenshots;
- order emails.

App orders show up in the website's admin portal next to website orders.

### Why the app can't use the website's secret

`SECRET` in `Code.gs` also authorizes the admin portal's actions:
- listing every order, with customers' names, phones and addresses;
- changing statuses;
- reading payment screenshots.

Anything inside an app can be extracted, so `SECRET` never goes into the app. Instead the script has a second, app-only key, `APP_KEY`, that can only place orders. Treat that key as public; it only deters casual misuse. The real protection is that the script checks and prices every order itself.

### What the live script already does (website repo, `google-apps-script/Code.gs`)

Read it for the exact rules; don't change it.

- **Catalogue:** `GET {url}?action=catalogue` needs no key. It returns `{ ok, currency, deliveryFee, codFee, items: [{ slug, name, ml, price, inStock }] }`:
  - the items come from the sheet's Catalogue tab;
  - a price of 0 means price on request;
  - the fees come from `DELIVERY_FEE` and `COD_FEE`.
- **Orders:** action `order`, with `appKey` (the app) or `secret` (the website's server). The script:
  - validates and prices the order from the catalogue (same limits as the website: 1–20 lines, quantity 1–20, name 80, city 60, address 300, notes 500 characters, a Pakistani mobile number, and for wallet orders a screenshot of at most 4,200,000 base64 characters and no price-on-request items);
  - refuses it with `price-changed` if its total differs from `expectedTotal`;
  - assigns the `ZED-XXXXXX` ID;
  - saves the screenshot, adds the row with Source "App" and emails the owner.
- **Duplicates:** the same `requestId` within 6 hours returns the first order's ID without a new row.
- **Spam limit:** at most 3 orders per phone number in 10 minutes (`too-many`).
- **Admin actions:** `appKey` can't use the admin portal's actions (`list`, `status`, `screenshot`).

### App side

**Configuration:**
- `.env` (git-ignored) and `.env.example`:
  - `EXPO_PUBLIC_ORDERS_SCRIPT_URL`: the same `/exec` URL as the website's `ORDERS_SCRIPT_URL`;
  - `EXPO_PUBLIC_ORDERS_APP_KEY`: the app key.
- `EXPO_PUBLIC_` values are compiled into the app and are public by design. That's why only the app key goes here.
- For EAS builds and updates, set the same two values as EAS environment variables.

**`src/lib/orders.ts`** exports `fetchCatalogue()` and `placeOrder()`. `placeOrder()` never throws: like the website's, it answers `{ ok: true, id }` or `{ ok: false, error, catalogue }`.

**How Apps Script answers:**
- Always with HTTP 200, after a redirect that `fetch` follows. Keep redirects on.
- Read `ok` and `error` from the JSON body.
- Treat a body that isn't JSON as `failed`.

```
POST {EXPO_PUBLIC_ORDERS_SCRIPT_URL}
Content-Type: application/json

{
  "appKey": "…",
  "action": "order",
  "requestId": "<uuid>",
  "order": {
    "items":    [{ "slug": "sovereign", "ml": 30, "quantity": 1 }],
    "customer": { "name": "…", "phone": "0300-1234567", "city": "…", "address": "…", "notes": "" },
    "payment":  "wallet" | "cod",
    "screenshot": { "name": "payment.jpg", "type": "image/jpeg", "data": "<base64, no data: prefix>" } | null,
    "expectedTotal": 1549
  }
}
```

| Answer | Meaning | App |
|---|---|---|
| `{ ok: true, id: "ZED-7K3QXP" }` | Recorded | Done step |
| `{ ok: false, error: "invalid" }` | Failed validation, an unknown slug or size, or a wallet order with a price-on-request item | Error and WhatsApp fallback |
| `{ ok: false, error: "sold-out", catalogue }` | A size is out of stock | Load the catalogue (the line shows "Sold out") and show the message |
| `{ ok: false, error: "price-changed", catalogue }` | Prices or fees differ from `expectedTotal` | Load the catalogue, back to step 1 with the new total |
| `{ ok: false, error: "too-many" }` | Spam limit for this phone number | Wait message and WhatsApp fallback |
| `{ ok: false, error: "unauthorized" }`, not JSON, network error, timeout | Misconfiguration or no connection | Error and WhatsApp fallback |

**Request rules:**
- Use a 30 s timeout (AbortController).
- Never retry automatically.
- **`requestId`:**
  - Reuse the same one until the order succeeds or the bag, details or payment change.
  - A customer who taps again after a timeout therefore can't create a duplicate.

**Live catalogue:**
- **When it loads:**
  - at launch;
  - on returning to the foreground (at most every 5 minutes);
  - when checkout opens.
- **Storage:** keep the last good copy in AsyncStorage, and use the bundled values until one has loaded.
- **Overlay:**
  - It puts live prices and stock onto `products.ts`.
  - Once a catalogue has loaded, a size missing from it counts as sold out.
- **Where totals come from:** `buildOrder` and `orderTotals` read prices and fees only from this overlay.

**Platform:** native requests aren't subject to CORS. The app targets iOS and Android only, not Expo web.

---

## 8. Interaction and motion (web → native)

| Website | App |
|---|---|
| Custom cursor with VIEW / ORDER labels | None. Haptics instead (expo-haptics): light on primary CTAs and add-to-bag, selection on size and quiz choices, success and warning on order results |
| Magnetic buttons with a gold sheen on hover | Press: snap-spring scale to 0.97 and a gold sheen sweeping across on press-in |
| Hover theming on cards | Press-in and scroll position |
| Split-text heading reveals | Per-letter or per-line reveals as headings enter the viewport (lux ease, 40/80 ms stagger) |
| Gold shimmer over the wordmark | An occasional shimmer: a moving Skia gradient masked to the official wordmark image |
| Film grain and vignette | One Skia overlay (static fractal noise at low opacity plus a radial vignette), `pointerEvents="none"`, never re-rendering |
| Theme-coloured page wipe | A theme-coloured ink wipe when opening a product screen |
| Lenis smooth scrolling | Native scrolling. Never fight platform physics |
| WebGL atmosphere (smoke, light rays, dust) | A Skia runtime shader background tinted by the theme. Reduced resolution. Paused when its screen is unfocused, the app is backgrounded or an opaque section covers it. Static gradient fallback |
| Pointer-driven hero | Touch, drag and device tilt |

**Reduced motion** is required for every animation. Read iOS Reduce Motion and Android "Remove animations" with Reanimated's `useReducedMotion` and `AccessibilityInfo`, and update live when they change. When it's on:
- no intro;
- no fixed-stage scroll scrubbing (chapters lay out in flow);
- no shader animation (static gradients);
- no parallax, tilt or idle sway;
- a static marquee;
- instant theme swaps;
- no line-draw (icons simply appear).

---

## 9. Platform, performance, accessibility

### Platform

- **Expo app config:**
  - iOS and Android;
  - portrait only;
  - dark only (`userInterfaceStyle: "dark"`), light status bar;
  - Android edge-to-edge with safe areas everywhere.
- **Android back button:** it closes the lightbox, sheet or compare mode before leaving the screen.
- **App identity:**
  - app name "ZED Fragrances", slug `zed-fragrances`, scheme `zed`;
  - bundle ID / package `com.zedfragrances.app` as a placeholder. Confirm it with me before Phase 7; it can't change after the first store upload.
- **Offline:**
  - Browsing works offline, because the product data and images are bundled and the last catalogue is cached.
  - Checkout handles being offline (section 6).

### Performance

- **Target:** 60fps on a mid-range Android phone.
- **Animation:**
  - animate transforms, opacity and colours on the UI thread with worklets;
  - never call `setState` per frame or per scroll event.
- **Skia:**
  - shader canvases at reduced pixel density;
  - only one animated shader running at a time.
- **Images:**
  - expo-image with caching;
  - preload the bottle images;
  - convert the large reference posters to WebP for the bundle (never re-encode or alter the logo files).
- **Long lists:** use `FlatList` / FlashList when the catalogue grows.

### Accessibility

- **Contrast:** AA enforced by the theme engine.
- **Controls:**
  - every control has a role, a label and a state;
  - touch targets are at least 44×44 pt.
- **Text size:**
  - body and UI text scale with the system font size;
  - display type caps its scaling (`maxFontSizeMultiplier`);
  - layouts survive the largest accessibility text sizes.
- **Images:** labels come from the data, with sensible defaults ("Sovereign bottle"). Decorative layers (textures, grain, shaders, kinetic letters) are hidden from screen readers.
- **Announcements:**
  - announce "Added to bag", "Copied" and "Order placed";
  - move screen-reader focus to each checkout step's heading.
- **Testing:** test with VoiceOver and TalkBack.

---

## 10. Brand assets

**Copy from the website repo:**
- `public/brand/` → `assets/brand/`:
  - `zed-logo.png` (official);
  - `zed-wordmark.png`;
  - `zed-wordmark-alpha.png`;
  - `emblems/lotus.svg`;
  - `emblems/lion-crowned.svg`.
- `public/images/reference/` → `assets/images/reference/`.
- `public/images/products/<slug>/` → `assets/images/products/<slug>/`:
  - `bottle.png`;
  - `hero.jpg` and `gallery-*.jpg` when present;
  - `props/*.png`.

**Logo and emblems:**
- Never recreate, redraw or trace the logo or the emblems.
- Render the emblem SVG files as they are (e.g. expo-image, or react-native-svg-transformer).
- `lotus.svg` and `lion-crowned.svg` are placeholders to replace with official ones. List them in the README.

**App icon, adaptive icon and splash:**
- Generate them from the official `zed-logo.png`.
- Centre it on ink-950 and pad as needed; iOS icons can't be transparent.
- Don't redraw it.

**Never:**
- Never use `first-batch-poster.png` for bottle close-ups (its labels contain text errors). It is mood/background imagery only.
- Never use the referenced brands' logos, bottles, packaging or imagery, or stock photos of other perfume brands.

**Missing assets:** use a stylised placeholder and never block on assets.

---

## 11. How to work

### Step 1: plan only, no code

Read this file, then the website files in section 2 that you need. Then give me:
- the design direction for phones:
  - colour tokens;
  - the type scale in points;
  - motion principles;
  - how each website section translates;
- the folder structure;
- the exact libraries you'll install;
- the confirmed phase plan below.

Then wait for my OK.

### Step 2: build one phase at a time

1. **Foundation**
   - **Scaffold:** Expo (latest stable SDK, TypeScript strict, Expo Router, `@/` → `src/`).
     - Install native libraries only with `npx expo install` so versions match the SDK.
     - Expected libraries: react-native-reanimated (and react-native-worklets if the SDK needs it), react-native-gesture-handler, @shopify/react-native-skia, react-native-svg, expo-image, expo-font with `@expo-google-fonts/cinzel`, `cormorant-garamond` and `manrope`, zustand with @react-native-async-storage/async-storage, culori, expo-haptics, expo-clipboard, expo-image-picker, expo-image-manipulator, expo-sensors, expo-linking, expo-splash-screen, expo-updates, expo-crypto (for `requestId`).
   - **Tooling and checks:**
     - ESLint (`expo lint`) with the hex/`rgb()` colour rule;
     - `tsc --noEmit`;
     - Jest (`jest-expo`);
     - `npm run check`, which runs lint, typecheck and tests, then bundles both platforms with `expo export` (output git-ignored).
   - **Tests:**
     - theme validation: colours, AA contrast, slugs;
     - data sanity;
     - checkout totals: wallet = items + 150; COD = items + 200;
     - `normalizePhone`: `0300 1234567`, `+92 300 1234567`, `0092-300-1234567` and `3001234567` → `0300-1234567`; landlines and short numbers → null;
     - Scent Finder ranking: velvet/warm answers → Sovereign; electric/cold → Dominator;
     - the catalogue overlay:
       - live prices and stock replace the bundled ones;
       - a size missing from a loaded catalogue is sold out;
       - the bundled values apply when nothing has loaded.
   - **Data and theme:** `brand.ts`, `products.ts`, `quiz.ts`, `reviews.ts`, the types, the theme engine, `ThemeProvider` and the motion tokens.
   - **Assets and app config:**
     - assets copied in;
     - app config: name, icon, adaptive icon, splash, scheme, portrait, dark.
   - **Shell and UI kit:**
     - the navigation shell (tabs, stack, checkout modal, placeholder screens);
     - the grain/vignette overlay;
     - UI kit: Text styles, Button with sheen, DiamondDivider, Logo, FeatureIcon, Price.
   - **`CLAUDE.md`:** create it with the rules from section 0 and the core rules in section 4.
2. **Intro and hero**
   - **2a:** the intro (splash hand-off, gold reveal, divider, curtain).
   - **2b:** the split-world hero:
     - layout;
     - touch, drag and tilt balance;
     - theme takeover;
     - kinetic ZED;
     - floating bottles;
     - the orbit for other counts.
   - **2c:** the Skia atmosphere and seam shaders, with static fallbacks.
3. **Product worlds**
   - **3a:** chapter structure with a fixed stage, scroll-driven theme morphing, the name reveal and the bottle animation.
   - **3b:** parallax props, the notes pyramid, vibe meters and procedural textures.
4. **The rest of Home and the tabs:** the Scent Finder tab, the Collection tab with compare, the marquee, drop banner, feature strip, reviews and footer content.
5. **Shopping**
   - **Before you start:** ask me to confirm that `APP_KEY` is set in the live script and the two `EXPO_PUBLIC_ORDERS_*` values are in `.env`. Until then, app orders answer `unauthorized`.
   - **Build:**
     - the product screen, with gallery lightbox and share;
     - the Bag;
     - the live catalogue;
     - Checkout with ordering through the script;
     - the screenshot upload and the WhatsApp fallback.
6. **Polish**
   - transitions, haptics, sheens;
   - a reduced-motion pass;
   - an accessibility pass (VoiceOver, TalkBack, large text);
   - a performance pass;
   - offline states;
   - the README.
7. **Release preparation** (you prepare; I run the builds)
   - `eas.json` with development, preview and production profiles, and an EAS Update channel.
   - The two `EXPO_PUBLIC_ORDERS_*` values set as EAS environment variables.
   - A short guide:
     - building with EAS;
     - testing on TestFlight and Google Play internal testing;
     - submitting.
   - A store checklist:
     - developer accounts (Apple Developer Program, Google Play Console);
     - a privacy-policy URL. Both stores require one, because the app collects name, phone, city, address and a payment screenshot. I'll add a page to the website.
     - the App Store privacy labels and Google Play Data safety answers;
     - screenshots and descriptions;
     - Google Play's closed-testing requirement for new personal accounts (check the current rule).
   - Note for the guide: the products are physical goods, so Apple's in-app purchase rules don't apply to EasyPaisa/JazzCash transfers.

### Rules for every phase

- Before starting, re-read only the sections of this file (and the website files) relevant to that phase.
- When done, run `npm run check` and fix every error. A phase isn't done until it passes.
- Then give me a short checklist of what to verify:
  - on an iPhone (a small one around 375 pt wide, and a standard one around 393 pt);
  - on an Android phone (around 412 dp);
  - with Reduce Motion both on and off.
- Stop and wait. Don't start the next phase on your own.

---

## 12. README (Phase 6)

It must explain:
- **Running the app:** `npm install`, `npx expo start`, Expo Go versus a development build, and `npm run check`.
- **Where things live.**
- **Adding a new product,** step by step with a full example object:
  1. Add one object to `products.ts`, plus images in `assets/images/products/<slug>/`.
  2. Add one row per size to the sheet's Catalogue tab. Without them the product shows as sold out.
  3. Publish an update.
- **Changing brand colours, copy, taglines and the drop banner.**
- **Changing prices or stock:** edit the Catalogue tab. The app picks it up within minutes; no app update is needed.
- **Changing the fees:**
  1. Change the delivery and COD fees in the website repo's `google-apps-script/Code.gs` and publish a new script version. The website and the app both pick them up.
  2. Update the fallbacks in `brand.ts`.
- **Changing the wallet account:** edit `brand.ts`, then publish an update.
- **The WhatsApp number, currency, and the two `EXPO_PUBLIC_ORDERS_*` values** (`.env` locally, EAS environment variables for builds).
- **The orders script:** it lives in the website repo, with its guide in `google-apps-script/README.md` there.
- **Where to put real bottle, ingredient and gallery images, and which placeholders to replace.**
- **Building and releasing with EAS:** builds versus over-the-air updates, and when a new store build is needed (native changes, new libraries, app icon).

---

## 13. Out of scope (for now)

- **On the website, not in the app:** the admin portal and any order management (they stay at `/admin`).
- **Not built yet:**
  - customer accounts;
  - push notifications;
  - order history and tracking;
  - card payment gateways;
  - analytics;
  - an Expo web build (the website already exists).

Keep checkout behind `src/lib/checkout.ts` so a gateway can be added later, the same way as on the website.
