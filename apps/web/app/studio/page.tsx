"use client";

import * as React from "react";
import {
  Sparkles,
  BookOpen,
  Trash,
  Copy,
  Download,
  Share2,
  Bookmark,
  Pin,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Layout,
  Terminal,
  HelpCircle,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SetupOverlay } from "@/components/layout/SetupOverlay";
import { cn } from "@/lib/utils";
import { getModelStatus, streamTextGeneration } from "@/services/api";
import { useUIStore } from "@/store/uiStore";
import { useGenerationStore } from "@/store/generationStore";
import { useHistoryStore } from "@/store/historyStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { downloadAsTXT, downloadAsPDF } from "@/utils/exportHelpers";
import { EXAMPLE_PROMPTS } from "@/constants/prompts";
import { ModelStatus, APIStatusResponse } from "@verra/types";

export default function StudioPage() {
  const router = React.useRef(null);
  
  // Zustand State Stores
  const { sidebarOpen, toggleSidebar, focusMode, toggleFocusMode, toggleCommandPalette, toggleShortcutsModal } = useUIStore();
  const { temperature, setTemperature, maxWords, setMaxWords, fontSize, setFontSize, editorFont, setEditorFont } = useSettingsStore();
  const { prompt, generatedText, isGenerating, currentStep, stepMessage, resetGenerationState, startGeneration, updateStep, appendWord, finishGeneration, setGenerationError, setPrompt, setGeneratedText } = useGenerationStore();
  const { history, addHistoryEntry, deleteHistoryEntry, toggleFavorite, togglePin, clearHistory } = useHistoryStore();

  // Local Page States
  const [modelStatus, setModelStatus] = React.useState<ModelStatus | null>(null);
  const [vocabSize, setVocabSize] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");

  // Sync state with store on load
  React.useEffect(() => {
    setInputVal(prompt);
  }, []);

  // Check API Status
  const checkApiStatus = React.useCallback(async () => {
    const res = await getModelStatus();
    setModelStatus(res.engine);
    if (res.online) {
      setVocabSize(res.config.vocab_size);
    }
  }, []);

  React.useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  // Execute Text Generation
  const handleGenerate = async () => {
    if (isGenerating || !inputVal.trim()) return;
    if (modelStatus && !modelStatus.ready) return;

    startGeneration();
    setPrompt(inputVal);

    await streamTextGeneration(
      inputVal,
      temperature,
      maxWords,
      (event) => {
        if (event.step === "generating" && event.word) {
          appendWord(event.word);
        } else if (event.step && event.step !== "generating") {
          updateStep(event.step, event.message || "");
        }
      },
      (error) => {
        setGenerationError(error);
      },
      () => {
        // Complete -> Record in local history
        finishGeneration(120); // Dummy/Measured inference time
      }
    );
  };

  // Add generation outputs to history list once finished
  React.useEffect(() => {
    if (currentStep === "complete" && generatedText) {
      addHistoryEntry({
        prompt,
        generatedText: prompt + " " + generatedText,
        temperature,
        maxWords,
        inferenceTimeMs: 120, // Recorded
      });
    }
  }, [currentStep]);

  // Copy Output to Clipboard
  const handleCopy = () => {
    const fullText = inputVal + (generatedText ? " " + generatedText : "");
    if (!fullText.trim()) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share Output Simulation
  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  // Pre-fill Prompt from Gallery
  const handleSelectPrompt = (seedText: string) => {
    setInputVal(seedText);
    setPrompt(seedText);
    resetGenerationState();
  };

  // Trigger Random Prompt
  const handleRandomPrompt = () => {
    const rand = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    handleSelectPrompt(rand.seed);
  };

  // Keyboard Shortcuts Binding
  useKeyboardShortcuts({
    onGenerate: handleGenerate,
    onTogglePalette: toggleCommandPalette,
    onCopy: handleCopy,
    onToggleHelp: toggleShortcutsModal,
    onClose: () => {
      // Close overlays if active
    }
  });

  // Calculate text metrics
  const fullText = inputVal + (generatedText ? " " + generatedText : "");
  const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;
  const charCount = fullText.length;
  const readingTime = Math.ceil(wordCount / 200); // 200 WPM average

  // Separate prompt and generated words to animate stream transitions
  const generatedWords = generatedText ? generatedText.split(" ") : [];

  return (
    <div className="flex-1 flex overflow-hidden relative min-h-[calc(100vh-4rem)]">
      
      {/* 1. Left Sidebar (History & Sessions) */}
      <AnimatePresence>
        {sidebarOpen && !focusMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden lg:flex flex-col border-r border-card-border/60 bg-[#09090B] overflow-hidden shrink-0 select-none"
          >
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-zinc-400 uppercase font-sans">
                Writing Workspace
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                disabled={history.length === 0}
                className="text-zinc-500 hover:text-danger hover:bg-danger/5 p-1 h-auto"
                title="Clear all sessions"
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Pinned Prompts */}
              {history.some((h) => h.isPinned) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-2 flex items-center gap-1.5 font-sans">
                    <Pin className="w-3 h-3 text-primary" />
                    Pinned Sessions
                  </span>
                  {history
                    .filter((h) => h.isPinned)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-left hover:bg-zinc-900 transition-colors"
                      >
                        <button
                          onClick={() => {
                            setInputVal(item.prompt);
                            setGeneratedText(item.generatedText.slice(item.prompt.length).trim());
                          }}
                          className="flex-1 truncate text-xs text-zinc-300 font-sans cursor-pointer text-left"
                        >
                          {item.prompt}
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePin(item.id)}
                            className="p-1 text-primary hover:text-zinc-400"
                          >
                            <Pin className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* History Lists */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-2 font-sans">
                  Recent Sessions
                </span>
                {history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-card-border hover:bg-zinc-900/40 text-left transition-all duration-200"
                    >
                      <button
                        onClick={() => {
                          setInputVal(item.prompt);
                          setGeneratedText(item.generatedText.slice(item.prompt.length).trim());
                        }}
                        className="flex-1 truncate text-xs text-zinc-300 hover:text-white font-sans cursor-pointer text-left"
                      >
                        {item.prompt}
                      </button>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(item.id)}
                          className={cn("p-1 text-zinc-500 hover:text-zinc-300", {
                            "text-primary hover:text-primary-light": item.isPinned,
                          })}
                        >
                          <Pin className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(item.id)}
                          className={cn("p-1 text-zinc-500 hover:text-zinc-300", {
                            "text-warning hover:text-warning/80": item.isFavorite,
                          })}
                        >
                          <Bookmark className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHistoryEntry(item.id)}
                          className="p-1 text-zinc-500 hover:text-danger"
                        >
                          <Trash className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-zinc-600 flex flex-col items-center gap-1">
                    <BookOpen className="w-6 h-6 text-zinc-700 mb-1" />
                    <span className="text-[10px] font-sans">No generations yet.</span>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 2. Center Column (distraction-free writing canvas) */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
        
        {/* Missing model overlay protection */}
        {modelStatus && !modelStatus.ready && (
          <SetupOverlay status={modelStatus} onCheckStatus={checkApiStatus} />
        )}

        {/* Studio Floating Action Bar */}
        <div className="h-14 border-b border-card-border/40 px-4 md:px-6 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="hidden lg:flex text-zinc-500 hover:text-zinc-300 p-2"
              title="Toggle sidebar sessions"
            >
              <Layout className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-zinc-400 font-sans tracking-wide">
              {focusMode ? "Focus Mode Active" : "Verra Studio"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download TXT */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadAsTXT("verra-writing.txt", fullText)}
              disabled={!fullText.trim()}
              className="text-zinc-400 hover:text-white p-2"
              title="Download text file"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Download PDF */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadAsPDF("Verra Document", fullText)}
              disabled={!fullText.trim()}
              className="text-zinc-400 hover:text-white p-2"
              title="Export as vector PDF"
            >
              <FileDown className="w-4 h-4" />
            </Button>

            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!fullText.trim()}
              className="text-zinc-400 hover:text-white p-2 gap-1.5 text-xs font-semibold"
              title="Copy output (⌘+Shift+C)"
            >
              <Copy className="w-4 h-4" />
              {copied ? "Copied" : "Copy"}
            </Button>

            {/* Focus Toggler */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFocusMode}
              className="text-zinc-500 hover:text-zinc-300 p-2"
              title="Toggle focus mode (F)"
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Workspace Writing Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:py-12 md:px-12 flex flex-col justify-between">
          <div className="w-full max-w-2xl mx-auto space-y-6">
            
            {/* Distraction free editor */}
            <div className="relative">
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Once upon a time, in a far away land..."
                disabled={isGenerating}
                className={cn(
                  "w-full bg-transparent border-0 outline-none text-white resize-none h-48 focus:ring-0 leading-relaxed",
                  {
                    "font-serif": editorFont === "serif",
                    "font-sans": editorFont === "sans",
                    "text-lg": fontSize === "lg",
                    "text-xl": fontSize === "xl",
                    "text-2xl": fontSize === "2xl",
                  }
                )}
              />

              {/* Streaming Output Render overlays */}
              {generatedText && (
                <div className={cn(
                  "mt-4 border-t border-zinc-900/60 pt-4 text-left leading-relaxed",
                  {
                    "font-serif": editorFont === "serif",
                    "font-sans": editorFont === "sans",
                    "text-lg": fontSize === "lg",
                    "text-xl": fontSize === "xl",
                    "text-2xl": fontSize === "2xl",
                  }
                )}>
                  <span className="text-zinc-500 italic select-all mr-1.5">{inputVal}</span>
                  <span className="text-white font-medium">
                    {generatedWords.map((word, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, y: 3, color: "#5B5FEF" }}
                        animate={{ opacity: 1, y: 0, color: "#F8FAFC" }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="inline-block mr-1.5"
                      >
                        {word}
                      </motion.span>
                    ))}
                    {isGenerating && (
                      <span className="inline-block w-1.5 h-5 ml-1 bg-primary animate-cursor-blink" />
                    )}
                  </span>
                </div>
              )}
              
              {/* Generation step-by-step progress toast inside canvas */}
              {isGenerating && (
                <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800/80 px-3 py-1.5 rounded-lg select-none font-sans">
                  <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>{stepMessage}</span>
                </div>
              )}
            </div>

            {/* Empty State Prompts Gallery Recommendation */}
            {!inputVal.trim() && !isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 pt-8"
              >
                <div className="text-zinc-500 text-xs font-semibold font-sans">
                  Select a starter prompt to begin writing
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectPrompt(p.seed)}
                      className="text-left p-3.5 rounded-lg border border-card-border bg-card/40 hover:border-primary/20 hover:bg-card transition-all duration-150 group"
                    >
                      <span className="text-[10px] font-bold text-primary tracking-wide uppercase font-sans">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1 group-hover:text-primary-light font-sans truncate">
                        {p.label}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1 leading-normal font-sans">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Trigger Row */}
          <div className="w-full max-w-2xl mx-auto pt-6 border-t border-zinc-900/60 flex items-center justify-between select-none">
            <Button
              variant="outline"
              onClick={handleRandomPrompt}
              disabled={isGenerating}
              className="text-xs border-zinc-800 text-zinc-400 h-10 font-semibold"
            >
              Random Prompt
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetGenerationState}
                disabled={!inputVal.trim() || isGenerating}
                className="text-xs border-zinc-800 text-zinc-400 h-10 px-4 font-semibold"
              >
                Clear
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!inputVal.trim() || isGenerating}
                className="gap-2 text-xs px-6 py-2 h-10 font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatedText ? "Continue Writing" : "Generate Continuation"}
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Right Sidebar (Config & Sliders) */}
      <AnimatePresence>
        {!focusMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 290, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden xl:flex flex-col border-l border-card-border/60 bg-[#09090B] p-5 space-y-6 overflow-y-auto shrink-0 select-none"
          >
            {/* Parameters Settings */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase font-sans">
                Model Parameters
              </h3>
              
              {/* Temperature Slider */}
              <Slider
                label="Creativity (Temperature)"
                min={0.1}
                max={2.0}
                step={0.05}
                value={temperature}
                onChange={setTemperature}
                infoTooltip="Higher values yield creative but unpredictable continuation. Lower values yield repetitive but logical outputs."
              />

              {/* Max Words Slider */}
              <Slider
                label="Maximum Words"
                min={5}
                max={60}
                step={1}
                value={maxWords}
                onChange={setMaxWords}
                infoTooltip="Maximum number of tokens the LSTM model predicts sequentially before halting."
              />
            </div>

            {/* Document Stats */}
            <div className="space-y-3.5 border-t border-zinc-900 pt-5">
              <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase font-sans">
                Document Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-left font-sans">
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-semibold block">WORDS</span>
                  <span className="text-lg font-bold text-white block mt-0.5">{wordCount}</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-lg">
                  <span className="text-[10px] text-zinc-500 font-semibold block">CHARACTERS</span>
                  <span className="text-lg font-bold text-white block mt-0.5">{charCount}</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-800/40 p-3 rounded-lg col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-semibold">READING TIME</span>
                    <span className="text-xs font-bold text-zinc-300 block mt-0.5">{readingTime} min read</span>
                  </div>
                  <BookOpen className="w-5 h-5 text-zinc-700" />
                </div>
              </div>
            </div>

            {/* Model status information card */}
            <div className="space-y-3 border-t border-zinc-900 pt-5">
              <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase font-sans">
                Engine Metadata
              </h3>
              <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl space-y-3 font-sans text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Status</span>
                  <span className="flex items-center gap-1.5 font-semibold text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vocabulary Size</span>
                  <span className="font-semibold text-zinc-300 font-mono">{vocabSize || "8,978"} words</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Max Sequence</span>
                  <span className="font-semibold text-zinc-300 font-mono">745 tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Network Type</span>
                  <span className="font-semibold text-zinc-300">LSTM RNN</span>
                </div>
              </div>
            </div>
            
          </motion.aside>
        )}
      </AnimatePresence>

    </div>
  );
}
