"use client";

import Link from "next/link";
import { MoveLeft, Terminal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";

export default function NotFound() {
  const { toggleCommandPalette } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#09090B] text-[#F8FAFC]">
      {/* Grid background layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Drifting gradient backdrop glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[140px] pointer-events-none" />

      {/* Header spacer */}
      <div className="h-16" />

      {/* Content wrapper */}
      <main className="max-w-xl mx-auto px-4 text-center z-10 flex flex-col items-center gap-6 my-auto">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/10">
          <AlertCircle className="w-10 h-10 text-danger animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
            ERROR CODE 404
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Lost in Translation
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            The page you are looking for does not exist, has been relocated, or is temporarily offline. Let&apos;s guide you back.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full pt-2">
          <Link href="/" className="w-full sm:w-1/2">
            <Button variant="secondary" className="w-full gap-2 text-xs font-semibold h-11 border border-zinc-800">
              <MoveLeft className="w-4 h-4" />
              Return Home
            </Button>
          </Link>
          <Button
            onClick={toggleCommandPalette}
            className="w-full sm:w-1/2 gap-2 text-xs font-semibold h-11 bg-primary text-white hover:bg-primary-hover"
          >
            <Terminal className="w-4 h-4" />
            Command Palette
          </Button>
        </div>
      </main>

      {/* Footer spacer */}
      <footer className="py-6 text-center text-[10px] text-zinc-600 font-mono select-none">
        VERRA PLATFORM V1.0.0
      </footer>
    </div>
  );
}
