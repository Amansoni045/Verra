"use client";

import * as React from "react";
import { motion } from "framer-motion";

export function SplashLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090B] overflow-hidden">
      {/* Drifting gradient backdrop glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      
      <div className="flex flex-col items-center gap-6">
        {/* Glowing wave logo */}
        <motion.div
          animate={{
            scale: [0.96, 1.04, 0.96],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 border border-primary/20 shadow-lg shadow-primary/5"
        >
          <svg
            className="w-8 h-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 10s3-2 3 0 2 6 4 6 3-10 5-10 2 6 4 6 4-2 4-2" />
          </svg>
        </motion.div>

        {/* Brand name and description */}
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold tracking-widest text-white font-sans">
            VERRA
          </h1>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide font-sans select-none">
            INITIALIZING NEURAL ENGINE
          </p>
        </div>

        {/* Breathing dot loader */}
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
