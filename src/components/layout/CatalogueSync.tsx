import { useEffect } from "react";
import { AppState } from "react-native";
import { useCatalogue } from "@/stores/catalogue";

/**
 * Keeps the live catalogue fresh: loads it at launch and again on returning to the foreground (at
 * most every 5 minutes). Checkout asks for its own fresh copy when it opens.
 */
export function CatalogueSync() {
  useEffect(() => {
    void useCatalogue.getState().refresh({ force: true });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void useCatalogue.getState().refresh();
    });
    return () => subscription.remove();
  }, []);
  return null;
}
