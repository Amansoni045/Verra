"use client";

import * as React from "react";
import {
  Sparkles,
  Trash2,
  Copy,
  Download,
  Sliders,
  History,
  Menu,
  Plus,
  Settings,
  Info,
  X,
  FileText,
  HelpCircle,
  Check,
  Sun,
  Moon,
  ChevronLeft,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SetupOverlay } from "@/components/layout/SetupOverlay";
import { MetricsCharts } from "@/components/charts/MetricsCharts";
import { getModelStatus, streamTextGeneration } from "@/services/api";
import { useUIStore } from "@/store/uiStore";
import { useGenerationStore } from "@/store/generationStore";
import { useHistoryStore } from "@/store/historyStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useThemeStore } from "@/store/themeStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { downloadAsTXT, downloadAsPDF } from "@/utils/exportHelpers";
import { cn } from "@/lib/utils";
import { ModelStatus } from "@verra/types";

export default function HomePage() {
  const router = React.useRef(null);
  
  // Zustand State Stores
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { toggleCommandPalette, toggleShortcutsModal, sidebarOpen, setSidebarOpen, settingsOpen, setSettingsOpen, aboutOpen, setAboutOpen } = useUIStore();
  const { temperature, setTemperature, maxWords, setMaxWords, fontSize, setFontSize, editorFont, setEditorFont } = useSettingsStore();
  const { prompt, generatedText, isGenerating, currentStep, stepMessage, resetGenerationState, startGeneration, updateStep, appendWord, finishGeneration, setGenerationError, setPrompt, setGeneratedText } = useGenerationStore();
  const { history: localHistory, addHistoryEntry, deleteHistoryEntry, togglePin, toggleFavorite, clearHistory } = useHistoryStore();

  // Local Page UI States
  const [modelStatus, setModelStatus] = React.useState<ModelStatus | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  
  const [inputVal, setInputVal] = React.useState("");
  const [isLocalhost, setIsLocalhost] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync localhost/dev flag on client mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        process.env.NODE_ENV === "development"
      );
      // Auto-focus writing caret on mount
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, []);

  // Check API Engine Status
  const checkApiStatus = React.useCallback(async () => {
    const res = await getModelStatus();
    setModelStatus(res.engine);
  }, []);

  React.useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  // Keep inputVal in sync with loaded prompts
  React.useEffect(() => {
    setInputVal(prompt);
  }, [prompt]);

  // Auto-scroll textarea as text is generated
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [inputVal]);

  // Execute Text Generation
  const handleGenerateText = async (customSeed?: string) => {
    const textToSubmit = customSeed !== undefined ? customSeed : inputVal;
    if (isGenerating || !textToSubmit.trim()) return;
    if (modelStatus && !modelStatus.ready && isLocalhost) return;

    startGeneration();
    setPrompt(textToSubmit);
    setGeneratedText("");

    let accumulated = "";

    // If model is offline and not on localhost, fall back to simulated quote generation
    if (modelStatus && !modelStatus.ready && !isLocalhost) {
      const demoQuotes = "to those who believe in the beauty of their dreams and work to build it step by step".split(" ");
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < demoQuotes.length) {
          accumulated += (accumulated ? " " : "") + demoQuotes[idx];
          setInputVal(textToSubmit + " " + accumulated);
          idx++;
        } else {
          clearInterval(interval);
          addHistoryEntry({
            prompt: textToSubmit,
            generatedText: textToSubmit + " " + accumulated,
            temperature,
            maxWords,
            inferenceTimeMs: 120,
          });
          finishGeneration(120);
        }
      }, 160);
      return;
    }

    // Standard API streaming
    await streamTextGeneration(
      textToSubmit,
      temperature,
      maxWords,
      (event) => {
        if (event.step === "generating" && event.word) {
          accumulated += (accumulated ? " " : "") + event.word;
          setInputVal(textToSubmit + " " + accumulated);
        } else if (event.step && event.step !== "generating") {
          updateStep(event.step, event.message || "");
        }
      },
      (error) => {
        setGenerationError(error);
        // Fallback to local simulation on network error in production
        if (!isLocalhost) {
          setInputVal(textToSubmit + " [Generation Service Temporarily Offline]");
        }
      },
      () => {
        addHistoryEntry({
          prompt: textToSubmit,
          generatedText: textToSubmit + " " + accumulated,
          temperature,
          maxWords,
          inferenceTimeMs: 120,
        });
        finishGeneration(120);
      }
    );
  };

  // suggestion starter click immediately runs predictions
  const handleSuggestionClick = (seedText: string) => {
    setInputVal(seedText);
    setPrompt(seedText);
    resetGenerationState();
    setTimeout(() => handleGenerateText(seedText), 100);
  };

  // New Writing session initializer
  const handleNewSession = () => {
    setInputVal("");
    resetGenerationState();
    setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  // Restore history session in canvas
  const handleLoadHistory = (hPrompt: string, hFullText: string) => {
    setInputVal(hFullText);
    setPrompt(hPrompt);
    setGeneratedText(hFullText.slice(hPrompt.length).trim());
    setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  // Copy handler
  const handleCopy = () => {
    if (!inputVal.trim()) return;
    navigator.clipboard.writeText(inputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard Shortcuts Bindings
  useKeyboardShortcuts({
    onGenerate: () => handleGenerateText(),
    onTogglePalette: toggleCommandPalette,
    onCopy: handleCopy,
    onToggleHelp: toggleShortcutsModal,
    onClose: () => {
      setSidebarOpen(false);
      setSettingsOpen(false);
      setAboutOpen(false);
    }
  });

  // Simple statistics
  const wordCount = inputVal.trim() ? inputVal.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const suggestions = [
    { label: "Continue this thought...", seed: "The only limit to our realization of tomorrow" },
    { label: "Write a motivational quote...", seed: "In the end it is not the years in your life" },
    { label: "Finish my sentence...", seed: "The future belongs to those who" },
    { label: "Create a poem...", seed: "The night is dark and full of stars" }
  ];

  return (
    <div className="flex-1 flex overflow-hidden relative min-h-[calc(100vh-4rem)]">
      
      {/* Dev-only setup overlay screen */}
      {modelStatus && !modelStatus.ready && isLocalhost && (
        <SetupOverlay status={modelStatus} onCheckStatus={checkApiStatus} />
      )}

      {/* Collapsible Left Sidebar (ChatGPT style) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Sidebar backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-40 w-70 bg-[#070708] border-r border-card-border/60 flex flex-col justify-between shadow-2xl overflow-hidden font-sans select-none"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                  Verra Session logs
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 h-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* Sidebar Actions / History Logs list */}
              <div className="flex-grow overflow-y-auto p-3 space-y-4">
                <Button
                  onClick={handleNewSession}
                  className="w-full justify-start gap-2 text-xs font-semibold h-10 border border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                  New Document
                </Button>

                {/* History Session lists */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-2 block">
                    Recent Writing
                  </span>
                  {localHistory.length > 0 ? (
                    localHistory.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-2 rounded-lg border border-transparent hover:bg-zinc-900/40 text-left transition-colors"
                      >
                        <button
                          onClick={() => handleLoadHistory(item.prompt, item.generatedText)}
                          className="flex-1 truncate text-xs text-zinc-400 hover:text-white cursor-pointer text-left"
                        >
                          {item.prompt}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHistoryEntry(item.id)}
                          className="p-1 text-zinc-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-zinc-600 text-[10px] italic">
                      Empty session archive
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Footer Controls */}
              <div className="p-3 border-t border-zinc-900 bg-zinc-950/20 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSidebarOpen(false); setAboutOpen(true); }}
                  className="w-full justify-start gap-2.5 text-xs text-zinc-400 hover:text-white h-9"
                >
                  <Info className="w-4 h-4 text-zinc-500" />
                  About & Metrics
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSidebarOpen(false); setSettingsOpen(true); }}
                  className="w-full justify-start gap-2.5 text-xs text-zinc-400 hover:text-white h-9"
                >
                  <Settings className="w-4 h-4 text-zinc-500" />
                  Settings
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main creative writing panel */}
      <main className="flex-1 flex flex-col items-center bg-[#09090B] relative">
        
        {/* Floating Top Header bar */}
        <div className="w-full h-14 px-4 md:px-6 flex items-center justify-between select-none z-10">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-zinc-500 hover:text-white p-2"
                title="Open history sidebar"
              >
                <Menu className="w-4.5 h-4.5" />
              </Button>
            )}
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-sans">
              Verra
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>Neural Active</span>
          </div>
        </div>

        {/* Workspace Canvas (comfort-width centered column) */}
        <div className="flex-1 max-w-2xl w-full flex flex-col justify-between py-6 md:py-10 px-4 md:px-0">
          
          {/* Main textarea field */}
          <div className="relative flex-grow flex flex-col">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="What would you like to continue writing today?"
              readOnly={isGenerating}
              className={cn(
                "w-full bg-transparent border-0 outline-none text-white resize-none flex-grow focus:ring-0 leading-relaxed font-serif scroll-smooth",
                {
                  "font-serif": editorFont === "serif",
                  "font-sans": editorFont === "sans",
                  "text-lg": fontSize === "lg",
                  "text-xl": fontSize === "xl",
                  "text-2xl": fontSize === "2xl",
                }
              )}
            />

            {/* In-canvas loading step message when generating */}
            {isGenerating && (
              <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg select-none font-sans">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>{stepMessage}</span>
              </div>
            )}
          </div>

          {/* Empty State suggestions block */}
          {!inputVal.trim() && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2 pt-6 pb-4"
            >
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans select-none">
                Suggestions
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s.seed)}
                    className="px-3.5 py-2 rounded-lg border border-card-border bg-card/45 hover:border-primary/20 hover:bg-card text-zinc-300 hover:text-white text-xs font-semibold font-sans transition-all duration-150 cursor-pointer shadow-sm"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Controls Trigger block */}
          <div className="pt-5 border-t border-zinc-900/60 space-y-4 font-sans select-none shrink-0">
            
            {/* Advanced slider settings collapsible */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4 pb-4 border-b border-zinc-900/40"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Slider
                      label="Creativity (Temperature)"
                      min={0.1}
                      max={2.0}
                      step={0.05}
                      value={temperature}
                      onChange={setTemperature}
                    />
                    
                    <Slider
                      label="Maximum Words"
                      min={5}
                      max={60}
                      step={1}
                      value={maxWords}
                      onChange={setMaxWords}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions strip */}
            <div className="flex items-center justify-between gap-4">
              
              {/* Left actions: toggles, keyboard references, selection actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={cn("text-zinc-500 hover:text-white p-2 h-9", { "text-primary": showAdvanced })}
                  title="Advanced configuration sliders"
                >
                  <Sliders className="w-4 h-4" />
                </Button>

                {inputVal.trim() && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-zinc-500 hover:text-white p-2 h-9"
                      title="Copy full text"
                    >
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAsTXT("verra-writing.txt", inputVal)}
                      className="text-zinc-500 hover:text-white p-2 h-9"
                      title="Download as TXT"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAsPDF("Verra Document", inputVal)}
                      className="text-zinc-500 hover:text-white p-2 h-9"
                      title="Export as vector PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewSession}
                      className="text-zinc-500 hover:text-danger p-2 h-9"
                      title="Clear workspace"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Right actions: statistics + trigger continue button */}
              <div className="flex items-center gap-4">
                {inputVal.trim() && (
                  <span className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono tracking-wide">
                    {wordCount} words • {readingTime} min read
                  </span>
                )}
                
                <Button
                  onClick={() => handleGenerateText()}
                  disabled={!inputVal.trim() || isGenerating}
                  className="gap-2 text-xs px-5 h-9 font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10 transition-all duration-150 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Continue Sentence
                </Button>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* 4. SETTINGS MODAL OVERLAY */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-black/70"
            />
            
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md bg-[#09090B] border border-card-border p-6 rounded-xl shadow-2xl glass-panel text-left font-sans text-xs space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                <h3 className="text-sm font-bold text-white">Workspace Preferences</h3>
                <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)} className="p-1 h-auto text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Theme Settings */}
              <div className="space-y-2">
                <span className="text-zinc-400 font-medium">Layout Theme</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn("px-4 py-3 rounded-lg border text-left flex justify-between items-center bg-zinc-950/40 cursor-pointer", {
                      "border-primary/40 text-white font-semibold": theme === "dark",
                      "border-card-border text-zinc-500 hover:text-zinc-300": theme !== "dark"
                    })}
                  >
                    <span>Midnight Dark</span>
                    {theme === "dark" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={cn("px-4 py-3 rounded-lg border text-left flex justify-between items-center bg-zinc-950/40 cursor-pointer", {
                      "border-primary/40 text-white font-semibold": theme === "light",
                      "border-card-border text-zinc-500 hover:text-zinc-300": theme !== "light"
                    })}
                  >
                    <span>Sleek Light</span>
                    {theme === "light" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              </div>

              {/* Typography Face Settings */}
              <div className="space-y-2">
                <span className="text-zinc-400 font-medium">Typography Style</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditorFont("serif")}
                    className={cn("px-4 py-3 rounded-lg border text-left flex justify-between items-center bg-zinc-950/40 cursor-pointer font-serif", {
                      "border-primary/40 text-white font-semibold": editorFont === "serif",
                      "border-card-border text-zinc-500 hover:text-zinc-300": editorFont !== "serif"
                    })}
                  >
                    <span>Newsreader Serif</span>
                    {editorFont === "serif" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => setEditorFont("sans")}
                    className={cn("px-4 py-3 rounded-lg border text-left flex justify-between items-center bg-zinc-950/40 cursor-pointer font-sans", {
                      "border-primary/40 text-white font-semibold": editorFont === "sans",
                      "border-card-border text-zinc-500 hover:text-zinc-300": editorFont !== "sans"
                    })}
                  >
                    <span>Inter Sans</span>
                    {editorFont === "sans" && <Check className="w-4 h-4 text-primary" />}
                  </button>
                </div>
              </div>

              {/* Size Settings */}
              <div className="space-y-2">
                <span className="text-zinc-400 font-medium">Text Scaling</span>
                <div className="flex gap-2">
                  {["sm", "base", "lg", "xl"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFontSize(s as any)}
                      className={cn("px-3 py-2 rounded-lg border text-center flex-1 cursor-pointer", {
                        "border-primary/30 bg-zinc-900/60 font-semibold text-white": fontSize === s,
                        "border-card-border text-zinc-500 hover:text-zinc-300": fontSize !== s
                      })}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maintenance operations */}
              <div className="pt-3 border-t border-zinc-900 flex justify-between items-center">
                <span className="text-zinc-500">Local Archive Cache</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearHistory}
                  className="text-danger hover:bg-danger/5 hover:border-danger/20 text-[10px] font-bold h-8 border border-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Purge History Cache
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ABOUT & METRICS DIALOG OVERLAY */}
      <AnimatePresence>
        {aboutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setAboutOpen(false)}
              className="absolute inset-0 bg-black/70"
            />
            
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#09090B] border border-card-border p-6 rounded-xl shadow-2xl overflow-y-auto max-h-[85vh] glass-panel text-left font-sans text-xs space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                <div>
                  <h3 className="text-sm font-bold text-white">About Verra Neural Engine</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Recurrent cell memory configurations and training metrics</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAboutOpen(false)} className="p-1 h-auto text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Technical description details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 leading-relaxed">
                  <span className="font-bold text-white block">Next-Word Recurrence</span>
                  <p className="text-zinc-400">
                    Verra utilizes a Long Short-Term Memory (LSTM) network containing input, forget, and output memory gates. Unlike simple RNNs, these gates allow the network to selectively retain sentence context and punctuation properties over hundreds of words.
                  </p>
                </div>
                <div className="space-y-2 leading-relaxed">
                  <span className="font-bold text-white block">Model Index Parameters</span>
                  <ul className="space-y-1.5 text-zinc-500">
                    <li className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span>Unique Vocabulary Size</span>
                      <span className="font-semibold text-zinc-300 font-mono">8,978 tokens</span>
                    </li>
                    <li className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span>Input Padding Sequence</span>
                      <span className="font-semibold text-zinc-300 font-mono">745 words</span>
                    </li>
                    <li className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span>Embedding Dimensions</span>
                      <span className="font-semibold text-zinc-300 font-mono">50 features</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Recharts chart embed */}
              <div className="space-y-3 border-t border-zinc-900 pt-5">
                <span className="font-bold text-white block">Training Convergence Curves</span>
                <MetricsCharts />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
