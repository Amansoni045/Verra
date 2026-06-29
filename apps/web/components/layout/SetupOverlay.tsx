"use client";

import * as React from "react";
import { AlertCircle, FileWarning, HelpCircle, RefreshCw, Terminal, Download, Folder } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ModelStatus } from "@verra/types";

interface SetupOverlayProps {
  status: ModelStatus | null;
  onCheckStatus: () => void;
}

export function SetupOverlay({ status, onCheckStatus }: SetupOverlayProps) {
  const [checking, setChecking] = React.useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await onCheckStatus();
    // Keep spin active for a short period for visual confirmation
    setTimeout(() => setChecking(false), 600);
  };

  const getStatusDetails = () => {
    if (!status) {
      return {
        title: "Initializing Model Engine...",
        description: "Checking backend server connection and verifying trained neural weights.",
        icon: <RefreshCw className="w-10 h-10 text-primary animate-spin" />,
      };
    }

    switch (status.status) {
      case "missing_dependencies":
        return {
          title: "Python Dependencies Missing",
          description: "The backend server is online, but required machine learning dependencies (TensorFlow or Keras) are not installed in the environment.",
          icon: <AlertCircle className="w-10 h-10 text-danger animate-pulse" />,
          solution: (
            <div className="space-y-4">
              <p className="text-zinc-400">
                To run next-word neural network inference, the FastAPI app requires the installation of core ML dependencies. Run the following command inside your environment:
              </p>
              <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800/80 px-4 py-3 rounded-lg font-mono text-xs text-zinc-300">
                <span>pip install -r apps/api/requirements.txt</span>
              </div>
            </div>
          )
        };
      case "missing_weights":
      default:
        return {
          title: "Neural Model Weights Missing",
          description: "Verra requires your trained LSTM weights file to perform next-word predictions.",
          icon: <FileWarning className="w-10 h-10 text-warning" />,
          solution: (
            <div className="space-y-4">
              <p className="text-zinc-400">
                Place the trained model file inside the backend model directory. Verra will automatically detect the weights and initialize the neural engine.
              </p>
              
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase font-sans">Target Location</span>
                <div className="flex items-center gap-2.5 bg-zinc-950/80 border border-zinc-800/80 px-4 py-3 rounded-lg font-mono text-xs text-zinc-300">
                  <Folder className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">apps/api/app/models/lstm_model.h5</span>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-3.5 space-y-2 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-sans">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  Where do I get the model?
                </span>
                <p className="text-zinc-400 leading-relaxed font-sans">
                  If you trained your model in Google Colab, download <strong>lstm_model.h5</strong> from your notebook directory and drop it in the folder path specified above.
                </p>
              </div>
            </div>
          )
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#09090B]/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden border border-card-border bg-card rounded-xl p-6 md:p-8 shadow-2xl glass-panel text-center md:text-left flex flex-col gap-6"
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0">
            {details.icon}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">{details.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">{details.description}</p>
          </div>
        </div>

        {details.solution}

        <div className="pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-sans">
            <Terminal className="w-3.5 h-3.5 text-zinc-600" />
            <span>Verra Model Engine Status: Offline</span>
          </div>
          <Button
            onClick={handleRefresh}
            loading={checking}
            className="w-full sm:w-auto gap-2 text-xs font-semibold px-5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            Check Connection
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
