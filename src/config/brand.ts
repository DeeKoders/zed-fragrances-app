import type { Brand } from "@/types/brand";

// Brand settings and every interface string. Values shared with the website (src/config/brand.ts
// there) must stay identical; app-only strings are marked "App".

const gold: Brand["palette"]["gold"] = {
  "100": "#F8E9B8",
  "200": "#EED48A",
  "300": "#E2BE62",
  "400": "#D4A848",
  "500": "#C5963A",
  "600": "#A6782A",
  "700": "#7F5A1E",
  "800": "#5A3F15",
  "900": "#33240C",
};

export const brand: Brand = {
  name: "ZED Fragrances",
  shortName: "ZED",
  description:
    "Luxury inspired-by perfumes with their own worlds. Sovereign and Dominator: signature scents for a distinctive you.",
  // Switch to the custom domain once it's connected in Netlify (same as the website).
  siteUrl: "https://zed-fragrances.netlify.app",

  taglines: {
    primary: "Signature Scents. Distinctive You.",
    quality: "Premium Quality. Timeless Scents.",
    drop: "First Batch Ready",
    urgency: "Limited Stock. Grab Yours Before It Ends.",
  },

  logo: {
    full: { source: require("@/assets/brand/zed-logo.png"), width: 1254, height: 1254 },
    // Generated from zed-wordmark.png (black → transparent); identical to it on black.
    wordmark: { source: require("@/assets/brand/zed-wordmark-alpha.png"), width: 914, height: 445 },
  },

  palette: {
    ink: { "950": "#050505", "900": "#0B0A09", "800": "#14120F", "700": "#1F1B16" },
    line: "#2B261F",
    ivory: "#F2EAD8",
    ivoryMuted: "#B5AA95",
    gold,
  },

  houseTheme: { accent: gold["500"], texture: "smoke", mood: "warm" },

  tabs: ["index", "finder", "collection", "bag"],

  // Placeholders: replace with the real profiles (same as the website).
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "TikTok", href: "https://tiktok.com/" },
    { label: "Facebook", href: "https://facebook.com/" },
  ],

  whatsapp: "923127373848",
  currency: "PKR",
  locale: "en-PK",

  checkout: {
    // Fallbacks: the live fees come from the orders script (DELIVERY_FEE / COD_FEE in Code.gs).
    deliveryFee: 150,
    codFee: 50,
    wallet: { providers: ["EasyPaisa", "JazzCash"], accountNumber: "0312-7373848", accountTitle: "Danyal Ahmad" },
  },

  dropBanner: {
    enabled: true,
    eyebrow: "First Batch Ready",
    text: "Limited Stock. Grab yours before it ends.",
    stock: null,
    countdownTo: null,
    // Mood only: its labels contain text errors, so never use it for bottle close-ups.
    image: { source: require("@/assets/images/reference/first-batch-poster.webp"), width: 1024, height: 1536 },
  },

  disclaimer:
    "ZED Fragrances is not affiliated with or endorsed by the brands referenced. Names are used for comparison only; all trademarks belong to their respective owners.",

  features: [
    { icon: "lotus", label: "Luxury Scent" },
    { icon: "clock", label: "Long Lasting" },
    { icon: "diamond", label: "Premium Quality" },
    { icon: "leaves", label: "Rich & Captivating" },
  ],

  copy: {
    // App
    tabs: { index: "Home", finder: "Finder", collection: "Collection", bag: "Bag" },
    inspiredBy: "Inspired by",
    hero: {
      cta: "Discover",
      scroll: "Scroll",
      previous: "Previous fragrance",
      next: "Next fragrance",
    },
    worlds: {
      title: "The Worlds",
      order: "Order Now",
      notes: { title: "Notes", top: "Top", heart: "Heart", base: "Base" },
      vibe: { longevity: "Longevity", projection: "Projection", seasons: "Seasons", occasions: "Occasions" },
    },
    priceOnRequest: "Price on request",
    finder: {
      eyebrow: "Scent Finder",
      title: "Find your world",
      intro: "Four quick choices. We'll match you to the scent that feels like you.",
      start: "Begin",
      step: "Step",
      of: "of",
      back: "Back",
      restart: "Start again",
      resultEyebrow: "Your signature",
      match: "match",
      // App
      teaser: "Take the Scent Finder",
    },
    collection: {
      eyebrow: "The Collection",
      title: "Every world, side by side",
      compare: "Compare",
      compareDone: "Done comparing",
      compareHint: "Pick up to three fragrances to compare.",
      select: "Add to compare",
      clear: "Clear",
      inspiredBy: "Inspired by",
      concentration: "Concentration",
      sizes: "Sizes",
    },
    drop: {
      cta: "Shop the first batch",
      stock: "left",
      endsIn: "Ends in",
      units: { days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec" },
    },
    reviews: { eyebrow: "Reviews", title: "Worn and loved" },
    footer: {
      fragrances: "Fragrances",
      connect: "Connect",
      whatsapp: "WhatsApp",
      // App
      website: "Website",
      version: "Version",
      newsletter: {
        title: "The inner circle",
        text: "New drops and restocks, first.",
        label: "Email address",
        placeholder: "you@example.com",
        submit: "Join",
        success: "You're on the list.",
        error: "Something went wrong. Please try again.",
      },
    },
    cart: {
      title: "Your bag",
      bag: "Bag",
      items: "items",
      empty: "Your bag is empty.",
      emptyCta: "Explore the collection",
      close: "Close bag",
      remove: "Remove",
      increase: "Increase quantity",
      decrease: "Decrease quantity",
      quantity: "Quantity",
      subtotal: "Subtotal",
      delivery: "Delivery",
      total: "Total",
      onRequestNote: "Some prices are on request; we'll confirm them before dispatch.",
      checkout: "Checkout",
      buyNow: "Buy now",
      addToBag: "Add to bag",
      outOfStock: "Sold out",
      // App
      added: "Added to bag",
      viewBag: "View bag",
    },
    checkout: {
      title: "Checkout",
      close: "Close checkout",
      back: "Back",
      details: "Delivery details",
      name: "Full name",
      phone: "Phone number",
      phoneHint: "Pakistani mobile number, e.g. 0300 1234567",
      city: "City",
      address: "Full address",
      notes: "Order notes (optional)",
      payment: "Payment",
      wallet: { label: "EasyPaisa / JazzCash", hint: "Pay now and upload a screenshot" },
      cod: { label: "Cash on Delivery", hint: "Pay when your order arrives" },
      walletUnavailable: "Some prices are on request, so this order is cash on delivery.",
      summary: "Order summary",
      codFee: "COD charges",
      continue: "Continue to payment",
      placeOrder: "Place order",
      placing: "Placing order…",
      // App
      required: "Please fill this in.",
      tooLong: "That's too long.",
      pay: {
        title: "Send your payment",
        intro: "Send the total to either account below, then upload a screenshot of the payment.",
        accountNumber: "Account number",
        accountTitle: "Account title",
        amount: "Amount to send",
        copy: "Copy",
        copied: "Copied",
      },
      screenshot: {
        label: "Payment screenshot",
        hint: "A photo or screenshot of the payment confirmation.",
        choose: "Upload screenshot",
        replace: "Replace",
        remove: "Remove",
        preview: "Your payment screenshot",
        required: "Please upload a screenshot of your payment.",
        invalid: "We couldn't read that file. Please choose an image under 10 MB.",
        // App
        permission: "To upload your screenshot, allow ZED Fragrances to access your photos in Settings.",
        settings: "Open Settings",
      },
      error: "We couldn't place your order. Please try again, or send it to us on WhatsApp.",
      errorWhatsapp: "Order on WhatsApp",
      // App
      offline: "You're offline. Check your connection and try again, or send your order to us on WhatsApp.",
      pricesChanged: "Prices or stock just changed. Please check the new total before you continue.",
      soldOut: "Some items just sold out. Remove them from your bag to continue.",
      tooMany: "Too many orders from this number just now. Please wait a few minutes, or send your order to us on WhatsApp.",
      done: {
        title: "Order placed",
        order: "Order",
        wallet: "Your order is placed. Please wait for confirmation (takes around 1 working day).",
        cod: "Your order is placed. We'll contact you to confirm it before dispatch.",
        cta: "Continue shopping",
        help: "Questions? Message us on WhatsApp",
      },
    },
    product: {
      size: "Size",
      gallery: "Gallery",
      openImage: "Open image",
      zoom: "Zoom",
      close: "Close",
      previous: "Previous image",
      next: "Next image",
      pairs: "Pairs well with",
      details: "The scent",
      // App
      share: "Share",
      back: "Back",
      image: "Image",
    },
    whatsapp: {
      greeting: "Hello ZED Fragrances! I'd like to order:",
      onRequest: "price on request",
      question: "Hello ZED Fragrances! I have a question about my order",
    },
    // App
    notFound: {
      title: "Lost in the smoke",
      text: "This fragrance isn't in the collection.",
      cta: "Back to home",
    },
  },
};
