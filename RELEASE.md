# Releasing ZED Fragrances

Claude Code prepared the configuration (`eas.json`, `app.json`); you run these commands. Store rules and prices change, so check anything marked *(check)*.

## Before the first build

1. **Confirm the app ID.** `app.json` uses `com.zedfragrances.app` for both `ios.bundleIdentifier` and `android.package`. It can't change after the first store upload.
2. **The orders script must be live with app support:** `?action=catalogue` answers, `APP_KEY` is set and published as a new version (website repo, `google-apps-script/README.md`).
3. **Install EAS and link the project (once):**
   ```bash
   npm install -g eas-cli
   eas login
   eas init                 # adds extra.eas.projectId to app.json
   eas update:configure     # adds updates.url to app.json
   ```
   Commit the `app.json` changes.
4. **Set the two app values as EAS environment variables** (your `.env` is git-ignored, so cloud builds don't see it). Plain-text visibility is fine; these values ship inside the app anyway:
   ```bash
   eas env:create --name EXPO_PUBLIC_ORDERS_SCRIPT_URL --value "https://script.google.com/macros/s/…/exec" --environment preview --environment production --visibility plaintext
   eas env:create --name EXPO_PUBLIC_ORDERS_APP_KEY --value "<the APP_KEY>" --environment preview --environment production --visibility plaintext
   ```
   Never add the script's `SECRET`.
5. **Commit before every build.** EAS builds what's in the project.

## Build profiles (`eas.json`)

| Profile | Use | Channel |
|---|---|---|
| `development` | A development build, only if a library isn't in Expo Go. Run `npx expo install expo-dev-client` first (after that, `npx expo start` opens the dev build by default; press `s` to switch to Expo Go) | `development` |
| `preview` | Internal test builds (Android `.apk`, iOS ad-hoc) | `preview` |
| `production` | Store builds; the build number increments automatically | `production` |

## iPhone: TestFlight, then the App Store

1. In [App Store Connect](https://appstoreconnect.apple.com): **Apps → + → New App**, with the app ID and the name "ZED Fragrances" (try "ZED Fragrances PK" if it's taken).
2. `eas build --platform ios --profile production` (EAS creates the certificates when you sign in with your Apple ID; about 15–30 minutes).
3. `eas submit --platform ios --latest` uploads it to App Store Connect / TestFlight.
4. Add yourself as an internal tester in TestFlight and test the real build: icon, splash, orders, smoothness.
5. Fill in the listing (see the checklist below) and submit for review. In the review notes say: the app sells physical goods; payment is cash on delivery or a manual EasyPaisa / JazzCash bank transfer confirmed by screenshot; there is no sign-in. **Apple's in-app purchase rules don't apply to physical goods**, so the manual wallet transfer is allowed.

## Android: testing tracks, then production

1. In [Google Play Console](https://play.google.com/console): **Create app**, name "ZED Fragrances", App, Free.
2. `eas build --platform android --profile production` produces an `.aab`.
3. **Upload the first `.aab` by hand** in **Testing → Internal testing → Create new release** *(check)*. Later builds can go up with `eas submit --platform android --latest`, after you create a Google service account key (Play Console → Setup → API access) and point EAS at it when it asks.
4. **Closed test:** new personal developer accounts need a closed test with at least 12 testers opted in for 14 days before production access *(check the current rule in Play Console)*. Recruit testers early.
5. Fill in the listing (checklist below), apply for production access, then promote the release.

## Updates without a store review

- JavaScript, copy, colours, images and new products (with their Catalogue rows): test on both phones, commit, then
  ```bash
  eas update --channel production --message "What changed"
  ```
  Users get it the next time they open the app (sometimes the time after). An update reaches everyone at once.
- Prices, stock and fees: edit the sheet's Catalogue tab / the script. No app update at all.
- **A new store build is needed** for a new native library, a new permission, a changed icon or splash, or an Expo SDK upgrade: bump `version` in `app.json` (the runtime version follows it), then build and submit both platforms.

## Store checklist

- [ ] **Developer accounts:** Apple Developer Program ($99/year *(check)*) and Google Play Console ($25 once *(check)*). Personal accounts show your name as the seller; an organisation account shows "ZED Fragrances" but needs a D-U-N-S number.
- [ ] **Privacy policy URL** (both stores require one): a `/privacy` page on the website. It covers the name, phone, city, address and payment screenshot collected to deliver orders, stored in the orders Google Sheet and Drive, and how to ask questions or request deletion (WhatsApp or email).
- [ ] **App Store privacy labels:** Contact info (name, phone number, physical address) and Photos (the payment screenshot), used for App Functionality, linked to the user, **not** used for tracking. No other data.
- [ ] **Google Play Data safety:** Personal info (name, phone, address) and Photos collected, for App functionality, encrypted in transit (HTTPS), not shared for advertising; the app has no ads; users can request deletion.
- [ ] **Screenshots:** iPhone (the largest required size *(check)*) and Android phone screenshots; Play also needs the 512×512 icon and a 1024×500 feature graphic.
- [ ] **Descriptions:** short and full, keywords (iOS), support URL. **Keep other brands' trademarks out** of the name, subtitle, keywords and promotional text: describe it as "luxury inspired-by fragrances". The in-app "Inspired by …" references carry the disclaimer; if review asks, point to it.
- [ ] **Age rating** questionnaire (iOS) and **content rating** + target audience (Play).
- [ ] **Price:** Free.
