import * as Network from "expo-network";
import { parseCatalogue, type Catalogue } from "./catalogue";
import { normalizePhone, type OrderRequest } from "./checkout";

// Talks to the orders Google Apps Script directly (the same deployment as the website). The app
// carries only the script URL and the app-only key, which can read prices and place orders and
// nothing else. Never put the script's SECRET in the app.

const SCRIPT_URL = process.env.EXPO_PUBLIC_ORDERS_SCRIPT_URL ?? "";
const APP_KEY = process.env.EXPO_PUBLIC_ORDERS_APP_KEY ?? "";

const ORDER_TIMEOUT = 30_000;
const CATALOGUE_TIMEOUT = 15_000;

export const ordersConfigured = SCRIPT_URL.length > 0 && APP_KEY.length > 0;

export type OrderError = "invalid" | "sold-out" | "price-changed" | "too-many" | "unauthorized" | "offline" | "failed";

export type OrderResult =
  | { ok: true; id: string }
  | { ok: false; error: OrderError; catalogue: Catalogue | null };

const KNOWN: OrderError[] = ["invalid", "sold-out", "price-changed", "too-many", "unauthorized"];

/** fetch with a timeout. Apps Script answers after a redirect, which fetch follows. */
async function request(url: string, init: RequestInit, timeout: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...init, redirect: "follow", signal: controller.signal });
    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  } finally {
    clearTimeout(timer);
  }
}

async function isOffline() {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false;
  }
}

/** The live catalogue (prices, stock and fees), or null when it can't be loaded. Needs no key. */
export async function fetchCatalogue(): Promise<Catalogue | null> {
  if (!SCRIPT_URL) return null;
  try {
    const body = await request(`${SCRIPT_URL}?action=catalogue`, { method: "GET" }, CATALOGUE_TIMEOUT);
    if (typeof body !== "object" || body === null || !("ok" in body) || body.ok !== true) return null;
    return parseCatalogue(body);
  } catch {
    return null;
  }
}

/**
 * Sends the order to the orders script. Never throws and never retries on its own: answers
 * { ok: true, id } or { ok: false, error, catalogue } (the script sends a fresh catalogue with
 * `sold-out` and `price-changed`).
 */
export async function placeOrder(order: OrderRequest): Promise<OrderResult> {
  if (!ordersConfigured) return { ok: false, error: "unauthorized", catalogue: null };
  const payload = {
    appKey: APP_KEY,
    action: "order",
    requestId: order.requestId,
    order: {
      items: order.items.map(({ slug, ml, quantity }) => ({ slug, ml, quantity })),
      customer: {
        name: order.customer.name.trim(),
        phone: normalizePhone(order.customer.phone) ?? order.customer.phone.trim(),
        city: order.customer.city.trim(),
        address: order.customer.address.trim(),
        notes: order.customer.notes.trim(),
      },
      payment: order.payment,
      screenshot: order.payment === "wallet" ? order.screenshot : null,
      expectedTotal: order.expectedTotal,
    },
  };

  let body: unknown;
  try {
    body = await request(
      SCRIPT_URL,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      ORDER_TIMEOUT,
    );
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { ok: false, error: !aborted && (await isOffline()) ? "offline" : "failed", catalogue: null };
  }

  if (typeof body !== "object" || body === null) return { ok: false, error: "failed", catalogue: null };
  const result = body as { ok?: unknown; id?: unknown; error?: unknown; catalogue?: unknown };
  if (result.ok === true && typeof result.id === "string") return { ok: true, id: result.id };
  const code = typeof result.error === "string" ? result.error.toLowerCase() : "";
  const error = KNOWN.find((known) => known === code) ?? "failed";
  return { ok: false, error, catalogue: parseCatalogue(result.catalogue) };
}
