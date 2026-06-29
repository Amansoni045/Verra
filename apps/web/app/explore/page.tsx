"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Copy, ChevronRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXAMPLE_PROMPTS } from "@/constants/prompts";
import { motion } from "framer-motion";

export default function ExplorePage() {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      
      {/* Title Header */}
      <div className="space-y-3 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          PROMPT GALLERY
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Explore Inspirations
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed font-sans">
          Browse categorized writing starters. Click any prompt to copy its seed text directly or launch it inside the Writing Studio.
        </p>
      </div>

      {/* Grid gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {EXAMPLE_PROMPTS.map((prompt, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            className="group relative border border-card-border bg-card p-5 rounded-xl flex flex-col justify-between hover:border-zinc-800/80 transition-all duration-200 glass-panel"
          >
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary tracking-wide uppercase font-sans">
                  {prompt.category}
                </span>
                <Bookmark className="w-3.5 h-3.5 text-zinc-600 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-white mt-2 font-sans">{prompt.label}</h3>
              
              <div className="mt-3.5 p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-900 font-serif text-sm text-zinc-300 italic leading-relaxed">
                &ldquo;{prompt.seed}...&rdquo;
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-zinc-900/60 font-sans">
              <span className="text-[10px] text-zinc-500 leading-normal font-sans italic line-clamp-1">
                {prompt.description}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(prompt.seed, idx)}
                  className="text-zinc-500 hover:text-white p-2"
                >
                  <Copy className="w-4 h-4" />
                  <span className="sr-only">Copy Prompt</span>
                  {copiedIndex === idx && (
                    <span className="absolute bottom-full mb-1 right-0 text-[9px] bg-zinc-950 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded shadow">
                      Copied
                    </span>
                  )}
                </Button>
                <Link href={`/studio?seed=${encodeURIComponent(prompt.seed)}`}>
                  <Button
                    size="sm"
                    className="gap-1 text-[10px] font-bold px-3 py-1.5 h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300"
                  >
                    Open Studio
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
