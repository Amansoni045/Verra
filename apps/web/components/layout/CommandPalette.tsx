"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Terminal, ArrowRight, Sun, Moon, Sparkles, Layout, FolderKanban, Info, Settings, Copy, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/uiStore";
import { useThemeStore } from "@/store/themeStore";
import { useGenerationStore } from "@/store/generationStore";
import { useHistoryStore } from "@/store/historyStore";
import { cn } from "@/lib/utils";

interface CommandItem {
  icon: React.ReactNode;
  label: string;
  category: string;
  shortcut?: string[];
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();
  const { prompt, generatedText, isGenerating, resetGenerationState } = useGenerationStore();
  const { addHistoryEntry } = useHistoryStore();

  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (commandPaletteOpen) {
      setSearch("");
      setSelectedIndex(0);
      // Timeout to ensure input is rendered before focus
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [commandPaletteOpen]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setCommandPaletteOpen(false);
      }
    };

    if (commandPaletteOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const commands: CommandItem[] = [
    // Navigation
    {
      icon: <Sparkles className="w-4 h-4 text-zinc-400" />,
      label: "Navigate to Studio",
      category: "Navigation",
      shortcut: ["S"],
      action: () => { router.push("/"); setCommandPaletteOpen(false); }
    },
    {
      icon: <FolderKanban className="w-4 h-4 text-zinc-400" />,
      label: "View Writing History",
      category: "Navigation",
      shortcut: ["H"],
      action: () => { router.push("/history"); setCommandPaletteOpen(false); }
    },
    {
      icon: <Info className="w-4 h-4 text-zinc-400" />,
      label: "Read About & Metrics",
      category: "Navigation",
      shortcut: ["A"],
      action: () => { router.push("/about"); setCommandPaletteOpen(false); }
    },
    {
      icon: <Settings className="w-4 h-4 text-zinc-400" />,
      label: "Open Settings",
      category: "Navigation",
      action: () => { router.push("/settings"); setCommandPaletteOpen(false); }
    },
    // Actions
    {
      icon: theme === "dark" ? <Sun className="w-4 h-4 text-zinc-400" /> : <Moon className="w-4 h-4 text-zinc-400" />,
      label: `Switch Theme to ${theme === "dark" ? "Light" : "Dark"}`,
      category: "Preferences",
      action: () => { toggleTheme(); setCommandPaletteOpen(false); }
    },
    {
      icon: <Copy className="w-4 h-4 text-zinc-400" />,
      label: "Copy Output Text",
      category: "Editor Actions",
      shortcut: ["⌘", "Shift", "C"],
      action: () => {
        if (generatedText) {
          navigator.clipboard.writeText(generatedText);
        }
        setCommandPaletteOpen(false);
      }
    },
    {
      icon: <Trash className="w-4 h-4 text-zinc-400" />,
      label: "Clear Studio Workspace",
      category: "Editor Actions",
      action: () => {
        resetGenerationState();
        setCommandPaletteOpen(false);
      }
    }
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle key listeners in palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            ref={containerRef}
            className="w-full max-w-lg overflow-hidden border border-card-border bg-card rounded-xl shadow-2xl glass-panel flex flex-col"
          >
            {/* Search Input Box */}
            <div className="flex items-center px-4 border-b border-zinc-800/40 h-12 gap-3">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search sections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-full bg-transparent border-0 outline-none text-zinc-100 placeholder-zinc-500 text-sm font-sans"
              />
              <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800/50 px-1.5 py-0.5 rounded font-bold font-mono">ESC</span>
            </div>

            {/* Results Grid */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={idx}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-left outline-none cursor-pointer",
                        {
                          "bg-zinc-800/60 text-white": isSelected,
                          "text-zinc-400 hover:text-zinc-200": !isSelected,
                        }
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {cmd.icon}
                        <span className="text-xs font-medium font-sans">{cmd.label}</span>
                        <span className="text-[10px] text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-zinc-800/20">
                          {cmd.category}
                        </span>
                      </div>
                      
                      {isSelected ? (
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        cmd.shortcut && (
                          <div className="flex gap-1 shrink-0">
                            {cmd.shortcut.map((key, keyIdx) => (
                              <kbd
                                key={keyIdx}
                                className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/40 text-[9px] font-bold font-mono text-zinc-400"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-zinc-500 flex flex-col items-center gap-1.5">
                  <Terminal className="w-6 h-6 text-zinc-600 animate-pulse" />
                  <span className="text-xs">No command matches found.</span>
                </div>
              )}
            </div>
            
            {/* Footer hints */}
            <div className="px-4 py-2 bg-zinc-900/40 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-500 font-sans">
              <span>Use <kbd className="font-mono font-bold">↑↓</kbd> to navigate, <kbd className="font-mono font-bold">Enter</kbd> to execute</span>
              <span>Verra Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
