import * as webllm from '@mlc-ai/web-llm';
import { WebGPUInfo, DownloadProgress, ChatSettings } from '../types';

let engine: webllm.MLCEngineInterface | null = null;
let currentLoadedModelId: string | null = null;
let isInterrupted = false;

/**
 * Checks whether WebGPU is supported and accessible in the current browser context.
 */
export async function checkWebGPU(): Promise<WebGPUInfo> {
  if (!navigator || !('gpu' in navigator)) {
    return {
      supported: false,
      error: 'WebGPU não está ativado ou não é suportado neste navegador. Utilize Google Chrome ou Edge (v113+).'
    };
  }

  try {
    const gpu = (navigator as any).gpu;
    if (!gpu) {
      return {
        supported: false,
        error: 'WebGPU não está ativado ou não é suportado neste navegador. Utilize Google Chrome ou Edge (v113+).'
      };
    }

    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        error: 'Nenhum adaptador de GPU compatível foi encontrado. Verifique a aceleração de hardware nas configurações do seu navegador.'
      };
    }

    let adapterName = 'GPU Compatível';
    let vendor = 'Desconhecido';

    if ('requestAdapterInfo' in adapter && typeof (adapter as any).requestAdapterInfo === 'function') {
      try {
        const info = await (adapter as any).requestAdapterInfo();
        if (info.device || info.description) {
          adapterName = info.device || info.description;
        }
        if (info.vendor) {
          vendor = info.vendor;
        }
      } catch {
        // Fallback gracefully if info fails
      }
    }

    return {
      supported: true,
      adapterName,
      vendor
    };
  } catch (err: any) {
    return {
      supported: false,
      error: err?.message || 'Erro ao inicializar o dispositivo WebGPU.'
    };
  }
}

/**
 * Loads a specified MLC model into GPU memory via WebLLM.
 */
export async function loadModel(
  modelId: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<boolean> {
  if (engine && currentLoadedModelId === modelId) {
    onProgress({ text: 'Modelo já carregado na memória GPU.', progress: 1.0 });
    return true;
  }

  // Unload previous model if any
  if (engine) {
    try {
      await engine.unload();
    } catch (e) {
      console.warn('Erro ao descarregar modelo anterior:', e);
    }
    engine = null;
    currentLoadedModelId = null;
  }

  try {
    const initProgressCallback = (p: webllm.InitProgressReport) => {
      onProgress({
        text: p.text,
        progress: p.progress,
      });
    };

    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback,
      logLevel: 'WARN',
    });

    currentLoadedModelId = modelId;
    return true;
  } catch (error: any) {
    console.error('Falha ao carregar modelo no WebLLM:', error);
    engine = null;
    currentLoadedModelId = null;
    throw error;
  }
}

/**
 * Returns the currently loaded model ID.
 */
export function getCurrentLoadedModelId(): string | null {
  return currentLoadedModelId;
}

/**
 * Generates a streaming response using the loaded WebLLM engine.
 */
export async function generateStreamResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  settings: ChatSettings,
  onChunk: (text: string, stats: { tokensPerSecond: number; totalTokens: number }) => void,
  onFinish: (fullText: string, stats: { tokensPerSecond: number; totalTokens: number }) => void,
  onError: (err: Error) => void
): Promise<void> {
  if (!engine) {
    onError(new Error('Nenhum modelo carregado na GPU. Selecione um modelo e clique em "Carregar Modelo".'));
    return;
  }

  isInterrupted = false;

  const fullMessages = [
    { role: 'system' as const, content: settings.systemPrompt },
    ...messages
  ];

  let accumulatedText = '';
  let totalTokenCount = 0;
  const startTime = Date.now();

  try {
    const completionStream = await engine.chat.completions.create({
      messages: fullMessages,
      temperature: settings.temperature,
      top_p: settings.topP,
      max_tokens: settings.maxGenTokens,
      stream: true,
      stream_options: { include_usage: true }
    });

    for await (const chunk of completionStream) {
      if (isInterrupted) {
        break;
      }

      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        accumulatedText += delta;
      }

      if (chunk.usage?.completion_tokens) {
        totalTokenCount = chunk.usage.completion_tokens;
      } else if (delta) {
        // Approximate token count if usage not given in chunk
        totalTokenCount += delta.length > 3 ? Math.ceil(delta.length / 3.5) : 1;
      }

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const tokPerSec = elapsedSeconds > 0 ? parseFloat((totalTokenCount / elapsedSeconds).toFixed(1)) : 0;

      onChunk(accumulatedText, {
        tokensPerSecond: tokPerSec,
        totalTokens: totalTokenCount
      });
    }

    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const finalTokPerSec = elapsedSeconds > 0 ? parseFloat((totalTokenCount / elapsedSeconds).toFixed(1)) : 0;

    onFinish(accumulatedText, {
      tokensPerSecond: finalTokPerSec,
      totalTokens: totalTokenCount
    });
  } catch (error: any) {
    if (isInterrupted) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const finalTokPerSec = elapsedSeconds > 0 ? parseFloat((totalTokenCount / elapsedSeconds).toFixed(1)) : 0;
      onFinish(accumulatedText, {
        tokensPerSecond: finalTokPerSec,
        totalTokens: totalTokenCount
      });
    } else {
      console.error('Erro durante geração de resposta:', error);
      onError(error instanceof Error ? error : new Error('Erro desconhecido na geração do WebLLM.'));
    }
  }
}

/**
 * Interrupts current streaming generation.
 */
export async function interruptGeneration(): Promise<void> {
  isInterrupted = true;
  if (engine) {
    try {
      await engine.interruptGenerate();
    } catch (e) {
      console.warn('Erro ao interromper geração:', e);
    }
  }
}

/**
 * Unloads the current model from GPU memory.
 */
export async function unloadModel(): Promise<void> {
  if (engine) {
    try {
      await engine.unload();
    } catch (e) {
      console.warn('Erro ao descarregar modelo:', e);
    }
    engine = null;
    currentLoadedModelId = null;
  }
}
