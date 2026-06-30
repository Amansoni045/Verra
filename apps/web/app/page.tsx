"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Settings, 
  BookOpen, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Stores
import { useDocumentStore } from "@/store/documentStore";
import { useThemeStore } from "@/store/themeStore";
import { useUIStore } from "@/store/uiStore";
import { getModelStatus } from "@/services/api";

// Components
import { BehindTheWriting } from "@/components/neural/BehindTheWriting";
import { ExampleGallery } from "@/components/landing/ExampleGallery";
import { CommandPalette } from "@/components/layout/CommandPalette";

// Dynamically import the EditorSheet component (ssr: false) to prevent ProseMirror SSR crashes
const EditorSheet = dynamic(
  () => import("@/components/editor/EditorSheet").then((mod) => mod.EditorSheet),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-3.5rem)] text-xs text-zinc-550 font-mono">
      <span>Loading writing workspace...</span>
    </div>
  )}
);

export default function HomePage() {
  const { theme, toggleTheme } = useThemeStore();
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    setSettingsOpen,
    toggleCommandPalette 
  } = useUIStore();

  const { 
    documents, 
    activeDocumentId, 
    createDocument, 
    deleteDocument, 
    setActiveDocumentId 
  } = useDocumentStore();

  const [activeTab, setActiveTab] = useState<"editor" | "gallery" | "lab">("gallery");
  const [modelReady, setModelReady] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastPredictionDetails, setLastPredictionDetails] = useState<any>(null);

  // Fetch model status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getModelStatus();
        setModelReady(res.engine.ready);
      } catch (e) {
        setModelReady(false);
      }
    };
    fetchStatus();
  }, []);

  // Control tabs based on document selection
  useEffect(() => {
    if (activeDocumentId) {
      setActiveTab("editor");
    } else {
      setActiveTab("gallery");
    }
  }, [activeDocumentId]);

  // Sidebar Filter list
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const handleSelectExample = (title: string, content: string) => {
    const id = createDocument(title, content);
    setActiveDocumentId(id);
    setActiveTab("editor");
  };

  const handleNewDraft = () => {
    const id = createDocument("Untitled Draft", "");
    setActiveDocumentId(id);
    setActiveTab("editor");
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-zinc-950 border-r border-zinc-900/60 flex flex-col shrink-0 overflow-hidden no-print z-40"
          >
            <div className="px-5 py-4 border-b border-zinc-900/40 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">Recent Drafts</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-zinc-900/20">
              <input
                type="text"
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-zinc-900/60 border border-zinc-850 px-3 py-1.5 rounded-md outline-none text-zinc-200 placeholder-zinc-500 focus:border-purple-800/40"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const words = getWordCount(doc.content);
                  const isSelected = doc.id === activeDocumentId && activeTab === "editor";
                  const friendlyTime = new Date(doc.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setActiveDocumentId(doc.id);
                        setActiveTab("editor");
                      }}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 relative cursor-pointer outline-none ${
                        isSelected
                          ? "bg-zinc-900/70 border-zinc-800 text-white"
                          : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-medium truncate max-w-[170px]">{doc.title}</h3>
                        <span className="text-[9px] text-zinc-650 font-mono shrink-0">{friendlyTime}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed font-serif">
                        {doc.preview || "Empty draft..."}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[9px] text-zinc-650 font-mono">
                        <span>{words} {words === 1 ? 'word' : 'words'}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument(doc.id);
                          }}
                          className="hover:text-rose-450 p-0.5 rounded transition cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-600 flex flex-col items-center justify-center gap-2">
                  <FileText className="w-8 h-8 text-zinc-700 stroke-[1.5]" />
                  <span className="text-[10px]">No drafts found.</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-900/60 bg-zinc-950/80 space-y-1">
              <button
                onClick={() => {
                  setActiveDocumentId(null);
                  setActiveTab("gallery");
                }}
                className="w-full py-2 px-3 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/50 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Inspiration Gallery
              </button>
              <button
                onClick={() => {
                  setActiveTab("lab");
                }}
                className="w-full py-2 px-3 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/50 flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Behind the Writing
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Canvas Workspace */}
      <div className="flex-1 flex flex-col bg-[#09090B] overflow-y-auto relative h-full">
        {/* Main header */}
        <header className="h-14 border-b border-zinc-900/40 px-6 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-900/80 transition cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <h1 
              onClick={() => {
                setActiveDocumentId(null);
                setActiveTab("gallery");
              }}
              className="text-sm font-medium tracking-wide text-zinc-200 cursor-pointer hover:text-white transition font-serif"
            >
              Verra
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("lab");
              }}
              className="text-xs px-2.5 py-1 text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
              title="See inside the recurrent model"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Behind the Writing</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handleNewDraft}
              className="text-xs bg-purple-900/20 hover:bg-purple-950/40 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-800/20 flex items-center gap-1.5 transition cursor-pointer font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Draft</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 flex flex-col justify-start">
          {activeTab === "gallery" && (
            <div className="flex-1 flex flex-col justify-center py-12">
              <ExampleGallery onSelect={handleSelectExample} />
              
              <div className="text-center mt-6">
                <span className="text-xs text-zinc-550">or</span>
                <button
                  onClick={handleNewDraft}
                  className="mt-3 block mx-auto text-xs py-2 px-6 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer font-medium"
                >
                  + Start Blank Draft
                </button>
              </div>
            </div>
          )}

          {activeTab === "lab" && (
            <BehindTheWriting 
              onBack={() => {
                if (activeDocumentId) {
                  setActiveTab("editor");
                } else {
                  setActiveTab("gallery");
                }
              }} 
              lastInputText=""
              lastPredictionDetails={lastPredictionDetails}
            />
          )}

          {activeTab === "editor" && activeDocumentId && (
            <EditorSheet 
              activeDocumentId={activeDocumentId} 
              onGenerationComplete={setLastPredictionDetails} 
            />
          )}
        </div>
      </div>
      
      {/* Command Palette Overlay */}
      <CommandPalette 
        onShowLab={() => setActiveTab("lab")} 
        onToggleCompare={() => {
          // Compare mode is handled within EditorSheet component
        }} 
      />
    </div>
  );
}
