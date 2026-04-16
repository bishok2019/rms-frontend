import { create } from "zustand";

interface SidebarSettings {
  disabled: boolean;
}

interface SidebarState {
  isOpen: boolean;
  isHover: boolean;
  settings: SidebarSettings;
  toggleOpen: () => void;
  setIsHover: (hover: boolean) => void;
  getOpenState: () => boolean;
  setSettings: (settings: SidebarSettings) => void;
}

export const useSidebar = create<SidebarState>((set, get) => ({
  isOpen: true,
  isHover: false,
  settings: { disabled: false },
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsHover: (hover) => set({ isHover: hover }),
  getOpenState: () => {
    const state = get();
    return state.isOpen || state.isHover;
  },
  setSettings: (settings) => set({ settings }),
}));
