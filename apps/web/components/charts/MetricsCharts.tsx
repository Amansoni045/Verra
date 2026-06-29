"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { AUTHENTIC_EPOCH_DATA } from "@/data/historyData";

export function MetricsCharts() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px] select-none">
        <div className="h-72 rounded-xl bg-zinc-900/40 border border-card-border/60 animate-pulse" />
        <div className="h-72 rounded-xl bg-zinc-900/40 border border-card-border/60 animate-pulse" />
      </div>
    );
  }

  // Theme-aware style helpers
  const rnnColor = "#3B82F6"; // blue
  const lstmColor = "#5B5FEF"; // indigo
  const stackedColor = "#10B981"; // emerald

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg shadow-xl font-mono text-[10px] space-y-1">
          <p className="font-bold text-zinc-400 border-b border-zinc-900 pb-1 mb-1">Epoch {label}</p>
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex justify-between gap-4">
              <span style={{ color: item.color }}>{item.name}:</span>
              <span className="font-bold text-zinc-100">{item.value.toFixed(4)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Accuracy Chart */}
      <div className="border border-card-border bg-card p-5 rounded-xl flex flex-col justify-between glass-panel select-none">
        <div className="mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide font-sans">
            Metrics
          </span>
          <h3 className="text-sm font-bold text-white font-sans">Accuracy Convergence</h3>
        </div>
        
        <div className="h-72 w-full text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={AUTHENTIC_EPOCH_DATA}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="epoch" stroke="#52525b" />
              <YAxis stroke="#52525b" domain={[0, 0.3]} ticks={[0, 0.1, 0.2, 0.3]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              <Line
                type="monotone"
                dataKey="rnnAcc"
                name="RNN Train"
                stroke={rnnColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="lstmAcc"
                name="LSTM Train"
                stroke={lstmColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="stackedAcc"
                name="Stacked Train"
                stroke={stackedColor}
                strokeWidth={2}
                connectNulls
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loss Chart */}
      <div className="border border-card-border bg-card p-5 rounded-xl flex flex-col justify-between glass-panel select-none">
        <div className="mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide font-sans">
            Loss
          </span>
          <h3 className="text-sm font-bold text-white font-sans">Loss Reduction</h3>
        </div>

        <div className="h-72 w-full text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={AUTHENTIC_EPOCH_DATA}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="epoch" stroke="#52525b" />
              <YAxis stroke="#52525b" domain={[3.0, 7.5]} ticks={[3.0, 4.0, 5.0, 6.0, 7.0]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" />

              <Line
                type="monotone"
                dataKey="rnnLoss"
                name="RNN Loss"
                stroke={rnnColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="lstmLoss"
                name="LSTM Loss"
                stroke={lstmColor}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="stackedLoss"
                name="Stacked Loss"
                stroke={stackedColor}
                strokeWidth={2}
                connectNulls
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
