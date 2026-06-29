import { MetricsCharts } from "@/components/charts/MetricsCharts";
import { Sparkles, BarChart2, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export default function InsightsPage() {
  const stats = [
    { label: "Vocabulary Size", value: "8,978 words", desc: "Unique words captured from the corpus dataset." },
    { label: "Optimal Sequence", value: "745 tokens", desc: "Maximum sequence padding length for RNN sequences." },
    { label: "Training Split", value: "90% / 10%", desc: "Ratio of training samples to validation checks." },
    { label: "Model Convergence", value: "Epoch 4", desc: "The epoch where LSTM validation loss stabilized." }
  ];

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      
      {/* Title Header */}
      <div className="space-y-3 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          INSIGHTS & METRICS
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Model Performance & Training Logs
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed font-sans">
          Review the authentic convergence logs, accuracy trends, and loss histories recorded during model training.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-card-border bg-card/60 glass-panel text-left font-sans"
          >
            <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider">{stat.label}</span>
            <span className="text-lg font-bold text-white block mt-1">{stat.value}</span>
            <span className="text-[10px] text-zinc-500 block mt-1 leading-normal">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* Line Charts dashboard */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2 border-b border-zinc-900 pb-3">
          <BarChart2 className="w-4 h-4 text-primary" />
          Convergence Curves
        </h2>
        
        <MetricsCharts />
      </div>

      {/* Historical Logs Explanations */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2 border-b border-zinc-900 pb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          Training Context & Hypotheses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
          
          <div className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-xl space-y-3 leading-relaxed">
            <span className="font-bold text-white text-xs block">Simple RNN Analysis</span>
            <p className="text-zinc-400">
              The Simple RNN baseline was trained for 10 epochs. It showed extremely rapid training times (~45s per epoch) but accuracy plateaud quickly at ~14.9%.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 font-medium italic mt-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Prone to vanishings.</span>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-xl space-y-3 leading-relaxed">
            <span className="font-bold text-white text-xs block">LSTM Analysis (Active)</span>
            <p className="text-zinc-400">
              The standard LSTM model was configured for 100 epochs with Early Stopping monitored on validation loss. Best weights were restored from Epoch 4 (validation loss: 6.3166), achieving ~26.4% training accuracy.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 font-medium italic mt-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Restored from Epoch 4.</span>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-850 p-5 rounded-xl space-y-3 leading-relaxed">
            <span className="font-bold text-white text-xs block">Stacked LSTM Analysis</span>
            <p className="text-zinc-400">
              Stacked LSTM layers increase parameter capacity but suffer from slow compilation. Training was manually interrupted at Epoch 2 (~144s per epoch) due to local computation limitations.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 font-medium italic mt-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <span>Interrupted at Epoch 2.</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
