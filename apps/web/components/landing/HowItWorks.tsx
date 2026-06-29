"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown, Cpu, Binary, AlignLeft, Layers, Sparkles } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <AlignLeft className="w-5 h-5" />,
      title: "Input Context",
      description: "You type a seed text into the editor (e.g. \"The future belongs\").",
      detail: "The raw text serves as the foundation for context-aware prediction."
    },
    {
      icon: <Binary className="w-5 h-5" />,
      title: "Tokenization & Slicing",
      description: "Text is cleaned, split into words, and mapped to unique numerical tokens.",
      detail: "Machine learning models cannot read characters, so we represent words as numbers."
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Sequence Embedding",
      description: "Numerical tokens are padded to uniform length and mapped to multi-dimensional vectors.",
      detail: "Dense vector spaces capture semantic relations (e.g. mapping 'king' close to 'queen')."
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      title: "Recurrent Network (LSTM)",
      description: "The LSTM layer processes the sequence step-by-step, maintaining short & long term memory.",
      detail: "Memory gates selectively forget historical noise and remember structural context."
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Probability Distribution",
      description: "The model runs a Dense softmax layer to output probabilities for the next possible word.",
      detail: "It scores all 8,978 words in our vocabulary to select the best continuation."
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="text-center space-y-2 mb-12">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          NLP PIPELINE
        </span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
          How Next-Word Prediction Works
        </h2>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto font-sans leading-relaxed">
          Verra converts your text inputs into mathematical representations, runs neural inference, and predicts what word follows.
        </p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative flex flex-col items-center p-5 rounded-xl border border-card-border bg-card shadow-lg hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Step Icon Badge */}
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-all duration-300">
                {step.icon}
              </div>

              {/* Step number badge */}
              <span className="absolute top-3 right-3 text-[10px] font-bold font-mono text-zinc-600 group-hover:text-primary/70 transition-colors">
                0{idx + 1}
              </span>

              <h3 className="mt-4 text-xs font-bold text-white tracking-tight font-sans">
                {step.title}
              </h3>
              
              <p className="mt-2 text-[11px] text-zinc-400 text-center leading-relaxed font-sans">
                {step.description}
              </p>
              
              <div className="mt-3.5 pt-3 border-t border-zinc-800/40 w-full text-[10px] text-zinc-500 text-center leading-normal font-sans italic opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {step.detail}
              </div>
            </motion.div>
            
            {/* Connective Arrow for desktop layout */}
            {idx < steps.length - 1 && (
              <div className="hidden md:flex items-center justify-center text-zinc-700 select-none pointer-events-none">
                <ArrowDown className="w-4 h-4 rotate-270 text-zinc-800 animate-pulse" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
