"use client";

import React, { useState, useEffect } from "react";
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
import { 
  BookOpen, 
  BrainCircuit, 
  Layers, 
  Award, 
  ArrowRight, 
  Activity, 
  Binary, 
  Cpu, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Sparkles
} from "lucide-react";
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
  const [interactiveStep, setInteractiveStep] = useState(0);

  // Fallback data if no prediction has run yet
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
    { word: "written", probability: 0.82 },
    { word: "clear", probability: 0.08 },
    { word: "made", probability: 0.05 },
    { word: "ours", probability: 0.03 }
  ];
  const predictedWord = lastPredictionDetails?.word || "written";

  const steps = [
    { name: "Sentence", desc: "User Input" },
    { name: "Tokenizer", desc: "Splitting Words" },
    { name: "Sequence", desc: "Token IDs" },
    { name: "Embedding", desc: "Embedding Floats" },
    { name: "LSTM Memory", desc: "State Update" },
    { name: "Prediction", desc: "Softmax Selection" }
  ];

  // Auto-typing animation for Step 0 (Sentence)
  const [typedText, setTypedText] = useState("");
  useEffect(() => {
    if (interactiveStep === 0) {
      setTypedText("");
      let i = 0;
      const interval = setInterval(() => {
        setTypedText((prev) => prev + sampleInput.charAt(i));
        i++;
        if (i >= sampleInput.length) {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [interactiveStep, sampleInput]);

  // Format data for Recharts curves
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

  const handleNextStep = () => {
    setInteractiveStep((prev) => (prev < 5 ? prev + 1 : 0));
  };

  const handlePrevStep = () => {
    setInteractiveStep((prev) => (prev > 0 ? prev - 1 : 5));
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col gap-8 min-h-[calc(100vh-3.5rem)] no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900/60 pb-6">
        <div>
          <h2 className="text-xl font-medium tracking-tight text-zinc-100 font-serif flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Inside Verra
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-md">
            Explore the recurrent neural architecture driving your co-writing companion.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs py-1.5 px-4 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer"
        >
          ← Return to Editor
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-zinc-900/40 border border-zinc-850 p-1 rounded-lg w-full max-w-sm">
        <button
          onClick={() => setActiveTab("works")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "works"
              ? "bg-zinc-800/80 text-white shadow"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          How Verra Works
        </button>
        <button
          onClick={() => setActiveTab("training")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === "training"
              ? "bg-zinc-800/80 text-white shadow"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Training History
        </button>
      </div>

      {/* Tab 1: How Verra Works */}
      {activeTab === "works" && (
        <div className="space-y-8">
          {/* Timeline Navigation */}
          <div className="flex justify-between items-center bg-zinc-950 border border-zinc-900/60 p-4 rounded-xl relative overflow-hidden">
            <div className="flex items-center gap-1.5 overflow-x-auto select-none w-full justify-between px-2">
              {steps.map((step, idx) => {
                const isActive = idx === interactiveStep;
                const isPassed = idx < interactiveStep;

                return (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => setInteractiveStep(idx)}
                      className="flex flex-col items-center gap-1 cursor-pointer group outline-none"
                    >
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                        isActive 
                          ? "bg-purple-950/20 text-purple-400 border-purple-500 shadow-md shadow-purple-500/10" 
                          : isPassed 
                            ? "bg-zinc-900 text-zinc-400 border-zinc-800" 
                            : "bg-transparent text-zinc-650 border-zinc-900 group-hover:text-zinc-400 group-hover:border-zinc-800"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-[9px] font-mono tracking-wider uppercase transition-colors ${
                        isActive ? "text-purple-400 font-semibold" : "text-zinc-600 group-hover:text-zinc-400"
                      }`}>
                        {step.name}
                      </span>
                    </button>
                    {idx < 5 && (
                      <ChevronRight className={`w-3.5 h-3.5 ${
                        idx < interactiveStep ? "text-zinc-800" : "text-zinc-900"
                      } shrink-0 hidden sm:block`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Interactive Card */}
          <div className="p-8 rounded-xl border border-zinc-850 bg-zinc-900/10 min-h-[300px] flex flex-col justify-between relative overflow-hidden animate-in fade-in duration-200">
            {/* Step Content */}
            <div className="flex-1 flex flex-col justify-center">
              {interactiveStep === 0 && (
                <div className="space-y-4 max-w-lg mx-auto w-full text-center">
                  <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Step 1: Your Sentence
                  </span>
                  <div className="bg-zinc-950/80 border border-zinc-900 px-6 py-8 rounded-xl shadow-inner font-serif text-lg text-zinc-200 relative text-left min-h-[80px] flex items-center">
                    <span>
                      {typedText}
                      <span className="inline-block w-1.5 h-5 ml-1 bg-purple-500 animate-pulse align-middle" />
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-2">
                    Verra accepts a context window matching the training sequence length (up to 745 words) to predict next words.
                  </p>
                </div>
              )}

              {interactiveStep === 1 && (
                <div className="space-y-5 max-w-xl mx-auto w-full text-center">
                  <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Step 2: The Tokenizer
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center py-4">
                    {sampleTokens.map((t, idx) => (
                      <div 
                        key={idx} 
                        className="px-4 py-2 bg-zinc-950 border border-zinc-900 hover:border-purple-900/30 rounded-lg text-xs font-mono text-zinc-350 shadow-sm animate-in zoom-in-95 duration-200"
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        "{t.word}"
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Input text is split into base lowercase word tokens. Punctuation characters are preserved to align inputs with the model's vocabulary.
                  </p>
                </div>
              )}

              {interactiveStep === 2 && (
                <div className="space-y-5 max-w-xl mx-auto w-full text-center">
                  <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                    <Binary className="w-3.5 h-3.5" />
                    Step 3: Numerical Sequence
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center py-4">
                    {sampleTokens.map((t, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg flex flex-col items-center gap-1 min-w-[70px] animate-in slide-in-from-bottom-2 duration-150"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <span className="text-[10px] text-zinc-550 font-serif">"{t.word}"</span>
                        <span className="text-xs text-purple-400 font-mono font-bold">{t.token_id}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Tokens are mapped to Vocabulary IDs. Out-of-vocabulary (unknown) words are safely ignored, keeping generation stable without crashing the network.
                  </p>
                </div>
              )}

              {interactiveStep === 3 && (
                <div className="space-y-5 max-w-2xl mx-auto w-full text-center">
                  <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Step 4: Embedding Layer
                  </span>
                  
                  {/* Floating embedding grid representation */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 max-w-lg mx-auto">
                    {sampleTokens.slice(0, 3).map((t, idx) => {
                      // Deterministic mock float values for demo realism
                      const mockFloats = [
                        (Math.sin(t.token_id) * 0.9).toFixed(2),
                        (Math.cos(t.token_id * 2) * 0.8).toFixed(2),
                        (Math.sin(t.token_id * 3) * 0.75).toFixed(2),
                        (Math.cos(t.token_id * 4) * 0.95).toFixed(2)
                      ];
                      
                      return (
                        <div key={idx} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex flex-col gap-1.5 text-left animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                            <span>{t.word}</span>
                            <span className="text-purple-400 font-semibold">#{t.token_id}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[9px] text-zinc-350">
                            {mockFloats.map((v, i) => (
                              <div key={i} className="bg-zinc-900/50 px-1 py-0.5 rounded border border-zinc-900/80 text-center">
                                {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-md mx-auto">
                    The Embedding layer projects discrete token IDs into dense continuous vector spaces (64 dimensions), capturing semantic associations between words.
                  </p>
                </div>
              )}

              {interactiveStep === 4 && (
                <div className="space-y-5 max-w-xl mx-auto w-full text-center flex flex-col items-center">
                  <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Step 5: LSTM Memory Cell
                  </span>
                  
                  {/* Gate diagram block */}
                  <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-900/60 p-5 rounded-xl text-left font-mono text-[10px] text-zinc-450 space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                      <span className="text-zinc-300 font-bold uppercase text-[9px]">Active State Memory loop</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 bg-zinc-900/40 p-2.5 rounded border border-zinc-900/80">
                        <span className="text-zinc-450 block font-bold text-[8px] uppercase tracking-wider text-purple-400 mb-1">Feedback Memory Gates</span>
                        <div>Forget Gate: <span className="text-zinc-300">f_t = sigmoid(...)</span></div>
                        <div>Input Gate: <span className="text-zinc-300">i_t = sigmoid(...)</span></div>
                        <div>Output Gate: <span className="text-zinc-300">o_t = sigmoid(...)</span></div>
                      </div>
                      <div className="space-y-1 bg-zinc-900/40 p-2.5 rounded border border-zinc-900/80">
                        <span className="text-zinc-450 block font-bold text-[8px] uppercase tracking-wider text-emerald-400 mb-1">State Update Vectors</span>
                        <div>Cell State: <span className="text-zinc-300">C_t = f_t * C_t-1 + i_t * c_t</span></div>
                        <div>Hidden State: <span className="text-zinc-300">h_t = o_t * tanh(C_t)</span></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-md mt-1">
                    The recurrent Long Short-Term Memory (LSTM) layer processes embeddings sequentially. Internal gates decide what context to store in recurrent state loops ($h_t$, $C_t$) to track long-range dependencies.
                  </p>
                </div>
              )}

              {interactiveStep === 5 && (
                <div className="space-y-5 max-w-lg mx-auto w-full text-center">
                  <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    Step 6: Softmax Prediction
                  </span>
                  
                  {/* Probability Chart block */}
                  <div className="bg-zinc-950/80 border border-zinc-900 p-4 rounded-xl space-y-2 text-left w-full max-w-xs mx-auto">
                    <span className="text-[8px] text-zinc-550 block font-mono uppercase tracking-wider">Candidate Probabilities</span>
                    {sampleCandidates.map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={idx === 0 ? "text-purple-400 font-bold" : "text-zinc-400"}>
                            {idx === 0 ? `★ ${c.word}` : c.word}
                          </span>
                          <span className="text-zinc-500">{(c.probability * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? "bg-purple-500" : "bg-zinc-700"
                            }`} 
                            style={{ width: `${c.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-900 px-4 py-2 rounded-lg text-xs font-serif text-zinc-300 max-w-md mx-auto">
                    "{sampleInput} <span className="text-purple-400 font-bold underline decoration-purple-600 underline-offset-4">{predictedWord}</span>"
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Softmax yields token probabilities. Verra uses Top-k Sampling or Beam Search decoding, stopping early if a sentence ends, a word's confidence falls below $0.025$, or repetitions occur.
                  </p>
                </div>
              )}
            </div>

            {/* Stepper Controls */}
            <div className="flex justify-between items-center border-t border-zinc-900/40 pt-4 mt-6">
              <button 
                onClick={handlePrevStep}
                className="p-2 rounded-lg border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Prev Step</span>
              </button>

              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === interactiveStep ? "bg-purple-500" : "bg-zinc-800"
                    }`} 
                  />
                ))}
              </div>

              <button 
                onClick={handleNextStep}
                className="p-2 rounded-lg border border-zinc-850 hover:bg-zinc-900 text-zinc-455 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Training Performance */}
      {activeTab === "training" && (
        <div className="space-y-8">
          <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-900/15 flex flex-col sm:flex-row gap-4 items-center">
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
            <div className="flex flex-col p-4 border border-zinc-850 bg-zinc-900/10 rounded-xl">
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
            <div className="flex flex-col p-4 border border-zinc-850 bg-zinc-900/10 rounded-xl">
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
