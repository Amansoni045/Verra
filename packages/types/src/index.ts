export interface ModelStatus {
  ready: boolean;
  status: 'ready' | 'missing_weights' | 'missing_dependencies' | 'load_error';
  message: string;
}

export interface EngineConfig {
  max_sequence_length: number;
  vocab_size: number;
  framework: string;
  model_type: string;
}

export interface APIStatusResponse {
  online: boolean;
  engine: ModelStatus;
  config: EngineConfig;
}

export interface GenerationRequest {
  prompt: string;
  temperature: number;
  max_words: number;
}

export interface GenerationResponse {
  prompt: string;
  generated_text: string;
  words: string[];
  inference_time_ms: number;
}

export interface StreamEvent {
  step: 'analyzing' | 'encoding' | 'running_net' | 'predicting' | 'generating' | 'complete';
  message?: string;
  word?: string;
  index?: number;
  inference_time_ms?: number;
  error?: string;
}

export interface GenerationHistoryEntry {
  id: string;
  timestamp: string;
  prompt: string;
  generatedText: string;
  temperature: number;
  maxWords: number;
  inferenceTimeMs: number;
  isFavorite: boolean;
  isPinned: boolean;
}

export interface ShortcutKey {
  keys: string;
  description: string;
}
