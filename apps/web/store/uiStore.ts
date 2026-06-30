import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  focusMode: boolean;
  commandPaletteOpen: boolean;
  shortcutsModalOpen: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  compareMode: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (focus: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleShortcutsModal: () => void;
  setShortcutsModalOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  toggleAbout: () => void;
  setAboutOpen: (open: boolean) => void;
  setCompareMode: (compare: boolean) => void;
  toggleCompareMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false, // Default closed for clean workspace startup
  focusMode: false,
  commandPaletteOpen: false,
  shortcutsModalOpen: false,
  settingsOpen: false,
  aboutOpen: false,
  compareMode: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  setFocusMode: (focus) => set({ focusMode: focus }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleShortcutsModal: () => set((state) => ({ shortcutsModalOpen: !state.shortcutsModalOpen })),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  toggleAbout: () => set((state) => ({ aboutOpen: !state.aboutOpen })),
  setAboutOpen: (open) => set({ aboutOpen: open }),
  setCompareMode: (compare) => set({ compareMode: compare }),
  toggleCompareMode: () => set((state) => ({ compareMode: !state.compareMode })),
}));
