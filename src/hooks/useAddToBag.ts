import { router } from "expo-router";
import { useCallback } from "react";
import { brand } from "@/config/brand";
import { firstInStock } from "@/lib/catalogue";
import { announce } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useCart } from "@/stores/cart";
import { useCatalogue } from "@/stores/catalogue";
import { useToast } from "@/stores/toast";
import type { Product } from "@/types/product";

const copy = brand.copy.cart;

/** Adds a size to the bag with a light haptic, a toast ("Added to bag" · "View bag") and an announcement. */
export function useAddToBag() {
  const add = useCart((state) => state.add);
  const show = useToast((state) => state.show);

  const addSize = useCallback(
    (product: Product, ml: number, { toast = true }: { toast?: boolean } = {}) => {
      add(product.slug, ml);
      haptics.light();
      announce(`${copy.added}: ${product.name} ${ml}ml`);
      if (toast) show({ message: `${copy.added} · ${product.name}`, action: { label: copy.viewBag, onPress: () => router.navigate("/bag") } });
    },
    [add, show],
  );

  /** "Order Now": the first in-stock size, then the Bag. Returns false when everything is sold out. */
  const orderNow = useCallback(
    (product: Product) => {
      const size = firstInStock(product, useCatalogue.getState().catalogue);
      if (!size) return false;
      addSize(product, size.ml, { toast: false });
      router.navigate("/bag");
      return true;
    },
    [addSize],
  );

  return { addSize, orderNow };
}
