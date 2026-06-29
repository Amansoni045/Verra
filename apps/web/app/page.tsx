"use client";

import * as React from "react";
import {
  Sparkles,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  Sliders,
  History,
  FileText,
  AlertTriangle,
  FileDown,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SetupOverlay } from "@/components/layout/SetupOverlay";
import { getModelStatus, streamTextGeneration } from "@/services/api";
import { useUIStore } from "@/store/uiStore";
import { useGenerationStore } from "@/store/generationStore";
import { useHistoryStore } from "@/store/historyStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { downloadAsTXT, downloadAsPDF } from "@/utils/exportHelpers";
import { cn } from "@/lib/utils";
import { ModelStatus } from "@verra/types";

export default function HomePage() {
  // Zustand State Stores
  const { toggleCommandPalette, toggleShortcutsModal } = useUIStore();
  const { temperature, setTemperature, maxWords, setMaxWords, fontSize, setFontSize, editorFont, setEditorFont } = useSettingsStore();
  const { prompt, generatedText, isGenerating, currentStep, stepMessage, resetGenerationState, startGeneration, updateStep, appendWord, finishGeneration, setGenerationError, setPrompt, setGeneratedText } = useGenerationStore();
  const { history: localHistory, addHistoryEntry } = useHistoryStore();

  // Local Component States
  const [modelStatus, setModelStatus] = React.useState<ModelStatus | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("");
  const [isLocalhost, setIsLocalhost] = React.useState(false);

  // Check if we are running in localhost/dev
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        process.env.NODE_ENV === "development"
      );
    }
  }, []);

  // Sync input value with store
  React.useEffect(() => {
    setInputVal(prompt);
  }, [prompt]);

  // Check Model Engine Status
  const checkApiStatus = React.useCallback(async () => {
    const res = await getModelStatus();
    setModelStatus(res.engine);
  }, []);

  React.useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  // Generate continuation
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
        finishGeneration(120);
      }
    );
  };

  // Add outputs to history once complete
  React.useEffect(() => {
    if (currentStep === "complete" && generatedText) {
      addHistoryEntry({
        prompt,
        generatedText: prompt + " " + generatedText,
        temperature,
        maxWords,
        inferenceTimeMs: 120,
      });
    }
  }, [currentStep]);

  // Copy handler
  const handleCopy = () => {
    const fullText = inputVal + (generatedText ? " " + generatedText : "");
    if (!fullText.trim()) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-fill selection suggestion
  const handleSuggestionClick = (seedText: string) => {
    setInputVal(seedText);
    setPrompt(seedText);
    resetGenerationState();
  };

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onGenerate: handleGenerate,
    onTogglePalette: toggleCommandPalette,
    onCopy: handleCopy,
    onToggleHelp: toggleShortcutsModal,
    onClose: () => {}
  });

  const fullText = inputVal + (generatedText ? " " + generatedText : "");
  const generatedWords = generatedText ? generatedText.split(" ") : [];

  const suggestions = [
    { label: "Finish a motivational quote", seed: "The only limit to our realization of tomorrow" },
    { label: "Continue a story", seed: "Once upon a time, in a far away land" },
    { label: "Write a poem", seed: "The night is dark and full of stars" },
    { label: "Complete a sentence", seed: "The future belongs to those who" },
    { label: "Generate an idea", seed: "To create something truly unique, one must" }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start py-8 md:py-16 px-4 max-w-3xl w-full mx-auto relative min-h-[calc(100vh-4rem)]">
      
      {/* Developer setup screen overlay - localhost only */}
      {modelStatus && !modelStatus.ready && isLocalhost && (
        <SetupOverlay status={modelStatus} onCheckStatus={checkApiStatus} />
      )}

      {/* Production-only simple engine status banner */}
      {modelStatus && !modelStatus.ready && !isLocalhost && (
        <div className="w-full mb-6 p-4 rounded-xl border border-warning/20 bg-warning/5 text-warning flex items-start gap-3 text-xs font-sans">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Neural Engine Offline</span>
            <p className="mt-0.5 text-zinc-400">
              The AI generation server is currently initializing or undergoing maintenance. Writing remains available, but predictive continuations are locked.
            </p>
          </div>
        </div>
      )}

      {/* Central Editor Layout */}
      <div className="w-full flex-1 flex flex-col justify-between gap-8">
        
        {/* Large distration-free text editor */}
        <div className="relative flex-1">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="What would you like to continue writing today?"
            disabled={isGenerating}
            className={cn(
              "w-full bg-transparent border-0 outline-none text-white resize-none h-60 focus:ring-0 leading-relaxed font-serif",
              {
                "font-serif": editorFont === "serif",
                "font-sans": editorFont === "sans",
                "text-lg": fontSize === "lg",
                "text-xl": fontSize === "xl",
                "text-2xl": fontSize === "2xl",
              }
            )}
          />

          {/* Typewriter Output Render overlay */}
          {generatedText && (
            <div className={cn(
              "mt-6 border-t border-zinc-900 pt-6 text-left leading-relaxed",
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

          {/* Active Generation step status toast */}
          {isGenerating && (
            <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-md select-none font-sans">
              <RefreshCw className="w-3 h-3 text-primary animate-spin" />
              <span>{stepMessage}</span>
            </div>
          )}
        </div>

        {/* Dynamic Empty State Suggestions Panel */}
        {!inputVal.trim() && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2.5 pt-6"
          >
            <div className="text-zinc-500 text-xs font-semibold font-sans text-center md:text-left">
              Click a recommendation to fill the canvas
            </div>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(sug.seed)}
                  className="px-3.5 py-2 rounded-lg border border-card-border bg-card/40 hover:border-primary/20 hover:bg-card text-zinc-300 hover:text-white text-xs font-medium font-sans transition-all duration-150 cursor-pointer shadow-sm shadow-black/5"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Minimal Controls Row */}
        <div className="space-y-4 pt-6 border-t border-zinc-900/60 font-sans select-none">
          
          {/* Sliders Grid (by default only shows Max Words, Creativity hides in Advanced) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Slider
              label="Maximum Words"
              min={5}
              max={60}
              step={1}
              value={maxWords}
              onChange={setMaxWords}
              className="w-full"
            />
            
            {/* Toggle Advanced Settings */}
            <div className="flex items-end justify-center md:justify-end pb-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-zinc-500 hover:text-zinc-300 gap-1.5 text-xs font-semibold h-8"
              >
                <Sliders className="w-3.5 h-3.5" />
                {showAdvanced ? "Hide Advanced" : "Advanced Settings"}
              </Button>
            </div>
          </div>

          {/* Advanced Accordion Panel */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-3 border-t border-zinc-900/40"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Creativity Slider */}
                  <Slider
                    label="Creativity (Temperature)"
                    min={0.1}
                    max={2.0}
                    step={0.05}
                    value={temperature}
                    onChange={setTemperature}
                  />

                  {/* Fonts family selection */}
                  <div className="space-y-2 text-xs text-left">
                    <span className="text-zinc-400 font-medium block">Writing Font Style</span>
                    <div className="flex gap-2">
                      <Button
                        variant={editorFont === "serif" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setEditorFont("serif")}
                        className="text-xs h-9 w-1/2 border border-zinc-800"
                      >
                        Newsreader Serif
                      </Button>
                      <Button
                        variant={editorFont === "sans" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setEditorFont("sans")}
                        className="text-xs h-9 w-1/2 border border-zinc-800"
                      >
                        Inter Sans-Serif
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Operations Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
            
            {/* Quick Actions (only visible when text exists) */}
            <div className="flex gap-2 shrink-0">
              {fullText.trim() && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-zinc-500 hover:text-white p-2"
                    title="Copy writing output"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAsTXT("verra-writing.txt", fullText)}
                    className="text-zinc-500 hover:text-white p-2"
                    title="Download as TXT"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAsPDF("Verra Document", fullText)}
                    className="text-zinc-500 hover:text-white p-2"
                    title="Download as PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetGenerationState}
                    className="text-zinc-500 hover:text-danger p-2"
                    title="Clear canvas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Main Generate Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/history" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs border border-zinc-800 text-zinc-400 h-10 font-semibold px-4">
                  <History className="w-3.5 h-3.5" />
                  History
                </Button>
              </Link>
              
              <Button
                onClick={handleGenerate}
                disabled={!inputVal.trim() || isGenerating || modelStatus?.ready === false}
                className="w-full sm:w-auto gap-2 text-xs px-6 h-10 font-semibold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatedText ? "Continue Writing" : "Continue Sentence"}
              </Button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
