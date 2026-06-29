"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring services in production
    console.error("Next.js Error Boundary caught an exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#09090B] text-[#F8FAFC]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-danger/3 blur-[140px] pointer-events-none" />

      <div className="h-16" />

      <main className="max-w-xl mx-auto px-4 text-center z-10 flex flex-col items-center gap-6 my-auto">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/10">
          <AlertTriangle className="w-10 h-10 text-danger animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-danger uppercase font-sans">
            RUNTIME EXCEPTION
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Something Went Wrong
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            An unexpected error occurred during execution. We have logged this event and are investigating. You can retry the operation or return to the dashboard.
          </p>
        </div>

        {error.message && (
          <div className="w-full max-h-32 overflow-y-auto bg-zinc-950 border border-zinc-800/80 px-4 py-3 rounded-lg font-mono text-left text-xs text-danger/80">
            <span className="font-semibold select-none">Error Log:</span> {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full pt-2">
          <Button
            onClick={reset}
            className="w-full sm:w-1/2 gap-2 text-xs font-semibold h-11 bg-primary text-white hover:bg-primary-hover active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/" className="w-full sm:w-1/2">
            <Button variant="secondary" className="w-full gap-2 text-xs font-semibold h-11 border border-zinc-800">
              <Home className="w-4 h-4" />
              Go Back Home
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-[10px] text-zinc-600 font-mono select-none">
        VERRA PLATFORM V1.0.0
      </footer>
    </div>
  );
}
