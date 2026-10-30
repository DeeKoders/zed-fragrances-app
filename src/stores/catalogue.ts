import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CATALOGUE_MAX_AGE, isStale, type Catalogue } from "@/lib/catalogue";
import { fetchCatalogue } from "@/lib/orders";

type CatalogueState = {
  /** The last good catalogue (persisted), or null until one has loaded: the bundled values apply. */
  catalogue: Catalogue | null;
  loading: boolean;
  lastAttempt: number;
  set: (catalogue: Catalogue) => void;
  /**
   * Loads a fresh catalogue. `ifOlderThan` skips the request while the last attempt is newer than
   * that (default 5 minutes); `force` always asks. Resolves to the catalogue in use afterwards.
   */
  refresh: (options?: { force?: boolean; ifOlderThan?: number }) => Promise<Catalogue | null>;
};

let inflight: Promise<Catalogue | null> | null = null;

export const useCatalogue = create<CatalogueState>()(
  persist(
    (set, get) => ({
      catalogue: null,
      loading: false,
      lastAttempt: 0,
      set: (catalogue) => set({ catalogue }),
      refresh: ({ force = false, ifOlderThan = CATALOGUE_MAX_AGE } = {}) => {
        const now = Date.now();
        if (!force && now - get().lastAttempt < ifOlderThan) return Promise.resolve(get().catalogue);
        if (inflight) return inflight;
        set({ loading: true, lastAttempt: now });
        inflight = fetchCatalogue()
          .then((fresh) => {
            if (fresh) set({ catalogue: fresh });
            return fresh ?? get().catalogue;
          })
          .finally(() => {
            inflight = null;
            set({ loading: false });
          });
        return inflight;
      },
    }),
    {
      name: "zed-catalogue",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ catalogue: state.catalogue }),
    },
  ),
);

/** Makes sure the catalogue is under 5 minutes old (checkout does this before showing an amount). */
export function ensureFreshCatalogue() {
  const { catalogue, refresh } = useCatalogue.getState();
  return isStale(catalogue) ? refresh({ force: true }) : Promise.resolve(catalogue);
}
