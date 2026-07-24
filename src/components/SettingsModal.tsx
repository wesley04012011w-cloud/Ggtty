import React from 'react';
import { X, Sliders, RefreshCcw, Cpu, Info, ShieldCheck, HardDrive } from 'lucide-react';
import { ChatSettings, WebGPUInfo } from '../types';
import { DEFAULT_SYSTEM_PROMPT } from '../data/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onUpdateSettings: (newSettings: ChatSettings) => void;
  webGPUInfo: WebGPUInfo | null;
  loadedModelName: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  webGPUInfo,
  loadedModelName,
}) => {
  if (!isOpen) return null;

  const handleResetSystemPrompt = () => {
    onUpdateSettings({
      ...settings,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-base">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Configurações Avançadas da IA</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 text-sm text-zinc-300">
          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-200 text-xs sm:text-sm">
                System Prompt (Instrução do Sistema)
              </label>
              <button
                onClick={handleResetSystemPrompt}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                Restaurar Padrão
              </button>
            </div>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) =>
                onUpdateSettings({ ...settings, systemPrompt: e.target.value })
              }
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="Digite a instrução base para o comportamento da IA..."
            />
            <p className="text-[11px] text-zinc-500">
              Define a personalidade, regras de resposta e o contexto inicial da IA.
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-200 text-xs sm:text-sm">
                Temperatura (Criatividade):{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {settings.temperature.toFixed(2)}
                </span>
              </label>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.temperature}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer bg-zinc-800 h-2 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0.0 (Mais preciso / Factual)</span>
              <span>1.0 (Mais criativo / Diverso)</span>
            </div>
          </div>

          {/* Top_P Slider */}
          <div className="space-y-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-200 text-xs sm:text-sm">
                Top_P (Nucleus Sampling):{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {settings.topP.toFixed(2)}
                </span>
              </label>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={settings.topP}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  topP: parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer bg-zinc-800 h-2 rounded-lg"
            />
            <p className="text-[11px] text-zinc-500">
              Ajusta o escopo de amostragem de palavras prováveis durante a geração.
            </p>
          </div>

          {/* Max Tokens Slider */}
          <div className="space-y-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-200 text-xs sm:text-sm">
                Máximo de Tokens por Resposta:{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {settings.maxGenTokens}
                </span>
              </label>
            </div>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={settings.maxGenTokens}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  maxGenTokens: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer bg-zinc-800 h-2 rounded-lg"
            />
          </div>

          {/* Hardware & Diagnostic Info */}
          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Status do Dispositivo WebGPU</span>
            </div>
            <div className="space-y-1 text-zinc-400 font-mono text-[11px]">
              <div>
                Placa de Vídeo:{' '}
                <span className="text-zinc-200">{webGPUInfo?.adapterName || 'Detectando...'}</span>
              </div>
              <div>
                Fabricante:{' '}
                <span className="text-zinc-200">{webGPUInfo?.vendor || 'WebGPU API'}</span>
              </div>
              <div>
                Modelo em Execução:{' '}
                <span className="text-emerald-400">{loadedModelName || 'Nenhum'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end bg-zinc-900 sticky bottom-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all"
          >
            Salvar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
