import React from 'react';
import { Bot, Cpu, Download, Settings, Trash2, Zap, CheckCircle2, AlertCircle, Loader2, HardDrive, FolderOpen } from 'lucide-react';
import { ModelOption, EngineStatus, WebGPUInfo } from '../types';

interface HeaderProps {
  selectedModelId: string;
  modelOptions: ModelOption[];
  onSelectModel: (modelId: string) => void;
  status: EngineStatus;
  webGPUInfo: WebGPUInfo | null;
  downloadPercent: number;
  onLoadModel: () => void;
  onUnloadModel: () => void;
  onOpenSettings: () => void;
  onOpenGgufImport: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedModelId,
  modelOptions,
  onSelectModel,
  status,
  webGPUInfo,
  downloadPercent,
  onLoadModel,
  onUnloadModel,
  onOpenSettings,
  onOpenGgufImport,
  onClearChat,
  hasMessages,
}) => {
  const selectedModel = modelOptions.find((m) => m.id === selectedModelId) || modelOptions[0];

  const getStatusBadge = () => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Pronto /</span> Offline
          </span>
        );
      case 'downloading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            Baixando ({downloadPercent}%)
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            Gerando...
          </span>
        );
      case 'no_webgpu':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            {status === 'no_webgpu' ? 'Sem WebGPU' : 'Erro'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            Aguardando carregamento
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-zinc-100 text-sm sm:text-base leading-tight tracking-tight">
                  WebLLM Local AI
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  WebGPU
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                LLM 100% privado rodando direto na sua placa de vídeo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {getStatusBadge()}
          </div>
        </div>

        {/* Center: Model Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none min-w-[220px]">
            <select
              value={selectedModelId}
              onChange={(e) => onSelectModel(e.target.value)}
              disabled={status === 'downloading' || status === 'generating'}
              className="w-full bg-zinc-800 text-zinc-100 text-xs sm:text-sm rounded-lg px-3 py-2 pr-8 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium transition-colors disabled:opacity-50"
            >
              {modelOptions.map((model: ModelOption) => (
                <option key={model.id} value={model.id} className="bg-zinc-900 text-zinc-200">
                  {model.name} ({model.size})
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          {/* Import .GGUF Button */}
          <button
            onClick={onOpenGgufImport}
            disabled={status === 'downloading' || status === 'generating'}
            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Importar modelo .GGUF ou personalizado"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Importar .GGUF</span>
          </button>

          {status === 'ready' ? (
            <button
              onClick={onUnloadModel}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
              title="Descarregar modelo da memória GPU"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Descarregar</span>
            </button>
          ) : (
            <button
              onClick={onLoadModel}
              disabled={status === 'downloading' || status === 'no_webgpu'}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'downloading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Baixando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Carregar Modelo</span>
                </>
              )}
            </button>
          )}

          <div className="hidden md:block">
            {getStatusBadge()}
          </div>
        </div>

        {/* Right: Actions (Settings, Clear Chat) */}
        <div className="flex items-center justify-end gap-1.5">
          {hasMessages && (
            <button
              onClick={onClearChat}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
              title="Limpar histórico do chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1.5"
            title="Configurações Avançadas"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Configurar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
