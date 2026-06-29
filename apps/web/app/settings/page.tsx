"use client";

import * as React from "react";
import { Sun, Moon, Type, Layout, Trash2, Key, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/themeStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useHistoryStore } from "@/store/historyStore";
import { useUIStore } from "@/store/uiStore";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const {
    fontSize,
    setFontSize,
    editorFont,
    setEditorFont,
    focusLevel,
    setFocusLevel,
    temperature,
    maxWords
  } = useSettingsStore();
  const { clearHistory, history } = useHistoryStore();
  const { toggleShortcutsModal } = useUIStore();

  const [historyCleared, setHistoryCleared] = React.useState(false);

  const handleClearHistory = () => {
    clearHistory();
    setHistoryCleared(true);
    setTimeout(() => setHistoryCleared(false), 2000);
  };

  const fontSizes = [
    { value: "sm", label: "Small" },
    { value: "base", label: "Normal" },
    { value: "lg", label: "Large" },
    { value: "xl", label: "Extra Large" },
    { value: "2xl", label: "Double Extra Large" }
  ];

  const fontFamilies = [
    { value: "serif", label: "Newsreader Serif (Recommended)" },
    { value: "sans", label: "Inter Sans-Serif" }
  ];

  const focusLevels = [
    { value: "standard", label: "Standard (Sidebars collapsible)" },
    { value: "ultra", label: "Ultra Focus (Hides navbar & sidebars)" }
  ];

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      
      {/* Title Header */}
      <div className="space-y-3 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          PREFERENCES
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Platform Settings
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed font-sans">
          Adjust the typography scale, editor layouts, theme settings, and shortcuts for your Verra writing workspace.
        </p>
      </div>

      {/* Theme selection panel */}
      <div className="space-y-4 border-b border-zinc-900 pb-8">
        <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          Color Theme
        </h2>
        
        <div className="grid grid-cols-2 gap-4 font-sans text-xs">
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-xl border bg-card/60 hover:bg-card hover:border-zinc-800 transition-all duration-150 cursor-pointer text-center",
              { "border-primary/40 bg-card ring-2 ring-primary/20": theme === "dark", "border-card-border": theme !== "dark" }
            )}
          >
            <Moon className="w-6 h-6 text-zinc-400" />
            <span className="font-semibold text-white">Midnight Dark</span>
            <span className="text-[10px] text-zinc-500">Subtle zinc dark tones optimized for writing at night</span>
          </button>
          
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-xl border bg-card/60 hover:bg-card hover:border-zinc-800 transition-all duration-150 cursor-pointer text-center",
              { "border-primary/40 bg-card ring-2 ring-primary/20": theme === "light", "border-card-border": theme !== "light" }
            )}
          >
            <Sun className="w-6 h-6 text-warning" />
            <span className="font-semibold text-white">Sleek Light</span>
            <span className="text-[10px] text-zinc-500">High contrast layout designed for bright environments</span>
          </button>
        </div>
      </div>

      {/* Editor settings typography */}
      <div className="space-y-6 border-b border-zinc-900 pb-8">
        <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          Typography & Editor Layout
        </h2>

        <div className="space-y-4 text-xs font-sans">
          {/* Font Family selector */}
          <div className="space-y-2">
            <span className="text-zinc-400 font-medium">Writing Typeface</span>
            <div className="flex flex-col gap-2">
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setEditorFont(font.value as "serif" | "sans")}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border text-left flex justify-between items-center transition-all duration-150 bg-zinc-900/20 cursor-pointer",
                    {
                      "border-primary/30 bg-zinc-900/60 font-semibold text-white": editorFont === font.value,
                      "border-card-border text-zinc-400 hover:text-zinc-200": editorFont !== font.value
                    }
                  )}
                >
                  <span className={font.value === "serif" ? "font-serif" : "font-sans"}>{font.label}</span>
                  {editorFont === font.value && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font size selectors */}
          <div className="space-y-2 pt-2">
            <span className="text-zinc-400 font-medium">Text Sizing</span>
            <div className="flex gap-2 flex-wrap">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value as any)}
                  className={cn(
                    "px-4.5 py-2.5 rounded-lg border text-center transition-all duration-150 cursor-pointer",
                    {
                      "border-primary/30 bg-zinc-900/60 font-semibold text-white": fontSize === size.value,
                      "border-card-border text-zinc-400 hover:text-zinc-200": fontSize !== size.value
                    }
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Utilities/Operations */}
      <div className="space-y-5">
        <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-primary" />
          Maintenance & Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
          
          <div className="p-4 rounded-xl border border-card-border bg-card/60 flex flex-col justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="font-bold text-white block">Keyboard Shortcuts Reference</span>
              <p className="text-zinc-500 leading-normal">
                Open the shortcut cheat sheet modal overlay.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleShortcutsModal}
              className="gap-2 text-zinc-300 border-zinc-800"
            >
              <Key className="w-3.5 h-3.5" />
              Show Shortcuts Modal
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-card-border bg-card/60 flex flex-col justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="font-bold text-white block">Delete Local Session Data</span>
              <p className="text-zinc-500 leading-normal">
                Permanently clear the local storage history. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="gap-2 px-4 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {historyCleared ? "Cleared Successfully" : "Purge History Records"}
            </Button>
          </div>

        </div>
      </div>

    </div>
  );
}
