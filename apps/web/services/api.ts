import { APIStatusResponse, GenerationResponse, StreamEvent } from "@verra/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Checks the connection status and AI model readiness from the backend.
 */
export async function getModelStatus(): Promise<APIStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    return {
      online: false,
      engine: {
        ready: false,
        status: "load_error",
        message: `Unable to connect to the Verra API server: ${error instanceof Error ? error.message : "Connection refused"}`,
      },
      config: {
        max_sequence_length: 745,
        vocab_size: 0,
        framework: "TensorFlow/Keras",
        model_type: "LSTM",
      },
    };
  }
}

/**
 * Generates text synchronously (REST endpoint).
 */
export async function generateTextSync(
  prompt: string,
  temperature: number,
  maxWords: number
): Promise<GenerationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ prompt, temperature, max_words: maxWords }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to generate text.");
  }

  return await res.json();
}

/**
 * Streams generated text using Server-Sent Events (SSE) and executes callbacks on each word/step.
 */
export async function streamTextGeneration(
  prompt: string,
  temperature: number,
  maxWords: number,
  onEvent: (event: StreamEvent) => void,
  onError: (error: string) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const params = new URLSearchParams({
      prompt,
      temperature: temperature.toString(),
      max_words: maxWords.toString(),
    });
    
    const response = await fetch(`${API_BASE_URL}/api/generate/stream?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error("Unable to establish text stream.");
    }
    
    if (!response.body) {
      throw new Error("Stream response body is empty.");
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        const cleanedLine = line.trim();
        if (cleanedLine.startsWith("data:")) {
          try {
            const dataStr = cleanedLine.slice(5).trim();
            if (dataStr) {
              const event: StreamEvent = jsonParseSSE(dataStr);
              if (event.error) {
                onError(event.error);
                return;
              }
              onEvent(event);
            }
          } catch (e) {
            console.error("Error parsing SSE stream line:", e, cleanedLine);
          }
        }
      }
    }
    
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error.message : "An unexpected stream error occurred.");
  }
}

// Utility to parse single-line or multi-line JSON structures from SSE safely
function jsonParseSSE(str: string): any {
  // Try directly parsing the JSON
  try {
    return JSON.parse(str);
  } catch (e) {
    // If it fails, check if the string was truncated or had syntax anomalies
    // In our FastAPI implementation it is standard, so it should parse directly.
    throw e;
  }
}
