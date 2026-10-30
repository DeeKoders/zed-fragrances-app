import { create } from "zustand";

/**
 * pending: not decided yet (fonts loading).
 * playing: the intro covers the app.
 * revealing: the curtain is opening; start entrance animations now.
 * done: nothing covers the app (finished, or skipped: reduced motion or a deep link).
 */
export type IntroStatus = "pending" | "playing" | "revealing" | "done";

const ORDER: IntroStatus[] = ["pending", "playing", "revealing", "done"];

type IntroState = {
  status: IntroStatus;
  /** Only moves forward, so a late signal can't rewind the intro. */
  advance: (next: IntroStatus) => void;
};

export const useIntro = create<IntroState>()((set) => ({
  status: "pending",
  advance: (next) =>
    set((state) => (ORDER.indexOf(next) > ORDER.indexOf(state.status) ? { status: next } : state)),
}));

/** True once the hero may start its entrance. */
export const selectHeroReady = (state: IntroState) => state.status === "revealing" || state.status === "done";
