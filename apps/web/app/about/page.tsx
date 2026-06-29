import { Cpu, Heart, CheckCircle2, Award, Zap, HelpCircle } from "lucide-react";
import { MetricsCharts } from "@/components/charts/MetricsCharts";

export default function AboutPage() {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      
      {/* Header */}
      <div className="space-y-3 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          BACKGROUND
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          About Verra
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed font-sans">
          Verra is a calm, distraction-free writing environment built around recurrent neural networks. It focuses entirely on helpfully continuing your thoughts.
        </p>
      </div>

      {/* Core philosophy section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-900 pt-8 font-sans text-sm">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">The Philosophy of Flow</h2>
          <p className="text-zinc-400 leading-relaxed">
            Modern creative tools are often bloated with widgets, sidebars, and unnecessary configurations. Verra is designed to disappear. When you write, the canvas remains clean.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Instead of full-sentence instructions or noisy chat prompts, Verra uses context-aware next-word predictions. You write, click continue, and let the model naturally extend your syntax.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-card-border bg-card/40 flex flex-col justify-between glass-panel">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-primary tracking-wide uppercase">Core Architecture</span>
            <h3 className="text-xs font-bold text-white">How next-word prediction works</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Verra processes input sequences by mapping them to dense 50-dimensional vectors, passes them through a 256-unit Long Short-Term Memory (LSTM) layer, and projects the outcome through a softmax distribution over an 8,978-word vocabulary.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-4 pt-3 border-t border-zinc-800/40">
            <Cpu className="w-3.5 h-3.5" />
            <span>Vocabulary: 8,978 | Padding: 745</span>
          </div>
        </div>
      </div>

      {/* LSTM vs RNN comparison */}
      <div className="space-y-6 border-t border-zinc-900 pt-8 font-sans">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          Why use an LSTM instead of a Simple RNN?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-5 rounded-xl border border-card-border bg-card/60 glass-panel space-y-2 text-left">
            <span className="font-bold text-white text-xs block">Simple RNN (Recurrent Neural Network)</span>
            <p className="text-zinc-400 leading-relaxed">
              Simple RNNs pass hidden state information step-by-step. However, because they multiply matrices repeatedly, gradients vanish or explode during training, causing the network to forget words from earlier in the sentence.
            </p>
            <div className="pt-2 border-t border-zinc-800/40 text-[10px] text-danger font-semibold">
              Result: Repetitive loops and poor grammar coherence.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-card-border bg-card/60 glass-panel space-y-2 text-left">
            <span className="font-bold text-white text-xs block">LSTM (Long Short-Term Memory)</span>
            <p className="text-zinc-400 leading-relaxed">
              LSTMs introduce specialized &ldquo;cell gates&rdquo; (Input, Forget, Output) that regulate information flow. This allows gradients to flow uninterrupted over longer sequences, ensuring the model remembers initial contexts and punctuation rules.
            </p>
            <div className="pt-2 border-t border-zinc-800/40 text-[10px] text-success font-semibold">
              Result: Stable sentence structure and context retention.
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Convergence Logs */}
      <div className="space-y-6 border-t border-zinc-900 pt-8">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white font-sans tracking-tight">
            Training Convergence Insights
          </h2>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Real epoch metrics showing the convergence speeds, training loss reductions, and accuracy plateaus.
          </p>
        </div>

        <MetricsCharts />
      </div>

      {/* Credits / Footer */}
      <div className="border-t border-zinc-900 pt-8 flex justify-between items-center text-[10px] text-zinc-600 font-sans select-none">
        <span>VERRA PLATFORM V1.0.0</span>
        <span className="flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-danger animate-pulse" /> for writing flow
        </span>
      </div>

    </div>
  );
}
