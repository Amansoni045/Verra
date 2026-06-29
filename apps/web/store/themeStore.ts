import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => {
        if (typeof window !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
          if (theme === "light") {
            document.documentElement.classList.add("light");
          } else {
            document.documentElement.classList.remove("light");
          }
        }
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          if (typeof window !== "undefined") {
            document.documentElement.setAttribute("data-theme", newTheme);
            if (newTheme === "light") {
              document.documentElement.classList.add("light");
            } else {
              document.documentElement.classList.remove("light");
            }
          }
          return { theme: newTheme };
        }),
    }),
    {
      name: "verra-theme-store",
    }
  )
);
