import { APIStatusResponse, GenerationResponse, StreamEvent } from "@verra/types";
import { useAuthStore } from "@/store/authStore";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Checks the connection status and AI model readiness from the backend.
 */
export async function getModelStatus(): Promise<APIStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health/readiness`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    
    const data = await res.json();
    return {
      online: true,
      engine: {
        ready: data.data.model_engine_online,
        status: data.data.model_engine_online ? "ready" : "load_error",
        message: data.data.model_status.message,
      },
      config: {
        max_sequence_length: data.data.model_status.max_len || 745,
        vocab_size: data.data.model_status.vocab_size || 10000,
        framework: "TensorFlow/Keras",
        model_type: "LSTM",
      },
    };
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
    strategy: string = "top_k"
  ): Promise<GenerationResponse> {
    const res = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ prompt, temperature, strategy }),
    });
  
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to generate text.");
    }
  
    return data.data;
}

/**
 * Streams generated text using Server-Sent Events (SSE).
 */
export async function streamTextGeneration(
  prompt: string,
  temperature: number,
  strategy: string,
  onEvent: (event: StreamEvent) => void,
  onError: (error: string) => void,
  onComplete: () => void
): Promise<void> {
  try {
    const params = new URLSearchParams({
      prompt,
      temperature: temperature.toString(),
      strategy
    });
    
    const response = await fetch(`${API_BASE_URL}/api/generate/stream?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    
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
      
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        const cleanedLine = line.trim();
        if (cleanedLine.startsWith("data:")) {
          try {
            const dataStr = cleanedLine.slice(5).trim();
            if (dataStr) {
              const event: StreamEvent = JSON.parse(dataStr);
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

// REST Client API definitions for documents and settings
export const documentsApi = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}/api/documents`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return res.ok && data.success ? data.data : [];
  },
  create: async (doc: { id?: string; title: string; content: string; preview: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(doc)
    });
    const data = await res.json();
    return res.ok && data.success ? data.data : null;
  },
  update: async (id: string, updates: { title?: string; content?: string; preview?: string; is_favorite?: boolean; is_pinned?: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return res.ok && data.success ? data.data : null;
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return res.ok && data.success;
  },
  versions: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/documents/${id}/versions`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return res.ok && data.success ? data.data : [];
  }
};

export const settingsApi = {
  get: async () => {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    return res.ok && data.success ? data.data : null;
  },
  update: async (updates: { temperature?: number; max_words?: number; font_size?: string; editor_font?: string; focus_level?: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return res.ok && data.success ? data.data : null;
  }
};
