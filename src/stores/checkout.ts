import { randomUUID } from "expo-crypto";
import { create } from "zustand";
import type { Customer, PaymentMethod } from "@/lib/checkout";
import type { PreparedScreenshot } from "@/lib/screenshot";

export const emptyCustomer: Customer = { name: "", phone: "", city: "", address: "", notes: "" };

type CheckoutState = {
  /** Kept in memory for the session, like the website: name, phone, city and address stay filled. */
  customer: Customer;
  choice: PaymentMethod;
  screenshot: PreparedScreenshot | null;
  /** True while an order is in flight: the sheet can't be dismissed. */
  sending: boolean;
  setField: (field: keyof Customer, value: string) => void;
  setChoice: (choice: PaymentMethod) => void;
  setScreenshot: (screenshot: PreparedScreenshot | null) => void;
  setSending: (sending: boolean) => void;
  /** After a placed order: the screenshot and notes clear, the rest stays. */
  placed: () => void;
};

export const useCheckout = create<CheckoutState>()((set) => ({
  customer: emptyCustomer,
  choice: "wallet",
  screenshot: null,
  sending: false,
  setField: (field, value) => set((state) => ({ customer: { ...state.customer, [field]: value } })),
  setChoice: (choice) => set({ choice }),
  setScreenshot: (screenshot) => set({ screenshot }),
  setSending: (sending) => set({ sending }),
  placed: () => set((state) => ({ screenshot: null, customer: { ...state.customer, notes: "" } })),
}));

/**
 * The order's requestId. The same id is reused for as long as the order is the same (bag, details,
 * payment and screenshot), so a retry after a timeout can't create a second order; any change, or
 * a successful order, starts a new one.
 */
let current: { fingerprint: string; id: string } | null = null;

export function requestIdFor(fingerprint: string) {
  if (!current || current.fingerprint !== fingerprint) current = { fingerprint, id: randomUUID() };
  return current.id;
}

export function resetRequestId() {
  current = null;
}
