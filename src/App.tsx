import React, { useState, useEffect, useRef } from 'react';
import {
  Message,
  EngineStatus,
  DownloadProgress,
  ChatSettings,
  WebGPUInfo,
  ModelOption,
} from './types';
import { MODEL_OPTIONS, DEFAULT_SYSTEM_PROMPT } from './data/models';
import {
  checkWebGPU,
  loadModel,
  generateStreamResponse,
  interruptGeneration,
  unloadModel,
  getCurrentLoadedModelId,
} from './services/webllmService';

import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { GgufImportModal } from './components/GgufImportModal';
import { WebGPUWarning } from './components/WebGPUWarning';

import {
  Bot,
  Sparkles,
  ShieldCheck,
  Zap,
  Code,
  BookOpen,
  MessageSquare,
  Cpu,
  Trash2,
  Download,
  FolderOpen,
} from 'lucide-react';

export default function App() {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(MODEL_OPTIONS);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    MODEL_OPTIONS[0].id
  );
  const [status, setStatus] = useState<EngineStatus>('checking_gpu');
  const [webGPUInfo, setWebGPUInfo] = useState<WebGPUInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    text: '',
    progress: 0,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const [settings, setSettings] = useState<ChatSettings>({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    topP: 0.95,
    maxGenTokens: 1024,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGgufModalOpen, setIsGgufModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Check WebGPU on mount
  useEffect(() => {
    async function initWebGPUCheck() {
      setStatus('checking_gpu');
      const info = await checkWebGPU();
      setWebGPUInfo(info);
      if (info.supported) {
        setStatus('unloaded');
      } else {
        setStatus('no_webgpu');
      }
    }
    initWebGPUCheck();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, downloadProgress]);

  // Handle importing custom model
  const handleImportCustomModel = (newModel: ModelOption) => {
    setModelOptions((prev) => [newModel, ...prev]);
    setSelectedModelId(newModel.id);
    if (status === 'ready') {
      setStatus('unloaded');
    }
  };

  // Load selected model
  const handleLoadModel = async () => {
    if (status === 'downloading' || status === 'no_webgpu') return;

    setStatus('downloading');
    setDownloadProgress({
      text: 'Inicializando motor de IA...',
      progress: 0.05,
    });

    try {
      const selectedModel =
        modelOptions.find((m) => m.id === selectedModelId) || modelOptions[0];

      await loadModel(selectedModel.id, (p) => {
        setDownloadProgress(p);
      });

      setStatus('ready');
    } catch (err: any) {
      console.error('Erro ao carregar modelo:', err);
      setStatus('error');
    }
  };

  // Unload model
  const handleUnloadModel = async () => {
    await unloadModel();
    setStatus('unloaded');
  };

  // Send message
  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || status !== 'ready') return;

    if (!customPrompt) {
      setInput('');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const updatedMessages = [...messages, userMsg, initialAssistantMsg];
    setMessages(updatedMessages);
    setStatus('generating');

    // Prepare context for WebLLM
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const selectedModel =
      modelOptions.find((m) => m.id === selectedModelId) || modelOptions[0];

    generateStreamResponse(
      apiMessages,
      settings,
      (partialText, stats) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: partialText,
                  tokensPerSecond: stats.tokensPerSecond,
                  totalTokens: stats.totalTokens,
                }
              : msg
          )
        );
      },
      (fullText, stats) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: fullText,
                  tokensPerSecond: stats.tokensPerSecond,
                  totalTokens: stats.totalTokens,
                  isStreaming: false,
                }
              : msg
          )
        );
        setStatus('ready');
      },
      (error) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  error: error.message || 'Erro ao gerar resposta.',
                  isStreaming: false,
                }
              : msg
          )
        );
        setStatus('ready');
      }
    );
  };

  // Stop generation
  const handleStop = async () => {
    await interruptGeneration();
    setStatus('ready');
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
  };

  // Export Chat
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const text = messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? 'Você' : 'WebLLM Local AI'}\n${m.content}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-webllm-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedModel =
    modelOptions.find((m) => m.id === selectedModelId) || modelOptions[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <Header
        selectedModelId={selectedModelId}
        modelOptions={modelOptions}
        onSelectModel={(id) => {
          setSelectedModelId(id);
          if (status === 'ready') {
            setStatus('unloaded');
          }
        }}
        status={status}
        webGPUInfo={webGPUInfo}
        downloadPercent={Math.round((downloadProgress.progress || 0) * 100)}
        onLoadModel={handleLoadModel}
        onUnloadModel={handleUnloadModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGgufImport={() => setIsGgufModalOpen(true)}
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto px-4 py-2 relative">
        {/* WebGPU Unsupported Alert */}
        {status === 'no_webgpu' && (
          <WebGPUWarning
            webGPUInfo={webGPUInfo}
            onRetry={async () => {
              const info = await checkWebGPU();
              setWebGPUInfo(info);
              setStatus(info.supported ? 'unloaded' : 'no_webgpu');
            }}
          />
        )}

        {/* Download Progress Bar */}
        {status === 'downloading' && (
          <ProgressBar
            progress={downloadProgress}
            modelName={selectedModel.name}
          />
        )}

        {/* Chat History or Starter Prompts */}
        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto my-8 space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
                <Bot className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
                  Modelo de Linguagem Local no Seu Navegador
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-lg mx-auto">
                  Sem enviar dados para a nuvem. Processamento direto na memória
                  da sua placa de vídeo via WebGPU.
                </p>
              </div>

              {status === 'unloaded' && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Modelo Selecionado: {selectedModel.name}</span>
                    </div>
                    {selectedModel.isCustom && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Customizado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300">
                    {selectedModel.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400 pt-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                      Tamanho: {selectedModel.size}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                      Requer: {selectedModel.vramRequired}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleLoadModel}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Carregar Modelo na GPU</span>
                    </button>
                    <button
                      onClick={() => setIsGgufModalOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold text-xs border border-emerald-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="hidden sm:inline">Importar .GGUF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Starter Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                <button
                  onClick={() =>
                    handleSend(
                      'Explique a diferença entre aprendizado de máquina local e na nuvem de forma simples.'
                    )
                  }
                  disabled={status !== 'ready'}
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/40 text-xs transition-all space-y-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-semibold text-zinc-200 group-hover:text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Conceitos de IA</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-2">
                    "Explique a diferença entre aprendizado de máquina local e
                    na nuvem..."
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSend(
                      'Escreva um script em Python para ler um arquivo JSON, filtrar os registros ativos e salvar o resultado.'
                    )
                  }
                  disabled={status !== 'ready'}
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-emerald-500/40 text-xs transition-all space-y-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-semibold text-zinc-200 group-hover:text-emerald-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    <span>Programação Python</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-2">
                    "Escreva um script em Python para ler um arquivo JSON e
                    filtrar registros..."
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-end px-4 mb-2">
                <button
                  onClick={handleExportChat}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar conversa (.md)</span>
                </button>
              </div>

              {messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLastAssistant={
                    index === messages.length - 1 && msg.role === 'assistant'
                  }
                  onRegenerate={() => {
                    const lastUserMsg = [...messages]
                      .reverse()
                      .find((m) => m.role === 'user');
                    if (lastUserMsg) {
                      handleSend(lastUserMsg.content);
                    }
                  }}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSend()}
          onStop={handleStop}
          isGenerating={status === 'generating'}
          isReady={status === 'ready'}
          modelName={selectedModel.name}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        webGPUInfo={webGPUInfo}
        loadedModelName={
          status === 'ready' || status === 'generating'
            ? selectedModel.name
            : null
        }
      />

      {/* GGUF Import Modal */}
      <GgufImportModal
        isOpen={isGgufModalOpen}
        onClose={() => setIsGgufModalOpen(false)}
        onImportCustomModel={handleImportCustomModel}
      />
    </div>
  );
}
