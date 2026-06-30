"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Sparkles, Download, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Extensions & Stores
import { GlowMark } from "@/utils/tiptap/glowMark";
import { InlineSuggestion } from "@/utils/tiptap/inlineSuggestion";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";
import { exportDocument } from "@/utils/exportHelpers";

// Custom light placeholder plugin for Tiptap
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const CustomPlaceholder = Extension.create({
  name: 'customPlaceholder',
  addOptions() {
    return {
      placeholder: "Start with one sentence. Verra continues from there...",
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations: (state) => {
            const { doc } = state;
            if (doc.childCount === 1 && doc.firstChild?.isTextblock && doc.firstChild.content.size === 0) {
              const span = document.createElement('span');
              span.className = 'verra-placeholder select-none pointer-events-none opacity-40 italic absolute left-0';
              span.textContent = this.options.placeholder;
              return DecorationSet.create(doc, [
                Decoration.widget(1, span)
              ]);
            }
            return DecorationSet.empty;
          }
        }
      })
    ];
  }
});

interface EditorSheetProps {
  activeDocumentId: string;
  onGenerationComplete: (data: any) => void;
}

export function EditorSheet({ activeDocumentId, onGenerationComplete }: EditorSheetProps) {
  const { 
    temperature, 
    setTemperature, 
    maxWords, 
    setMaxWords 
  } = useSettingsStore();

  const { 
    documents, 
    updateDocument 
  } = useDocumentStore();

  const activeDoc = documents.find((d) => d.id === activeDocumentId);

  // Custom Hover popovers for inline suggestions
  const [hoveredCandidates, setHoveredCandidates] = useState<string[] | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

  // Selection Floating formatting menu
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Style comparisons states
  const [compareMode, setCompareMode] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareOptions, setCompareOptions] = useState<{
    conservative: string;
    balanced: string;
    creative: string;
  } | null>(null);

  // Stream status & stats
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);

  // Writing Settings Collapsed Accordion
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Debounced auto-ghost text prediction timer
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      GlowMark,
      InlineSuggestion,
      CustomPlaceholder
    ],
    content: activeDoc?.content || "",
    onUpdate: ({ editor }) => {
      if (activeDocumentId) {
        const html = editor.getHTML();
        updateDocument(activeDocumentId, html);
      }
      
      // Clear ghost sug on any content update
      editor.commands.clearSuggestion();
      
      // Debounce trigger inline suggestion
      triggerDebouncedSuggestion(editor.getText());
    },
    onSelectionUpdate: ({ editor }) => {
      const { selection } = editor.state;
      if (selection.empty) {
        setMenuPosition(null);
        return;
      }
      const { view } = editor;
      const start = view.coordsAtPos(selection.from);
      const end = view.coordsAtPos(selection.to);
      const x = (start.left + end.right) / 2;
      const y = Math.min(start.top, end.top) - 14;
      setMenuPosition({ x, y: y + window.scrollY });
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none prose prose-zinc dark:prose-invert max-w-none text-zinc-100 placeholder-zinc-500",
      }
    }
  }, [activeDocumentId]);

  // Load editor content when switching documents
  useEffect(() => {
    if (editor && activeDoc && editor.getHTML() !== activeDoc.content) {
      editor.commands.setContent(activeDoc.content);
    }
  }, [activeDocumentId, editor]);

  // Debounced ghost text trigger
  const triggerDebouncedSuggestion = (text: string) => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    if (compareMode || isStreaming || isComparing) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const prompt = trimmed.slice(-200);
        const res = await fetch("http://localhost:8000/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            temperature,
            max_words: 1
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.generated_text && data.details && data.details.length > 0) {
            const nextWord = data.generated_text.trim();
            const detailObj = data.details[0];
            
            editor?.commands.setSuggestion(
              (text.endsWith(" ") ? "" : " ") + nextWord,
              detailObj.top_candidates
            );
          }
        }
      } catch (err) {
        // Safe fail
      }
    }, 600);
  };

  // Hover over accepted suggestion alternate suggestions popup
  const handleEditorMouseOver = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const glowSpan = target.closest(".verra-glow-text");
    if (glowSpan) {
      const rawCandidates = glowSpan.getAttribute("data-candidates");
      if (rawCandidates) {
        try {
          const parsed = JSON.parse(rawCandidates);
          if (parsed && parsed.length > 0) {
            const list = parsed.map((item: any) => typeof item === "string" ? item : item.word);
            setHoveredCandidates(list);
            setTooltipRect(glowSpan.getBoundingClientRect());
            return;
          }
        } catch (err) {}
      }
    }
    setHoveredCandidates(null);
    setTooltipRect(null);
  };

  // Side-by-side style comparison fetcher
  const handleCompareStyles = async () => {
    if (!editor || isComparing || isStreaming) return;
    
    const text = editor.getText().trim();
    if (!text) return;

    setIsComparing(true);
    setCompareOptions(null);

    const promptContext = text.slice(-300);

    try {
      const fetchStyle = async (temp: number) => {
        const response = await fetch("http://localhost:8000/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptContext,
            temperature: temp,
            max_words: 12
          })
        });
        if (response.ok) {
          const data = await response.json();
          return {
            text: data.generated_text || "",
            candidates: data.details?.[0]?.top_candidates || []
          };
        }
        return { text: "[Failed to load continuation]", candidates: [] };
      };

      const [consRes, balRes, creRes] = await Promise.all([
        fetchStyle(0.3),
        fetchStyle(0.8),
        fetchStyle(1.4)
      ]);

      setCompareOptions({
        conservative: consRes.text,
        balanced: balRes.text,
        creative: creRes.text
      });
      
      onGenerationComplete({
        word: balRes.text.split(" ")[0] || "",
        confidence: 0.8,
        top_candidates: balRes.candidates,
        input_tokens: []
      });
    } catch (err) {
      // Safe fallback
    } finally {
      setIsComparing(false);
    }
  };

  // Injects the selected style continuation into editor
  const applyStyleContinuation = (continuationText: string) => {
    if (!editor || !continuationText.trim()) return;

    const { state } = editor.view;
    const { selection } = state;
    const { from } = selection;

    const formattedContinuation = (editor.getText().endsWith(" ") ? "" : " ") + continuationText;

    editor.chain()
      .insertContentAt(from, formattedContinuation)
      .focus()
      .run();

    // Mark it with glow
    const to = from + formattedContinuation.length;
    editor.chain()
      .setTextSelection({ from, to })
      .setMark("glow", { candidates: [] })
      .setTextSelection(to)
      .unsetMark("glow")
      .run();

    setCompareOptions(null);
  };

  // Streaming text generation
  const handleStreamGeneration = async () => {
    if (!editor || isStreaming || isComparing) return;
    
    const text = editor.getText().trim();
    if (!text) return;

    setIsStreaming(true);
    
    const promptContext = text.slice(-400);
    const eventSource = new EventSource(
      `http://localhost:8000/api/generate/stream?prompt=${encodeURIComponent(promptContext)}&temperature=${temperature}&max_words=${maxWords}`
    );

    let accumulated = "";

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.step === "generating" && data.word) {
        const nextWord = (accumulated ? " " : "") + data.word;
        accumulated += nextWord;
        
        const { state } = editor.view;
        const { from } = state.selection;
        
        editor.chain()
          .insertContentAt(from, nextWord)
          .run();
          
        const to = from + nextWord.length;
        editor.chain()
          .setTextSelection({ from, to })
          .setMark("glow", { candidates: data.top_candidates || [] })
          .setTextSelection(to)
          .unsetMark("glow")
          .run();
          
        onGenerationComplete(data);
      } else if (data.step === "complete") {
        eventSource.close();
        setIsStreaming(false);
        editor.commands.focus();
      } else if (data.error) {
        eventSource.close();
        setIsStreaming(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };
  };

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => {
    editor?.chain().focus().toggleMark("glow").run();
  };

  const getActionButtonLabel = () => {
    if (isStreaming) return "Writing...";
    if (compareMode) return "Compare Styles";
    
    if (!editor) return "Continue Thought";
    const text = editor.getText().trim();
    if (!text) return "Start Writing";

    const lastChar = text.slice(-1);
    if (lastChar === "." || lastChar === "?" || lastChar === "!") {
      return "Complete Paragraph";
    }
    if (text.split(/\s+/).slice(-1)[0].length > 4) {
      return "Finish Sentence";
    }
    return "Continue Thought";
  };

  const handleCopy = () => {
    if (!activeDoc) return;
    const rawText = activeDoc.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeDoc) return null;

  return (
    <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col justify-between min-h-[calc(100vh-3.5rem)] relative">
      {/* Document Editor Sheet */}
      <div className="flex-1 flex flex-col">
        <input
          type="text"
          value={activeDoc.title}
          onChange={(e) => {
            const nextTitle = e.target.value;
            useDocumentStore.setState((state) => ({
              documents: state.documents.map((d) => 
                d.id === activeDocumentId ? { ...d, title: nextTitle, updatedAt: new Date().toISOString() } : d
              )
            }));
          }}
          className="w-full bg-transparent border-0 outline-none text-2xl font-semibold tracking-tight text-zinc-100 placeholder-zinc-700 font-serif mb-6"
          placeholder="Untitled Draft"
        />

        <div 
          className="relative flex-1 print-content-wrapper"
          onMouseOver={handleEditorMouseOver}
          onMouseLeave={() => {
            setHoveredCandidates(null);
            setTooltipRect(null);
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Selection Floating Formatting Menu */}
      {menuPosition && editor && (
        <div
          style={{
            position: "absolute",
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          className="bubble-menu bg-zinc-950 border border-zinc-800/80 p-1 rounded-lg flex items-center gap-0.5 shadow-xl backdrop-blur no-print z-50 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          <button
            onClick={toggleBold}
            className={cn("px-2 py-1 rounded text-[10px] uppercase font-mono font-bold tracking-wider hover:bg-zinc-900 transition cursor-pointer", { "text-purple-400 bg-purple-950/20": editor.isActive('bold') })}
          >
            B
          </button>
          <button
            onClick={toggleItalic}
            className={cn("px-2 py-1 rounded text-[10px] uppercase font-mono font-bold tracking-wider hover:bg-zinc-900 transition cursor-pointer", { "text-purple-400 bg-purple-950/20": editor.isActive('italic') })}
          >
            I
          </button>
          <button
            onClick={toggleUnderline}
            className={cn("px-2 py-1 rounded text-[10px] uppercase font-mono font-bold tracking-wider hover:bg-zinc-900 transition cursor-pointer", { "text-purple-400 bg-purple-950/20": editor.isActive('glow') })}
          >
            Glow
          </button>
        </div>
      )}

      {/* Hover Alternates Tooltip Card */}
      {hoveredCandidates && tooltipRect && (
        <div
          style={{
            position: "fixed",
            left: `${tooltipRect.left + tooltipRect.width / 2}px`,
            top: `${tooltipRect.top + window.scrollY}px`,
            transform: "translate(-50%, -105%)",
          }}
          className="bg-zinc-950/95 border border-zinc-800/80 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md z-50 flex flex-col gap-1 w-48 no-print pointer-events-none text-[10px] leading-relaxed animate-in fade-in zoom-in-95 duration-100"
        >
          <span className="text-[9px] text-zinc-550 font-mono uppercase tracking-wider">Alternates Verra considered:</span>
          <div className="flex flex-col gap-0.5 mt-1 text-zinc-300 font-serif">
            {hoveredCandidates.map((c, idx) => (
              <span key={idx} className="hover:text-white">• {c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side style comparisons container */}
      {compareMode && compareOptions && (
        <div className="mt-8 p-4 border border-purple-900/30 bg-purple-950/5 rounded-xl space-y-4 no-print animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Style Comparisons
            </span>
            <button 
              onClick={() => setCompareOptions(null)}
              className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 transition"
            >
              Clear Comparisons
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conservative */}
            <div 
              onClick={() => applyStyleContinuation(compareOptions.conservative)}
              className="p-4 rounded-lg border border-zinc-850 hover:border-purple-800/40 bg-zinc-900/20 hover:bg-zinc-900/50 transition cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] text-zinc-500 font-mono block mb-2 uppercase">Conservative (0.3)</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-serif">
                  "{compareOptions.conservative}"
                </p>
              </div>
              <span className="text-[9px] text-purple-400 mt-4 font-medium">Click to Insert</span>
            </div>

            {/* Balanced */}
            <div 
              onClick={() => applyStyleContinuation(compareOptions.balanced)}
              className="p-4 rounded-lg border border-zinc-850 hover:border-purple-800/40 bg-zinc-900/20 hover:bg-zinc-900/50 transition cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] text-zinc-500 font-mono block mb-2 uppercase">Balanced (0.8)</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-serif">
                  "{compareOptions.balanced}"
                </p>
              </div>
              <span className="text-[9px] text-purple-400 mt-4 font-medium">Click to Insert</span>
            </div>

            {/* Creative */}
            <div 
              onClick={() => applyStyleContinuation(compareOptions.creative)}
              className="p-4 rounded-lg border border-zinc-850 hover:border-purple-800/40 bg-zinc-900/20 hover:bg-zinc-900/50 transition cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] text-zinc-500 font-mono block mb-2 uppercase">Creative (1.4)</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-serif">
                  "{compareOptions.creative}"
                </p>
              </div>
              <span className="text-[9px] text-purple-400 mt-4 font-medium">Click to Insert</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions Toolbar & Accordion */}
      <div className="mt-8 pt-6 border-t border-zinc-900/40 flex flex-col gap-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={compareMode ? handleCompareStyles : handleStreamGeneration}
              disabled={isStreaming || isComparing}
              className="bg-purple-900/80 hover:bg-purple-900 text-white text-xs px-5 py-2.5 rounded-lg border border-purple-800/30 font-medium transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{getActionButtonLabel()}</span>
            </button>

            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareOptions(null);
              }}
              className={cn(
                "text-[10px] font-mono tracking-wider uppercase px-3 py-2 rounded-lg border transition cursor-pointer",
                {
                  "bg-purple-950/20 text-purple-400 border-purple-800/40": compareMode,
                  "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700": !compareMode
                }
              )}
            >
              {compareMode ? "Style Compare On" : "Compare Styles"}
            </button>
          </div>

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono tracking-wider uppercase transition cursor-pointer"
          >
            {showSettingsDrawer ? "Hide Controls" : "Writing Controls"}
          </button>
        </div>

        {showSettingsDrawer && (
          <div className="p-4 border border-zinc-850 bg-zinc-900/10 rounded-xl space-y-4 animate-in slide-in-from-bottom-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <span>Creativity (Temperature)</span>
                  <span>{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.8"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-650 font-mono">
                  <span>Safe</span>
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <span>Continuation Length</span>
                  <span>{maxWords} words</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={maxWords}
                  onChange={(e) => setMaxWords(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-650 font-mono">
                  <span>Sentence</span>
                  <span>Paragraph</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-900/60 pt-3 text-[10px] text-zinc-500 font-mono">
              <span>Tip: Press Tab to accept ghost text suggestions as you write.</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="hover:text-zinc-200 transition px-2 py-0.5 rounded hover:bg-zinc-800/40 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => exportDocument(activeDoc.title, activeDoc.content, 'markdown')}
                  className="hover:text-zinc-200 transition"
                >
                  MD
                </button>
                <button
                  onClick={() => exportDocument(activeDoc.title, activeDoc.content, 'txt')}
                  className="hover:text-zinc-200 transition"
                >
                  TXT
                </button>
                <button
                  onClick={() => exportDocument(activeDoc.title, activeDoc.content, 'pdf')}
                  className="hover:text-zinc-200 transition"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
