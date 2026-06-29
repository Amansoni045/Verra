import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GenerationHistoryEntry } from "@verra/types";

interface HistoryState {
  history: GenerationHistoryEntry[];
  addHistoryEntry: (entry: Omit<GenerationHistoryEntry, "id" | "timestamp" | "isFavorite" | "isPinned">) => void;
  deleteHistoryEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      addHistoryEntry: (entry) =>
        set((state) => {
          const newEntry: GenerationHistoryEntry = {
            ...entry,
            id: Math.random().toString(36).substring(2, 11),
            timestamp: new Date().toISOString(),
            isFavorite: false,
            isPinned: false,
          };
          return { history: [newEntry, ...state.history] };
        }),
      deleteHistoryEntry: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
          ),
        })),
      togglePin: (id) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
          ),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "verra-history-store",
    }
  )
);
