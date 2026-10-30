import type { FeatureIcon, ImageSource, ThemeSpec } from "./product";

export type ImageAsset = { source: ImageSource; width: number; height: number };

export type GoldStop = "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

/** The app's tabs, in order. `route` is the file in src/app/(tabs). */
export type TabRoute = "index" | "finder" | "collection" | "bag";

export type Brand = {
  name: string;
  shortName: string;
  description: string;
  /** The website. Linked from the footer and used in share text. */
  siteUrl: string;
  taglines: {
    primary: string;
    quality: string;
    drop: string;
    urgency: string;
  };
  logo: {
    /** The official logo file, untouched. */
    full: ImageAsset;
    /** Crop of the official logo (ZED + FRAGRANCES) with its black background turned to transparency. */
    wordmark: ImageAsset;
  };
  /** Constant colours. Gold is the brand anchor and never morphs. */
  palette: {
    ink: { "950": string; "900": string; "800": string; "700": string };
    line: string;
    ivory: string;
    ivoryMuted: string;
    gold: Record<GoldStop, string>;
  };
  /** The app's world when no product is active. */
  houseTheme: ThemeSpec;
  /** The tab bar, in order (the website's nav). Labels live in copy.tabs. */
  tabs: TabRoute[];
  socials: { label: string; href: string }[];
  /** International format without "+", e.g. 923001234567. */
  whatsapp: string;
  currency: string;
  locale: string;
  /**
   * Checkout fees and payment details. Amounts are in `currency`. The fees are fallbacks: the live
   * values come from the orders script's catalogue.
   */
  checkout: {
    /** Added to every order. */
    deliveryFee: number;
    /** Added on top when the customer pays cash on delivery. */
    codFee: number;
    /** Mobile wallet the customer pays into before uploading a screenshot. */
    wallet: { providers: string[]; accountNumber: string; accountTitle: string };
  };
  dropBanner: {
    enabled: boolean;
    eyebrow: string;
    text: string;
    /** Optional stock meter. */
    stock: { remaining: number; total: number } | null;
    /** Optional countdown target, ISO 8601. */
    countdownTo: string | null;
    /** Mood image behind the banner (darkened), optional. */
    image: ImageAsset | null;
  };
  disclaimer: string;
  /** The brand-wide feature strip (4 items). Icons: see FeatureIcon in types/product.ts. */
  features: { icon: FeatureIcon; label: string }[];
  /** Interface copy, so components never hardcode words. */
  copy: {
    /** App: tab bar labels. */
    tabs: Record<TabRoute, string>;
    /** Prefix for a product's reference fragrance: "Inspired by Baccarat Rouge 540". */
    inspiredBy: string;
    hero: {
      /** Product call to action, followed by the product name: "Discover Sovereign". */
      cta: string;
      scroll: string;
      previous: string;
      next: string;
    };
    worlds: {
      /** Heading of the product chapters section (read by assistive tech). */
      title: string;
      /** Second call to action in a chapter. */
      order: string;
      notes: { title: string; top: string; heart: string; base: string };
      vibe: { longevity: string; projection: string; seasons: string; occasions: string };
    };
    /** Shown instead of a price while it is 0. */
    priceOnRequest: string;
    finder: {
      eyebrow: string;
      title: string;
      intro: string;
      start: string;
      step: string;
      of: string;
      back: string;
      restart: string;
      resultEyebrow: string;
      match: string;
      /** App: the Home teaser card. */
      teaser: string;
    };
    collection: {
      eyebrow: string;
      title: string;
      compare: string;
      compareDone: string;
      compareHint: string;
      select: string;
      clear: string;
      inspiredBy: string;
      concentration: string;
      sizes: string;
    };
    drop: { cta: string; stock: string; endsIn: string; units: { days: string; hours: string; minutes: string; seconds: string } };
    reviews: { eyebrow: string; title: string };
    footer: {
      fragrances: string;
      connect: string;
      whatsapp: string;
      /** App: the website link. */
      website: string;
      /** App: "Version 1.0.0". */
      version: string;
      newsletter: {
        title: string;
        text: string;
        label: string;
        placeholder: string;
        submit: string;
        success: string;
        error: string;
      };
    };
    cart: {
      title: string;
      bag: string;
      items: string;
      empty: string;
      emptyCta: string;
      close: string;
      remove: string;
      increase: string;
      decrease: string;
      quantity: string;
      subtotal: string;
      delivery: string;
      total: string;
      onRequestNote: string;
      checkout: string;
      /** Product screen: puts that size in the bag and opens checkout. */
      buyNow: string;
      addToBag: string;
      outOfStock: string;
      /** App: the toast after adding. */
      added: string;
      viewBag: string;
    };
    checkout: {
      title: string;
      close: string;
      back: string;
      details: string;
      name: string;
      phone: string;
      /** Shown under the phone field and as its error. */
      phoneHint: string;
      city: string;
      address: string;
      notes: string;
      payment: string;
      wallet: { label: string; hint: string };
      cod: { label: string; hint: string };
      /** Shown instead of the wallet option while a price is on request. */
      walletUnavailable: string;
      summary: string;
      codFee: string;
      continue: string;
      placeOrder: string;
      placing: string;
      /** App: inline field errors. */
      required: string;
      tooLong: string;
      pay: {
        title: string;
        intro: string;
        accountNumber: string;
        accountTitle: string;
        amount: string;
        copy: string;
        copied: string;
      };
      screenshot: {
        label: string;
        hint: string;
        choose: string;
        replace: string;
        remove: string;
        preview: string;
        required: string;
        invalid: string;
        /** App: photo library access denied. */
        permission: string;
        settings: string;
      };
      error: string;
      errorWhatsapp: string;
      /** App: no connection. */
      offline: string;
      /** App: the catalogue changed under the order. */
      pricesChanged: string;
      soldOut: string;
      tooMany: string;
      done: {
        title: string;
        order: string;
        wallet: string;
        cod: string;
        cta: string;
        help: string;
      };
    };
    product: {
      size: string;
      gallery: string;
      openImage: string;
      zoom: string;
      close: string;
      previous: string;
      next: string;
      pairs: string;
      details: string;
      /** App. */
      share: string;
      back: string;
      image: string;
    };
    /** Prefilled WhatsApp messages: the order fallback when checkout fails, and order questions. */
    whatsapp: {
      greeting: string;
      onRequest: string;
      question: string;
    };
    /** App only. */
    notFound: { title: string; text: string; cta: string };
  };
};
