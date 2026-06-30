import { create } from "zustand";

interface ThemeState {
  theme: "dark";
  setTheme: (theme: "dark") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  (set) => ({
    theme: "dark",
    setTheme: () => {},
    toggleTheme: () => {},
  })
);
