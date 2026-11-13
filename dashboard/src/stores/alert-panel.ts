import { create } from "zustand";

interface AlertPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useAlertPanel = create<AlertPanelState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
