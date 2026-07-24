import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Shield, Cpu, RefreshCw } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isGenerating: boolean;
  isReady: boolean;
  modelName: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  isReady,
  modelName,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && isReady && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-4 pb-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-zinc-900 border border-zinc-700/80 rounded-2xl p-2.5 shadow-2xl focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReady
                ? `Digite sua mensagem para ${modelName}... (Enter para enviar)`
                : 'Carregue um modelo acima para iniciar o chat...'
            }
            disabled={!isReady && !isGenerating}
            rows={1}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-base resize-none focus:outline-none px-3 py-1.5 max-h-48 overflow-y-auto disabled:opacity-50"
          />

          <div className="flex items-center justify-between pt-2 px-2 border-t border-zinc-800/60 mt-1">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1 font-mono">
                <Shield className="w-3.5 h-3.5 text-emerald-500/80" />
                Privacidade Total
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Sem chamadas de API de terceiros</span>
            </div>

            <div>
              {isGenerating ? (
                <button
                  onClick={onStop}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium text-xs border border-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Parar</span>
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!isReady || !input.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Enviar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 text-center text-[11px] text-zinc-500">
          Processado localmente no seu navegador via WebGPU • WebLLM + MLC AI
        </div>
      </div>
    </div>
  );
};
