"use client";

import * as React from "react";
import { Trash2, Copy, Pin, Bookmark, ArrowUpRight, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/store/historyStore";
import { useGenerationStore } from "@/store/generationStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { history, deleteHistoryEntry, togglePin, toggleFavorite, clearHistory } = useHistoryStore();
  const { setPrompt, setGeneratedText } = useGenerationStore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<"all" | "pinned" | "favorites">("all");
  const [copiedIndex, setCopiedIndex] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLoadSession = (promptText: string, fullText: string) => {
    setPrompt(promptText);
    // Extract the generated part
    const generated = fullText.slice(promptText.length).trim();
    setGeneratedText(generated);
    router.push("/");
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.generatedText.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterMode === "pinned") return matchesSearch && item.isPinned;
    if (filterMode === "favorites") return matchesSearch && item.isFavorite;
    return matchesSearch;
  });

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
            ARCHIVES
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Writing History
          </h1>
          <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
            Review, copy, and continue your past writing sessions. Everything is stored locally on your device.
          </p>
        </div>

        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-zinc-500 hover:text-danger hover:bg-danger/5 text-xs font-semibold h-9 border border-zinc-900 shrink-0 align-self-start md:align-self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Purge All History
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-1.5 bg-zinc-900/40 border border-zinc-900 p-1 rounded-lg w-full sm:w-auto">
            {(["all", "pinned", "favorites"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer w-1/3 sm:w-auto",
                  {
                    "bg-zinc-800 text-white": filterMode === mode,
                    "text-zinc-500 hover:text-zinc-300": filterMode !== mode
                  }
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search past logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/30 border border-card-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-primary/40 focus:bg-zinc-900/60 transition-all"
            />
          </div>
        </div>
      )}

      {/* History Grid */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group p-5 rounded-xl border border-card-border bg-card/40 hover:border-zinc-800 transition-all duration-150 flex flex-col justify-between gap-4 glass-panel"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <span>Temp: {item.temperature}</span>
                      <span>Words: {item.maxWords}</span>
                    </div>
                  </div>
                  
                  {/* Text content previews */}
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500 italic font-serif">
                      Seed: &ldquo;{item.prompt}&rdquo;
                    </p>
                    <p className="text-xs text-zinc-200 leading-relaxed font-serif">
                      {item.generatedText}
                    </p>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-900/60 text-xs">
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(item.id)}
                      className={cn("p-2 text-zinc-500 hover:text-white", { "text-primary": item.isPinned })}
                      title="Pin session"
                    >
                      <Pin className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(item.id)}
                      className={cn("p-2 text-zinc-500 hover:text-white", { "text-warning": item.isFavorite })}
                      title="Favorite session"
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHistoryEntry(item.id)}
                      className="p-2 text-zinc-500 hover:text-danger"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.generatedText, item.id)}
                      className="text-zinc-500 hover:text-white font-semibold h-8 text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      {copiedIndex === item.id ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleLoadSession(item.prompt, item.generatedText)}
                      className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold h-8 text-[11px] px-3.5 gap-1"
                    >
                      Open in Studio
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-16 text-center border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-650">
            <FileText className="w-8 h-8 text-zinc-700 mb-1" />
            <span className="text-xs font-semibold">No writing logs found</span>
            <p className="text-[10px] text-zinc-500 max-w-xs leading-normal">
              {history.length === 0
                ? "Generate predictive continuation sentences inside the writing Studio, and they will automatically accumulate here."
                : "No logs match the current search or filters. Try choosing a different tab."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
