export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokensPerSecond?: number;
  totalTokens?: number;
  isStreaming?: boolean;
  error?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  family: string;
  size: string;
  vramRequired: string;
  description: string;
  recommendedFor: string;
  isPopular?: boolean;
  isCustom?: boolean;
  customType?: 'gguf' | 'huggingface' | 'ollama';
  fileRef?: File;
  modelUrl?: string;
}

export interface ChatSettings {
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxGenTokens: number;
}

export type EngineStatus =
  | 'unloaded'
  | 'checking_gpu'
  | 'downloading'
  | 'ready'
  | 'generating'
  | 'error'
  | 'no_webgpu';

export interface DownloadProgress {
  text: string;
  progress: number; // 0 to 1
  step?: string;
}

export interface WebGPUInfo {
  supported: boolean;
  adapterName?: string;
  vendor?: string;
  error?: string;
}
