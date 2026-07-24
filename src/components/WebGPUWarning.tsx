import React from 'react';
import { AlertTriangle, Cpu, ExternalLink, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { WebGPUInfo } from '../types';

interface WebGPUWarningProps {
  webGPUInfo: WebGPUInfo | null;
  onRetry: () => void;
}

export const WebGPUWarning: React.FC<WebGPUWarningProps> = ({ webGPUInfo, onRetry }) => {
  return (
    <div className="max-w-3xl mx-auto my-6 p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-3 flex-1">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Suporte a WebGPU Não Detectado
            </h3>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {webGPUInfo?.error ||
                'A API WebGPU é necessária para compilar e rodar modelos de Inteligência Artificial diretamente na sua placa de vídeo (GPU) sem servidores.'}
            </p>
          </div>

          <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800 text-xs space-y-2 text-zinc-300">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              Como ativar a WebGPU no seu navegador:
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Google Chrome / Edge (v113+):</strong> Verifique se o navegador está atualizado.
              </li>
              <li>
                <strong className="text-zinc-200">Aceleração de Hardware:</strong> Ative a opção <em>"Usar aceleração de hardware quando disponível"</em> nas configurações do navegador.
              </li>
              <li>
                <strong className="text-zinc-200">Flags do Chrome:</strong> Acesse <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-300">chrome://flags/#enable-unsafe-webgpu</code> e marque como <em>Enabled</em>.
              </li>
              <li>
                <strong className="text-zinc-200">Abra em Nova Aba:</strong> Às vezes a pré-visualização em iframe pode restringir o acesso à GPU.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Cpu className="w-4 h-4" />
              Verificar novamente
            </button>

            <a
              href="https://webgpu.github.io/webgpu-samples/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <span>Testar WebGPU Samples</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
