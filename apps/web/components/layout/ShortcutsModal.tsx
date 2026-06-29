"use client";

import * as React from "react";
import { useUIStore } from "@/store/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useUIStore();

  const shortcuts = [
    { keys: ["⌘", "Enter"], description: "Generate next words from prompt" },
    { keys: ["⌘", "K"], description: "Toggle Search Command Palette" },
    { keys: ["⌘", "Shift", "C"], description: "Copy generated editor text" },
    { keys: ["?"], description: "Open keyboard shortcuts reference" },
    { keys: ["Esc"], description: "Close dialogs, overlays, or palettes" },
    { keys: ["F"], description: "Toggle Distraction-free Focus Mode (Studio)" },
  ];

  return (
    <Dialog open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your writing workflow in Verra with direct command combinations.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3.5">
          {shortcuts.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-zinc-800/40 last:border-0"
            >
              <span className="text-xs font-medium text-zinc-400 font-sans">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <React.Fragment key={keyIdx}>
                    {keyIdx > 0 && <span className="text-[10px] text-zinc-600 font-bold font-mono">+</span>}
                    <kbd className="px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/50 text-[10px] font-bold font-mono text-zinc-200 select-none shadow-sm shadow-black/10">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
