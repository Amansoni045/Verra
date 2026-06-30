"use client";

import React, { useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { BookOpen, BrainCircuit, RefreshCw, Layers, Award, ArrowRight, Activity, Terminal } from "lucide-react";
import historyData from "../../data/extracted_history.json";

interface BehindTheWritingProps {
  onBack: () => void;
  lastInputText?: string;
  lastPredictionDetails?: {
    word: string;
    confidence: number;
    top_candidates: { word: string; probability: number }[];
    input_tokens: { token_id: number; word: string }[];
  } | null;
}

export function BehindTheWriting({ onBack, lastInputText = "", lastPredictionDetails }: BehindTheWritingProps) {
  const [activeTab, setActiveTab] = useState<"works" | "training">("works");
  const [technicalView, setTechnicalView] = useState(false);

  // Format data for Recharts validation curves
  const rnnLength = historyData.rnn.loss.length;
  const lstmLength = historyData.lstm.loss.length;
  const maxEpochs = Math.max(rnnLength, lstmLength);

  const chartData = Array.from({ length: maxEpochs }).map((_, i) => ({
    epoch: i + 1,
    rnn_loss: historyData.rnn.loss[i] !== undefined ? Number(historyData.rnn.loss[i].toFixed(3)) : null,
    rnn_val_loss: historyData.rnn.val_loss[i] !== undefined ? Number(historyData.rnn.val_loss[i].toFixed(3)) : null,
    rnn_acc: historyData.rnn.accuracy[i] !== undefined ? Number((historyData.rnn.accuracy[i] * 100).toFixed(1)) : null,
    rnn_val_acc: historyData.rnn.val_accuracy[i] !== undefined ? Number((historyData.rnn.val_accuracy[i] * 100).toFixed(1)) : null,
    
    lstm_loss: historyData.lstm.loss[i] !== undefined ? Number(historyData.lstm.loss[i].toFixed(3)) : null,
    lstm_val_loss: historyData.lstm.val_loss[i] !== undefined ? Number(historyData.lstm.val_loss[i].toFixed(3)) : null,
    lstm_acc: historyData.lstm.accuracy[i] !== undefined ? Number((historyData.lstm.accuracy[i] * 100).toFixed(1)) : null,
    lstm_val_acc: historyData.lstm.val_accuracy[i] !== undefined ? Number((historyData.lstm.val_accuracy[i] * 100).toFixed(1)) : null,
  }));

  // Visual simulation contexts
  const sampleInput = lastInputText.trim() || "The path to the stars is";
  const sampleTokens = lastPredictionDetails?.input_tokens || [
    { token_id: 14, word: "the" },
    { token_id: 289, word: "path" },
    { token_id: 11, word: "to" },
    { token_id: 14, word: "the" },
    { token_id: 981, word: "stars" },
    { token_id: 9, word: "is" }
  ];
  const sampleCandidates = lastPredictionDetails?.top_candidates || [
    { word: "written", probability: 0.28 },
    { word: "long", probability: 0.19 },
    { word: "never", probability: 0.12 },
    { word: "always", probability: 0.08 }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-6 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800/60 pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 font-serif">Behind the Writing</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Explore how Verra remembers previous words and continues your sentences.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer"
        >
          ← Return to Writing
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-800/40 mb-8 p-1 bg-zinc-950/40 rounded-lg max-w-xs">
        <button
          onClick={() => setActiveTab("works")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "works"
              ? "bg-zinc-800/80 text-white shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          How Verra Works
        </button>
        <button
          onClick={() => setActiveTab("training")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "training"
              ? "bg-zinc-800/80 text-white shadow"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Training History
        </button>
      </div>

      {/* Tab 1: How Verra Works */}
      {activeTab === "works" && (
        <div className="space-y-8">
          {/* Visual Story */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-medium text-zinc-200 font-serif">The Writing Flow</h2>
              <button
                onClick={() => setTechnicalView(!technicalView)}
                className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded border transition cursor-pointer ${
                  technicalView
                    ? "bg-purple-950/20 text-purple-400 border-purple-800/40 hover:bg-purple-950/40"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {technicalView ? "Hide Technical View" : "Show Technical View"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-10 left-1/8 right-1/8 h-0.5 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-emerald-500/20 -z-10" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-950/30 border border-purple-800/20 mb-3 text-purple-400 text-xs font-mono font-bold">1</div>
                <h3 className="text-xs font-medium text-zinc-200 mb-1">Your Sentence</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[180px]">
                  You write your thoughts into the editor.
                </p>
                {technicalView && (
                  <div className="mt-3 py-1.5 px-2 bg-zinc-950 border border-zinc-850 rounded text-[10px] text-zinc-300 font-mono w-full break-all">
                    "{sampleInput.length > 25 ? sampleInput.slice(0, 22) + "..." : sampleInput}"
                  </div>
                )}
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-950/30 border border-indigo-800/20 mb-3 text-indigo-400 text-xs font-mono font-bold">2</div>
                <h3 className="text-xs font-medium text-zinc-200 mb-1">Understanding</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[180px]">
                  Verra translates words into numerical definitions.
                </p>
                {technicalView && (
                  <div className="mt-3 p-1.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-indigo-400 font-mono w-full text-left space-y-1">
                    <span className="text-[8px] text-zinc-500 block uppercase font-mono">Token IDs:</span>
                    <div className="flex flex-wrap gap-1">
                      {sampleTokens.map((t, idx) => (
                        <span key={idx} className="bg-indigo-950/40 px-1 py-0.5 border border-indigo-900/30 rounded" title={t.word}>
                          {t.token_id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-950/30 border border-blue-800/20 mb-3 text-blue-400 text-xs font-mono font-bold">3</div>
                <h3 className="text-xs font-medium text-zinc-200 mb-1">Memory Gates</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[180px]">
                  Verra tracks the narrative context step-by-step.
                </p>
                {technicalView && (
                  <div className="mt-3 p-1.5 bg-zinc-950 border border-zinc-850 rounded text-[8px] text-blue-400 font-mono w-full text-left space-y-1">
                    <span className="text-[8px] text-zinc-500 block uppercase font-mono">LSTM state:</span>
                    <div>forget gate: <span className="text-zinc-300">f_t = sigmoid(...)</span></div>
                    <div>input gate: <span className="text-zinc-300">i_t = sigmoid(...)</span></div>
                    <div>cell state: <span className="text-zinc-300">C_t = f_t * C_prev + ...</span></div>
                  </div>
                )}
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-950/30 border border-emerald-800/20 mb-3 text-emerald-400 text-xs font-mono font-bold">4</div>
                <h3 className="text-xs font-medium text-zinc-200 mb-1">Natural Flow</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[180px]">
                  Verra generates the next word to finish your thought.
                </p>
                {technicalView && (
                  <div className="mt-3 p-1.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-emerald-400 font-mono w-full text-left space-y-1">
                    <span className="text-[8px] text-zinc-500 block uppercase font-mono">Softmax Probabilities:</span>
                    <div className="space-y-0.5">
                      {sampleCandidates.slice(0, 3).map((c, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{c.word}</span>
                          <span className="text-zinc-500">{(c.probability * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical View Details */}
          {technicalView && (
            <div className="p-6 rounded-xl border border-purple-900/20 bg-purple-950/5 text-xs text-zinc-300 leading-relaxed space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <BrainCircuit className="w-4 h-4" />
                <h4 className="font-semibold uppercase tracking-wider font-mono text-[10px]">Underlying LSTM Architecture</h4>
              </div>
              <p>
                Unlike massive transformer-based models that run in data warehouses, Verra runs a locally trained <strong>Long Short-Term Memory (LSTM)</strong> recurrent neural network. This network maintains a persistent state loop ($C_t$ and $h_t$) to process words sequentially:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-zinc-950/80 p-4 border border-zinc-900 rounded-lg font-mono text-[10px] text-zinc-400 space-y-2">
                  <div className="text-zinc-200 border-b border-zinc-900 pb-1 uppercase font-bold text-[9px] tracking-wider">State Equations</div>
                  <div>Forget: <span className="text-purple-400">f_t = σ(W_f · [h_prev, x_t] + b_f)</span></div>
                  <div>Input: <span className="text-purple-400">i_t = σ(W_i · [h_prev, x_t] + b_i)</span></div>
                  <div>Candidate: <span className="text-purple-400">c̃_t = tanh(W_c · [h_prev, x_t] + b_c)</span></div>
                  <div>Update: <span className="text-purple-400">C_t = f_t * C_prev + i_t * c̃_t</span></div>
                  <div>Output: <span className="text-purple-400">o_t = σ(W_o · [h_prev, x_t] + b_o)</span></div>
                  <div>Hidden: <span className="text-purple-400">h_t = o_t * tanh(C_t)</span></div>
                </div>
                <div className="bg-zinc-950/80 p-4 border border-zinc-900 rounded-lg space-y-2 text-zinc-400">
                  <div className="text-zinc-200 border-b border-zinc-900 pb-1 uppercase font-mono font-bold text-[9px] tracking-wider">Model Summary</div>
                  <div className="flex justify-between text-[11px]">
                    <span>Vocabulary Size</span>
                    <span className="font-mono text-zinc-200">8,978 words</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Embedding Dimensions</span>
                    <span className="font-mono text-zinc-200">50 dense features</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>LSTM Layer</span>
                    <span className="font-mono text-zinc-200">128 memory units</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Output Projection</span>
                    <span className="font-mono text-zinc-200">Dense Softmax</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Training Performance */}
      {activeTab === "training" && (
        <div className="space-y-8">
          <div className="p-5 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex flex-col md:flex-row gap-6 items-center">
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-200 font-serif">Keras Validation Metrics</h3>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                The LSTM model represents a substantial improvement over the Simple RNN. By adding feedback memory loops, it successfully lowered validation loss to <strong>6.31</strong> and improved accuracy. These curves plot real metrics extracted during model execution in the development notebook.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Validation Loss */}
            <div className="flex flex-col p-4 border border-zinc-800/40 bg-zinc-900/10 rounded-xl">
              <h4 className="text-xs font-medium text-zinc-300 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-zinc-500" />
                Validation Loss (Lower is Better)
              </h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="epoch" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} domain={[3.5, 7.5]} />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                      labelStyle={{ color: "#a1a1aa", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                    <Line type="monotone" dataKey="rnn_val_loss" name="Simple RNN Val Loss" stroke="#f43f5e" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="lstm_val_loss" name="LSTM Val Loss" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Validation Accuracy */}
            <div className="flex flex-col p-4 border border-zinc-800/40 bg-zinc-900/10 rounded-xl">
              <h4 className="text-xs font-medium text-zinc-300 mb-4 font-mono uppercase tracking-wider flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-zinc-500" />
                Validation Accuracy (Higher is Better)
              </h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="epoch" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} domain={[3, 14]} unit="%" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                      labelStyle={{ color: "#a1a1aa", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                    <Line type="monotone" dataKey="rnn_val_acc" name="Simple RNN Val Acc" stroke="#f43f5e" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="lstm_val_acc" name="LSTM Val Acc" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
