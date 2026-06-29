import { create } from "zustand";

type GenerationStep =
  | "idle"
  | "analyzing"
  | "encoding"
  | "running_net"
  | "predicting"
  | "generating"
  | "complete"
  | "error";

interface GenerationState {
  prompt: string;
  generatedText: string;
  currentStep: GenerationStep;
  stepMessage: string;
  isGenerating: boolean;
  inferenceTimeMs: number;
  errorMessage: string;
  setPrompt: (prompt: string) => void;
  setGeneratedText: (text: string) => void;
  resetGenerationState: () => void;
  startGeneration: () => void;
  updateStep: (step: GenerationStep, message: string) => void;
  appendWord: (word: string) => void;
  finishGeneration: (timeMs: number) => void;
  setGenerationError: (err: string) => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  prompt: "",
  generatedText: "",
  currentStep: "idle",
  stepMessage: "",
  isGenerating: false,
  inferenceTimeMs: 0,
  errorMessage: "",
  setPrompt: (prompt) => set({ prompt }),
  setGeneratedText: (generatedText) => set({ generatedText }),
  resetGenerationState: () =>
    set({
      generatedText: "",
      currentStep: "idle",
      stepMessage: "",
      isGenerating: false,
      inferenceTimeMs: 0,
      errorMessage: "",
    }),
  startGeneration: () =>
    set({
      isGenerating: true,
      generatedText: "",
      currentStep: "analyzing",
      stepMessage: "Analyzing context...",
      errorMessage: "",
    }),
  updateStep: (currentStep, stepMessage) => set({ currentStep, stepMessage }),
  appendWord: (word) =>
    set((state) => ({
      generatedText: state.generatedText
        ? state.generatedText + " " + word
        : word,
    })),
  finishGeneration: (inferenceTimeMs) =>
    set({
      isGenerating: false,
      currentStep: "complete",
      stepMessage: "Generation complete",
      inferenceTimeMs,
    }),
  setGenerationError: (errorMessage) =>
    set({
      isGenerating: false,
      currentStep: "error",
      stepMessage: "Failed to generate text",
      errorMessage,
    }),
}));
