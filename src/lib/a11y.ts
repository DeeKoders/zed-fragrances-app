import type { ComponentRef, RefObject } from "react";
import { AccessibilityInfo, findNodeHandle, type Text, type View } from "react-native";

export type FocusRef = RefObject<ComponentRef<typeof View> | ComponentRef<typeof Text> | null>;

/** Reads a short message out with VoiceOver / TalkBack. */
export function announce(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
}

/** Moves screen-reader focus to an element (e.g. a checkout step's heading) once it has rendered. */
export function focusOn(ref: FocusRef, delay = 350) {
  setTimeout(() => {
    const node = ref.current ? findNodeHandle(ref.current) : null;
    if (node) AccessibilityInfo.setAccessibilityFocus(node);
  }, delay);
}
