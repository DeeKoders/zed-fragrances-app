# ZED Fragrances app: step-by-step guide

How to go from nothing to the app in the App Store and Google Play, using Claude Code and [`MOBILE_APP_PROMPT.md`](MOBILE_APP_PROMPT.md).

- Claude Code writes the code.
- You prepare the backend, test on your phones, commit, and do the store work.

Store rules and prices change, so check anything marked *(check)* when you get there.

---

## Part 1: Before you start

### What you need

| What | When | Cost |
|---|---|---|
| Your Mac with Node.js and Claude Code (you have these) | Now | – |
| An iPhone and/or an Android phone with **Expo Go** installed (free, from the App Store / Google Play) | Now | Free |
| An **Expo** account ([expo.dev](https://expo.dev)) | Now (needed for builds later) | Free tier |
| **Apple Developer Program** | Before Phase 7 (enrolment can take a few days) | $99 / year *(check)* |
| **Google Play Console** | Before Phase 7 (identity checks can take a few days) | $25 once *(check)* |
| A **privacy policy** page | Before submitting to the stores | Free (a page on the website) |

**Enrol early in the Apple and Google programmes.** Each runs its own checks, and you don't want to wait on them at the end.
- **Personal account:** the stores show your own name as the seller.
- **Organisation account:** the store shows "ZED Fragrances", but it needs a D-U-N-S number, which is free and takes days to weeks *(check)*.

### Decide the app ID now

The brief uses `com.zedfragrances.app` as a placeholder.
- **Format:** reverse-domain style, lowercase, e.g. `com.zedfragrances.app`, or `pk.zedfragrances.app` if you'll own a `.pk` domain.
- **It's permanent:** it can't change after the first store upload.

Tell Claude Code your choice at Phase 1 or, at the latest, before Phase 7.

---

## Part 2: Prepare the backend (once, about 10 minutes)

The app sends orders to the same Google Apps Script as the website. Do this after the website update from this repo is live: script updated, `setup` run, Catalogue tab present.

1. Make an app key in a terminal:
   ```bash
   openssl rand -hex 32
   ```
2. In the sheet, open **Extensions → Apps Script**. Replace `PASTE_YOUR_APP_KEY_HERE` with that key in the `APP_KEY` line, then **Save**.
3. Publish it: **Deploy → Manage deployments →** pencil **→ Version: New version → Deploy**. The URL stays the same.
4. Note two values for the app; you'll put them in its `.env` in Phase 5:
   - the web app URL (ends in `/exec`), the same as the website's `ORDERS_SCRIPT_URL`;
   - the app key you just made.
5. Check the catalogue: open `<web app URL>?action=catalogue` in a browser. It should show your prices.

**Never give the app the `SECRET`.** It unlocks your customers' data through the admin actions. The app key can only place orders.

---

## Part 3: Create the app folder

```bash
mkdir ~/Projects/zed-fragrances-app
cp ~/Projects/zed-fragrances/MOBILE_APP_PROMPT.md ~/Projects/zed-fragrances-app/PROMPT.md
cp ~/Projects/zed-fragrances/MOBILE_APP_GUIDE.md ~/Projects/zed-fragrances-app/GUIDE.md
cd ~/Projects/zed-fragrances-app
git init
```

Once copied, delete `MOBILE_APP_PROMPT.md` and `MOBILE_APP_GUIDE.md` from the website repo, or commit them there; it's your choice.

Optional: create an empty GitHub repository for the app and add it as `origin` when you first push.

---

## Part 4: Plan with Claude Code (Step 1 of the brief)

1. **The Expo plugin** for Claude Code is already installed on this Mac (user scope, so every project has it). On another Mac:
   ```bash
   claude plugin install expo@claude-plugins-official
   ```
   It adds Expo's official skills and the Expo MCP server.
   - **Signing in to Expo's tools:** the first time Claude Code uses them, it asks you to sign in with your Expo account. You can also connect them yourself with `/mcp`.
   - **Optional:** the skills work without signing in.
2. **Start Claude Code** in the app folder, with read access to the website repo, which is the reference implementation:
   ```bash
   cd ~/Projects/zed-fragrances-app
   claude --add-dir ~/Projects/zed-fragrances
   ```
   (Inside a session, `/add-dir ~/Projects/zed-fragrances` does the same.)
3. **Send:**
   > Read PROMPT.md and do Step 1 (plan only).
4. **Review the plan.** Check:
   - the libraries;
   - the folder structure;
   - how each website section becomes a screen.
   Correct anything you don't like now; changes are cheap at this point.
5. **Approve:**
   > Plan approved. The app ID is com.zedfragrances.app. Start Phase 1.

**Permissions:** Claude Code will ask to run installs (`npx create-expo-app`, `npx expo install …`) and `npm run check`. Allow those. It should never start `npx expo start`, simulators or EAS builds; those are yours.

---

## Part 5: The loop for every phase

The brief has 7 phases: Phase 2 has sub-steps 2a–2c and Phase 3 has 3a–3b. Each one goes the same way.

### 1. Claude Code builds the phase

It finishes when `npm run check` passes, then gives you a test checklist.

### 2. Run the app on your phone

In a second terminal:
```bash
cd ~/Projects/zed-fragrances-app
npx expo start
```
- **iPhone:** scan the QR code with the Camera app.
- **Android:** scan it from inside Expo Go.
- **Connecting:** the phone and Mac must be on the same Wi-Fi. If it won't connect, use `npx expo start --tunnel`.
- **Shortcuts:**
  - press `r` in the terminal to reload;
  - shake the phone for the developer menu.
- **After pulling changes or editing `.env`:** stop it and run `npx expo start --clear`.

### 3. Go through the checklist

Test on both phones, and with **Reduce Motion** on and off:
- **iPhone:** Settings → Accessibility → Motion → Reduce Motion.
- **Android:** Settings → Accessibility → "Remove animations". It's under "Color and motion" on Pixel, or "Visibility enhancements" on Samsung.

### 4. Report problems

Paste screenshots straight into Claude Code and describe what's wrong. Let it fix them and re-run the check.

### 5. Commit

```bash
git add -A
git commit -m "Phase 1: foundation"
```

### 6. Start the next phase

> Phase 1 works on both phones. Start Phase 2a.

**Saving usage:**
- If a session gets long, run `/compact`.
- Or start a fresh session between phases. `PROMPT.md`, `CLAUDE.md` and the code carry the context.

---

## Part 6: What to watch in each phase

| Phase | What you should see | Notes |
|---|---|---|
| 1 Foundation | Four tabs (Home, Finder, Collection, Bag) with placeholder screens, the right fonts and colours, and the grain overlay | Expo Go shows its own icon and splash. Yours appear in real builds (Phase 7) |
| 2a Intro | Gold reveal of the logo, the diamond rule, the curtain. Once per launch, never with Reduce Motion | Force-close and reopen to see it again |
| 2b Hero | Tap or drag a world to make it win; the app's colours morph; the bottles float; the ZED letters move with tilt | |
| 2c Shaders | The living seam and the smoky background | Judge smoothness with `npx expo start --no-dev --minify`. Development mode is slower than the real app. Try a mid-range Android too |
| 3a, 3b Worlds | Scrolling a chapter morphs the theme, fills the name, turns the bottle, then shows the notes, meters and CTAs | |
| 4 Rest of Home and tabs | Scent Finder result takeover, collection grid and compare, marquee, drop banner, feature strip, footer | |
| 5 Shopping | Product screen, bag and the full checkout | See below |
| 6 Polish | Haptics, transitions, VoiceOver and TalkBack, large text | See below |
| 7 Release preparation | `eas.json`, update channel and a store checklist | See Part 7 |

### Phase 5: real orders

1. **Before Claude Code starts,** put the two values from Part 2 in the app folder's `.env`. Use the exact names Claude Code gives you; the brief says `EXPO_PUBLIC_ORDERS_SCRIPT_URL` and `EXPO_PUBLIC_ORDERS_APP_KEY`. Then restart with `npx expo start --clear`.
2. **Test each case,** using a different phone number for each order, because the spam limit allows 3 orders per number in 10 minutes:
   - **Cash on Delivery:** a row appears in the sheet with Source **App** and Status **New**, and you get the email.
   - **EasyPaisa / JazzCash with any image:** Status **Verify payment**, with the screenshot in Drive.
   - **The admin portal** (`/admin` on the website) shows both, marked App.
   - **A price change:** change a price in the Catalogue tab. Reopen the app or open checkout, and the new price shows. Change it while checkout is open and press Continue: you get the "prices updated" message.
   - **Offline:** airplane mode, then place an order. You get the error with **Order on WhatsApp**.
   - **Sold out:** untick "In stock" for a size. The app shows it sold out.
3. **Clean up:** delete the test rows and the test screenshots in the Drive folder, and undo the catalogue changes.

### Phase 6: accessibility

- **VoiceOver (iPhone):** set it as the Accessibility Shortcut (Settings → Accessibility → Accessibility Shortcut), then triple-click the side button to toggle it.
- **TalkBack (Android):** Settings → Accessibility → TalkBack.
- **Largest text size:**
  - iPhone: Settings → Accessibility → Display & Text Size → Larger Text;
  - Android: Settings → Display → Font size.
- **What to check:** every button is announced sensibly, checkout moves focus to each step's heading, and nothing overlaps at large sizes.

### Also ask for a privacy policy

Ask me (in the website repo) for a `/privacy` page on the website. The stores need its URL.
- **What it covers:** the app collects name, phone, city, address and a payment screenshot to deliver orders.
- **Where the data goes:** the orders Google Sheet and Drive.
- **How to reach you:** WhatsApp, or an email for questions and deletion requests.

---

## Part 7: Building and publishing

Claude Code prepares the configuration in Phase 7; you run these commands.

### One-time EAS setup

```bash
npm install -g eas-cli
eas login
cd ~/Projects/zed-fragrances-app
eas init            # links the project to your Expo account
```

**Add the two `EXPO_PUBLIC_ORDERS_*` values as EAS environment variables:** expo.dev → your project → Environment variables. Add them to the **preview** and **production** environments.
- **Why:** your `.env` is git-ignored, so cloud builds don't see it.
- **Visibility:** "Plain text" is fine; these values ship inside the app anyway.

**Commit before every build.** EAS builds what's in your project, and a clean tree avoids surprises.

### iPhone: TestFlight, then the App Store

1. **Create the app:** in [App Store Connect](https://appstoreconnect.apple.com), go to **Apps → + → New App**.
   - Use your app ID and the name "ZED Fragrances".
   - Names must be unique on the store. If it's taken, try e.g. "ZED Fragrances PK".
2. **Build:**
   ```bash
   eas build --platform ios --profile production
   ```
   EAS creates the certificates when you sign in with your Apple ID. A build takes about 15–30 minutes in the cloud.
3. **Upload to App Store Connect / TestFlight:**
   ```bash
   eas submit --platform ios --latest
   ```
4. **Test with TestFlight:**
   - Install the TestFlight app and add yourself as an internal tester.
   - Test the real build: icon, splash, orders and performance.
5. **Fill in the listing:**
   - screenshots (the largest iPhone size is required *(check)*);
   - description, keywords and support URL;
   - the privacy policy URL;
   - the **App Privacy** answers: contact info (name, phone, address) and photos (the payment screenshot), used for app functionality and not for tracking;
   - the age rating questionnaire;
   - price: Free.
6. **Submit for review.** It usually takes a day or two *(check)*. In the review notes, say:
   - the app sells physical goods;
   - payment is cash on delivery or a manual EasyPaisa / JazzCash transfer;
   - there is no account sign-in.

### Android: testing tracks, then production

1. **Create the app:** in [Google Play Console](https://play.google.com/console), go to **Create app**.
   - Name "ZED Fragrances", type App, Free.
2. **Build:**
   ```bash
   eas build --platform android --profile production
   ```
   This produces an `.aab` file.
3. **Upload the first build by hand.** Google requires the first upload through Play Console *(check)*:
   - Download the `.aab` from the build page.
   - Upload it in **Testing → Internal testing → Create new release**.
   - After that, `eas submit --platform android` can upload builds for you, once you've set up a Google service account key. Claude Code's Phase 7 guide covers it.
4. **Run a closed test.** New personal developer accounts must have a closed test with at least **12 testers opted in for 14 days** before production access *(check the current rule in Play Console)*. Recruit friends and family early.
5. **Fill in the listing:**
   - the app icon (512×512);
   - the feature graphic (1024×500);
   - phone screenshots;
   - short and full descriptions;
   - the privacy policy URL;
   - the **Data safety** form: name, phone, address and photos are collected for app functionality, sent over HTTPS, not shared for advertising, and the app has no ads;
   - the content rating questionnaire;
   - the target audience.
6. **Production:** apply for production access when the closed test is done, then promote the release.

### Keep competitors' trademarks out of the store listings

The app says "Inspired by Baccarat Rouge 540" with your disclaimer.
- **What to avoid:** both stores reject listings that put other brands' trademarks in the app name, subtitle, keywords or promotional text.
- **What to use instead:** describe the listing in your own words ("luxury inspired-by fragrances").
- **If review questions the in-app references:** answer with the disclaimer, and be ready to adjust wording.

---

## Part 8: After launch

| You want to… | Do this | Store review? |
|---|---|---|
| Change a price or mark something sold out | Edit the Catalogue tab in the sheet | No. Live within minutes, in the app and on the website |
| Change the delivery or COD fee | Change `DELIVERY_FEE` / `COD_FEE` in `Code.gs`, publish a new version, and update the fallbacks in both `brand.ts` files | No |
| Change text, a story, colours or images, or add a product | Make the change in the app (Claude Code), test it, commit, then `eas update --channel production`. For a new product, also add its Catalogue rows and its entry in the website's `products.ts` | No. Users get it the next time they open the app (sometimes the time after) |
| Add a native library, change the icon, splash or permissions, or upgrade the Expo SDK | Bump the version, then `eas build` + `eas submit` for both platforms | Yes |
| Handle orders | The website's `/admin`, exactly as today | – |

**Before every `eas update`,** test the change locally on both phones. An update goes to everyone immediately.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| The phone can't open the QR code / "could not connect" | Same Wi-Fi on both, or `npx expo start --tunnel` |
| "Project is incompatible with this version of Expo Go" | Update Expo Go from the store. The project and Expo Go must use the same Expo SDK |
| A library "isn't available in Expo Go" | It needs a development build: `eas build --profile development`, then install that build instead of Expo Go. Ask Claude Code first whether a library without native code would do |
| `.env` changes don't take effect | Restart with `npx expo start --clear` |
| Orders fail with `unauthorized` | `APP_KEY` in the script and the app's key differ, or the script wasn't published as a new version |
| Prices don't update in the app | Check `<web app URL>?action=catalogue` in a browser. If it shows the new prices, reopen the app; if not, see the website's `google-apps-script/README.md` |
| Works in Expo Go but not in the store build | The EAS environment variables are missing for that environment (Part 7) |
| Everything feels slow in development | Normal in development mode. Judge with `npx expo start --no-dev --minify` or a real build |
