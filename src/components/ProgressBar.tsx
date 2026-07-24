import React from 'react';
import { DownloadProgress } from '../types';
import { Download, Cpu, ShieldCheck } from 'lucide-react';

interface ProgressBarProps {
  progress: DownloadProgress;
  modelName: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, modelName }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((progress.progress || 0) * 100)));

  return (
    <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-4 shadow-xl max-w-2xl mx-auto my-4 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Download className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Carregando {modelName}
            </h3>
            <p className="text-xs text-zinc-400 truncate max-w-md">
              {progress.text || 'Inicializando download dos pesos MLC...'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-700/50">
        <div
          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm shadow-emerald-500/50"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
        <span className="flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          Os arquivos ficam salvos no Cache do seu Navegador (IndexedDB).
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          100% Local
        </span>
      </div>
    </div>
  );
};
