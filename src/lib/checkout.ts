import { brand } from "@/config/brand";
import { getProduct } from "@/data/products";
import type { CartItem } from "@/stores/cart";
import type { Product } from "@/types/product";
import { feesOf, sizesOf, type Catalogue } from "./catalogue";
import { formatPrice } from "./format";

// Port of the website's src/lib/checkout.ts. Prices and fees are read through the live catalogue
// overlay (sizesOf / feesOf); placeOrder lives in ./orders (it talks to the orders script directly).

export type OrderLine = {
  product: Product;
  ml: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  inStock: boolean;
};

export type Order = {
  lines: OrderLine[];
  /** Sum of known prices. */
  total: number;
  /** True when any line is still "price on request" (price 0). */
  hasPriceOnRequest: boolean;
};

/** Resolves cart items against the catalogue; items whose product or size no longer exists are dropped. */
export function buildOrder(items: CartItem[], catalogue: Catalogue | null = null): Order {
  const lines = items.flatMap((item) => {
    const product = getProduct(item.slug);
    const size = product ? sizesOf(product, catalogue).find((entry) => entry.ml === item.ml) : undefined;
    if (!product || !size) return [];
    return [
      {
        product,
        ml: size.ml,
        quantity: item.quantity,
        unitPrice: size.price,
        lineTotal: size.price * item.quantity,
        inStock: size.inStock,
      },
    ];
  });
  return {
    lines,
    total: lines.reduce((total, line) => total + line.lineTotal, 0),
    hasPriceOnRequest: lines.some((line) => line.unitPrice === 0),
  };
}

/**
 * How the customer pays: "wallet" is EasyPaisa / JazzCash with a payment screenshot, "cod" is cash on
 * delivery. To plug in a gateway later, add a method here, its copy in brand.copy.checkout and its
 * option in the checkout screen.
 */
export type PaymentMethod = "wallet" | "cod";

export const paymentMethods: PaymentMethod[] = ["wallet", "cod"];

export type Customer = { name: string; phone: string; city: string; address: string; notes: string };

/** A payment screenshot, base64-encoded for the JSON request. */
export type Screenshot = { name: string; type: string; data: string };

/** What the app sends to the orders script. The script re-prices the items from the catalogue. */
export type OrderRequest = {
  items: CartItem[];
  customer: Customer;
  payment: PaymentMethod;
  screenshot: Screenshot | null;
  /** The total the customer saw; the script refuses the order with `price-changed` if its own differs. */
  expectedTotal: number;
  /** Reused across retries so a retry after a timeout never creates a second order. */
  requestId: string;
};

export type OrderTotals = { subtotal: number; delivery: number; codFee: number; total: number };

/** Items plus delivery, plus the COD charge when paying cash on delivery. */
export function orderTotals(order: Order, payment: PaymentMethod, catalogue: Catalogue | null = null): OrderTotals {
  const { deliveryFee, codFee } = feesOf(catalogue);
  const cod = payment === "cod" ? codFee : 0;
  return { subtotal: order.total, delivery: deliveryFee, codFee: cod, total: order.total + deliveryFee + cod };
}

/** Extra charge shown on a payment option. */
export function paymentFee(payment: PaymentMethod, catalogue: Catalogue | null = null) {
  return payment === "cod" ? feesOf(catalogue).codFee : 0;
}

export function paymentLabel(payment: PaymentMethod) {
  return brand.copy.checkout[payment].label;
}

/** One line per item: "• Sovereign 30ml × 2: Rs 2,798". */
export function itemLines(order: Order) {
  return order.lines.map((line) => {
    const price = line.unitPrice > 0 ? formatPrice(line.lineTotal) : brand.copy.whatsapp.onRequest;
    return `• ${line.product.name} ${line.ml}ml × ${line.quantity}: ${price}`;
  });
}

/** Pakistani mobile numbers in any common form: 0300 1234567, +92 300 1234567, 0092-300-1234567, … */
export const PHONE_PATTERN = String.raw`[\s\-]*(\+|00)?(92)?[\s\-]*0?3([\s\-]*[0-9]){9}[\s\-]*`;

/** "0300-1234567" for anything PHONE_PATTERN accepts, otherwise null. */
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^(?:00)?(?:92)?0?/, "");
  return /^3\d{9}$/.test(digits) ? `0${digits.slice(0, 3)}-${digits.slice(3)}` : null;
}

/** Fallback when an order can't be placed: the same order as a prefilled WhatsApp message. */
export function orderMessage(order: Order, payment: PaymentMethod, customer: Customer, catalogue: Catalogue | null = null) {
  const copy = brand.copy;
  const totals = orderTotals(order, payment, catalogue);
  const onRequest = order.hasPriceOnRequest ? ` (+ ${copy.whatsapp.onRequest})` : "";
  return [
    copy.whatsapp.greeting,
    "",
    ...itemLines(order),
    "",
    `${copy.cart.subtotal}: ${formatPrice(totals.subtotal)}`,
    `${copy.cart.delivery}: ${formatPrice(totals.delivery)}`,
    ...(totals.codFee > 0 ? [`${copy.checkout.codFee}: ${formatPrice(totals.codFee)}`] : []),
    `${copy.cart.total}: ${formatPrice(totals.total)}${onRequest}`,
    `${copy.checkout.payment}: ${paymentLabel(payment)}`,
    "",
    `${copy.checkout.name}: ${customer.name}`,
    `${copy.checkout.phone}: ${customer.phone}`,
    `${copy.checkout.city}: ${customer.city}`,
    `${copy.checkout.address}: ${customer.address}`,
    ...(customer.notes ? ["", customer.notes] : []),
  ].join("\n");
}

/** Field limits, the same as the website and the orders script. */
export const LIMITS = { name: 80, city: 60, address: 300, notes: 500 } as const;

export type FieldErrors = Partial<Record<keyof Customer, string>>;

/** Inline errors for the delivery details, in field order. Empty when everything is valid. */
export function validateCustomer(customer: Customer): FieldErrors {
  const copy = brand.copy.checkout;
  const errors: FieldErrors = {};
  const required = (field: "name" | "city" | "address") => {
    const value = customer[field].trim();
    if (!value) errors[field] = copy.required;
    else if (value.length > LIMITS[field]) errors[field] = copy.tooLong;
  };
  required("name");
  if (!normalizePhone(customer.phone)) errors.phone = copy.phoneHint;
  required("city");
  required("address");
  if (customer.notes.length > LIMITS.notes) errors.notes = copy.tooLong;
  return errors;
}

/** True when two orders would charge the same: same lines, prices, stock and fees. */
export function sameCharges(a: Order, b: Order, aTotals: OrderTotals, bTotals: OrderTotals) {
  const key = (order: Order) =>
    order.lines.map((line) => `${line.product.slug}:${line.ml}:${line.quantity}:${line.unitPrice}:${line.inStock}`).join("|");
  return key(a) === key(b) && aTotals.total === bTotals.total && aTotals.codFee === bTotals.codFee;
}
