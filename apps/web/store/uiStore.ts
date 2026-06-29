import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  shortcutsModalOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (focus: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleShortcutsModal: () => void;
  setShortcutsModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  focusMode: false,
  commandPaletteOpen: false,
  shortcutsModalOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  setFocusMode: (focus) => set({ focusMode: focus }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleShortcutsModal: () => set((state) => ({ shortcutsModalOpen: !state.shortcutsModalOpen })),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
}));
