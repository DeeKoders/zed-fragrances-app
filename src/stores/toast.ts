import { create } from "zustand";

export type Toast = { id: number; message: string; action?: { label: string; onPress: () => void } };

type ToastState = {
  toast: Toast | null;
  show: (toast: Omit<Toast, "id">) => void;
  hide: (id?: number) => void;
};

let next = 1;

export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (toast) => set({ toast: { ...toast, id: next++ } }),
  hide: (id) => set((state) => (id === undefined || state.toast?.id === id ? { toast: null } : state)),
}));
