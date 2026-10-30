import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = { slug: string; ml: number; quantity: number };

export const MAX_QUANTITY = 20;

type CartState = {
  items: CartItem[];
  add: (slug: string, ml: number, quantity?: number) => void;
  setQuantity: (slug: string, ml: number, quantity: number) => void;
  remove: (slug: string, ml: number) => void;
  clear: () => void;
};

const same = (item: CartItem, slug: string, ml: number) => item.slug === slug && item.ml === ml;
const clamp = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)));

/** The bag. Items persist to AsyncStorage (key "zed-cart"), the same store and limits as the website. */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (slug, ml, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => same(item, slug, ml));
          const items = existing
            ? state.items.map((item) => (item === existing ? { ...item, quantity: clamp(item.quantity + quantity) } : item))
            : [...state.items, { slug, ml, quantity: clamp(quantity) }];
          return { items };
        }),
      setQuantity: (slug, ml, quantity) =>
        set((state) => ({
          items: state.items.map((item) => (same(item, slug, ml) ? { ...item, quantity: clamp(quantity) } : item)),
        })),
      remove: (slug, ml) => set((state) => ({ items: state.items.filter((item) => !same(item, slug, ml)) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "zed-cart",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCount = (state: CartState) => state.items.reduce((total, item) => total + item.quantity, 0);
