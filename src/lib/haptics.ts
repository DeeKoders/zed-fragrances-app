import * as Haptics from "expo-haptics";

// Haptics replace the website's cursor: light on primary actions, selection on choices,
// success / warning on order results. Failures (simulators, disabled haptics) are ignored.

const safe = (run: () => Promise<void>) => () => void run().catch(() => undefined);

export const haptics = {
  light: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: safe(() => Haptics.selectionAsync()),
  success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
