"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers, Network, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModelComparison() {
  const models = [
    {
      title: "Simple RNN",
      icon: <Network className="w-5 h-5" />,
      tag: "Baseline Model",
      accuracy: "Low (~15% local accuracy)",
      trainingTime: "Fastest (~45s per epoch)",
      memory: "Short-term (lacks memory cells)",
      gradients: "Prone to vanishing/exploding gradients",
      architecture: "Single recurrent layer feedback loops mapping previous hidden state directly to current step.",
      advantages: ["Extremely lightweight", "Fast computation speed", "Low memory footprint"],
      disadvantages: ["Cannot capture long sequences", "Lacks memory gating", "Struggles with sentence cohesion"],
      borderColor: "hover:border-blue-500/30",
    },
    {
      title: "LSTM",
      icon: <Activity className="w-5 h-5 text-primary" />,
      tag: "Standard Engine (Active)",
      accuracy: "Moderate (~26% accuracy)",
      trainingTime: "Medium (~65s per epoch)",
      memory: "Selective long & short-term gates",
      gradients: "Stable gradient flow (cell state paths)",
      architecture: "Single LSTM layer containing input, forget, and output gates that regulate memory cell information.",
      advantages: ["Captures syntactic dependencies", "Learns punctuation structure", "Robust sequence retention"],
      disadvantages: ["Requires GPU for larger corpora", "Slower compilation than Simple RNN", "Higher parameter counts"],
      borderColor: "hover:border-primary/40",
      featured: true,
    },
    {
      title: "Stacked LSTM",
      icon: <Layers className="w-5 h-5" />,
      tag: "Complex Architecture",
      accuracy: "High (Learns hierarchical abstractions)",
      trainingTime: "Slowest (~144s per epoch)",
      memory: "Multi-layered memory retention",
      gradients: "Stable, but increases computation paths",
      architecture: "Multiple sequential LSTM layers stacked where layer outputs feed directly into subsequent layers.",
      advantages: ["Learns abstract semantic concepts", "Excels at stylistic formatting", "High capacity model"],
      disadvantages: ["High risk of overfitting", "Extremely slow CPU training", "High inference latency"],
      borderColor: "hover:border-emerald-500/30",
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <div className="text-center space-y-2 mb-12">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          MODEL ZOO
        </span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
          Neural Architecture Comparison
        </h2>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto font-sans leading-relaxed">
          Explore the performance tradeoffs, memory gates, and computational profiles of our recurrent neural models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((model, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -6 }}
            className={cn(
              "relative border rounded-xl bg-card p-5 md:p-6 shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-default group",
              model.featured ? "border-primary/30" : "border-card-border",
              model.borderColor
            )}
          >
            {/* Background glowing spot */}
            <div className={cn(
              "absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none",
              model.featured ? "bg-primary" : "bg-zinc-400"
            )} />

            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-primary transition-colors">
                  {model.icon}
                </div>
                <span className="text-[9px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500 font-sans">
                  {model.tag}
                </span>
              </div>
              
              <h3 className="mt-4 text-sm font-bold text-white font-sans tracking-tight">
                {model.title}
              </h3>
              
              <p className="mt-2 text-[11px] text-zinc-400 leading-normal font-sans">
                {model.architecture}
              </p>

              {/* Specs List */}
              <div className="mt-5 space-y-2.5 text-[11px] font-sans border-t border-zinc-800/40 pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Prediction Accuracy</span>
                  <span className="font-semibold text-zinc-300 font-mono">{model.accuracy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Inference/Training time</span>
                  <span className="font-semibold text-zinc-300 font-mono">{model.trainingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Memory Capability</span>
                  <span className="font-semibold text-zinc-300">{model.memory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gradient Handling</span>
                  <span className="font-semibold text-zinc-300">{model.gradients}</span>
                </div>
              </div>
            </div>

            {/* Expandable Details on hover */}
            <div className="mt-6 space-y-3 pt-4 border-t border-zinc-800/40">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Advantages</span>
                <ul className="mt-1 list-disc list-inside text-[11px] text-zinc-400 space-y-0.5 font-sans pl-1">
                  {model.advantages.map((adv, i) => <li key={i}>{adv}</li>)}
                </ul>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Disadvantages</span>
                <ul className="mt-1 list-disc list-inside text-[11px] text-zinc-400 space-y-0.5 font-sans pl-1">
                  {model.disadvantages.map((dis, i) => <li key={i}>{dis}</li>)}
                </ul>
              </div>
            </div>

          </motion.div>
        ))}
      </div>
    </div>
  );
}
