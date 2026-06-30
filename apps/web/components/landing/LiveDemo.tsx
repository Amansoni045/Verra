"use client";

import * as React from "react";
import { Play, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamTextGeneration, getModelStatus } from "@/services/api";
import { useGenerationStore } from "@/store/generationStore";
import { motion } from "framer-motion";

export function LiveDemo() {
  const [promptInput, setPromptInput] = React.useState("The future belongs");
  const [displayText, setDisplayText] = React.useState("");
  const [isGeneratingLocally, setIsGeneratingLocally] = React.useState(false);
  const [apiOnline, setApiOnline] = React.useState(false);

  // Check if API is online
  React.useEffect(() => {
    getModelStatus().then((status) => {
      setApiOnline(status.online && status.engine.ready);
    });
  }, []);

  const triggerLocalSimulation = () => {
    setIsGeneratingLocally(true);
    setDisplayText("");
    
    const sampleWords = "to those who believe in the beauty of their dreams and work to build it step by step".split(" ");
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      if (currentIdx < sampleWords.length) {
        setDisplayText((prev) => prev ? prev + " " + sampleWords[currentIdx] : sampleWords[currentIdx]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsGeneratingLocally(false);
      }
    }, 180);
  };

  const handleGenerate = async () => {
    if (isGeneratingLocally) return;

    if (!apiOnline) {
      triggerLocalSimulation();
      return;
    }

    setIsGeneratingLocally(true);
    setDisplayText("");

    await streamTextGeneration(
      promptInput,
      1.0,
      "top_k",
      (event) => {
        if (event.step === "generating" && event.word) {
          setDisplayText((prev) => prev ? prev + " " + event.word : event.word || "");
        }
      },
      (error) => {
        console.error("Live Demo stream error:", error);
        triggerLocalSimulation();
      },
      () => {
        setIsGeneratingLocally(false);
      }
    );
  };

  // Run automatically on first load to capture curiosity
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerate();
    }, 1000);
    return () => clearTimeout(timer);
  }, [apiOnline]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative border border-card-border bg-card rounded-xl p-5 md:p-6 shadow-2xl glass-panel flex flex-col gap-4 overflow-hidden">
        
        {/* Decorative Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
            Interactive Generation Engine
          </span>
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? "bg-success animate-pulse" : "bg-zinc-600"}`} />
            {apiOnline ? "Neural Online" : "Local Simulation"}
          </span>
        </div>

        {/* Text Area */}
        <div className="min-h-36 py-2 text-left font-serif select-none flex flex-col justify-between">
          <div className="text-lg md:text-xl text-zinc-200 leading-relaxed">
            <span className="text-zinc-500 italic select-all mr-1.5">{promptInput}</span>
            <span className="text-white font-medium">
              {displayText}
              {isGeneratingLocally && (
                <span className="inline-block w-1.5 h-5 ml-1 bg-primary animate-cursor-blink border-l border-primary" />
              )}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/40">
          <span className="text-[10px] text-zinc-500 font-sans italic">
            {isGeneratingLocally ? "Neural network running..." : "Click regenerate to run next-word predictions."}
          </span>
          
          <Button
            onClick={handleGenerate}
            disabled={isGeneratingLocally}
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs border border-zinc-800 h-9 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Regenerate Output
          </Button>
        </div>
      </div>
    </div>
  );
}
