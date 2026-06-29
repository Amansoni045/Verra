import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  temperature: number;
  maxWords: number;
  fontSize: "sm" | "base" | "lg" | "xl" | "2xl";
  editorFont: "serif" | "sans";
  focusLevel: "standard" | "ultra";
  setTemperature: (temp: number) => void;
  setMaxWords: (words: number) => void;
  setFontSize: (size: "sm" | "base" | "lg" | "xl" | "2xl") => void;
  setEditorFont: (font: "serif" | "sans") => void;
  setFocusLevel: (level: "standard" | "ultra") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      temperature: 1.0,
      maxWords: 15,
      fontSize: "xl",
      editorFont: "serif",
      focusLevel: "standard",
      setTemperature: (temperature) => set({ temperature }),
      setMaxWords: (maxWords) => set({ maxWords }),
      setFontSize: (fontSize) => set({ fontSize }),
      setEditorFont: (editorFont) => set({ editorFont }),
      setFocusLevel: (focusLevel) => set({ focusLevel }),
    }),
    {
      name: "verra-settings-store",
    }
  )
);
