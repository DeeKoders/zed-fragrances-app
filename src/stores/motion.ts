import { AccessibilityInfo } from "react-native";
import { create } from "zustand";

type MotionState = {
  /** iOS Reduce Motion / Android "Remove animations". Live: updates when the setting changes. */
  reduced: boolean;
  /** True once the setting has been read at least once. */
  known: boolean;
  set: (reduced: boolean) => void;
};

export const useMotionStore = create<MotionState>()((set) => ({
  reduced: false,
  known: false,
  set: (reduced) => set({ reduced, known: true }),
}));

/** Reads the system setting and follows its changes. Returns an unsubscribe function. */
export function watchReducedMotion() {
  AccessibilityInfo.isReduceMotionEnabled()
    .then((reduced) => useMotionStore.getState().set(reduced))
    .catch(() => useMotionStore.getState().set(false));
  const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) =>
    useMotionStore.getState().set(reduced),
  );
  return () => subscription.remove();
}

export function useReducedMotion() {
  return useMotionStore((state) => state.reduced);
}
