import { useEffect } from "react";

interface ShortcutHandlers {
  onGenerate?: () => void;
  onTogglePalette?: () => void;
  onCopy?: () => void;
  onToggleHelp?: () => void;
  onClose?: () => void;
}

export function useKeyboardShortcuts({
  onGenerate,
  onTogglePalette,
  onCopy,
  onToggleHelp,
  onClose,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      // Escape -> close overlays
      if (e.key === "Escape") {
        if (onClose) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // Cmd/Ctrl + Enter -> Generate
      if (e.key === "Enter" && modifier) {
        if (onGenerate) {
          e.preventDefault();
          onGenerate();
        }
        return;
      }

      // Cmd/Ctrl + K -> Command Palette
      if ((e.key === "k" || e.key === "K") && modifier) {
        if (onTogglePalette) {
          e.preventDefault();
          onTogglePalette();
        }
        return;
      }

      // Cmd/Ctrl + Shift + C -> Copy Output
      if ((e.key === "c" || e.key === "C") && modifier && e.shiftKey) {
        // Prevent trigger if user is typing in inputs but copy output is triggered globally
        if (onCopy) {
          e.preventDefault();
          onCopy();
        }
        return;
      }

      // ? -> Open Shortcut Help
      if (e.key === "?") {
        // Only trigger if not typing in textareas or inputs
        const activeEl = document.activeElement;
        const isTyping = activeEl && (
          activeEl.tagName === "INPUT" || 
          activeEl.tagName === "TEXTAREA" || 
          activeEl.getAttribute("contenteditable") === "true"
        );
        if (!isTyping && onToggleHelp) {
          e.preventDefault();
          onToggleHelp();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onGenerate, onTogglePalette, onCopy, onToggleHelp, onClose]);
}
