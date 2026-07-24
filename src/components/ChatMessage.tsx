import React, { useState } from 'react';
import { Message } from '../types';
import { Bot, User, Copy, Check, RotateCcw, Zap, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  isLastAssistant,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic formatting helper for code blocks and paragraphs
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Push preceding text
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'code',
        value: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex),
      });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden border border-zinc-700/70 bg-zinc-950 font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{part.language}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(part.value);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-zinc-200 leading-relaxed">
              <code>{part.value}</code>
            </pre>
          </div>
        );
      }

      // Inline text formatting
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed">
          {part.value}
        </div>
      );
    });
  };

  return (
    <div
      className={`py-4 px-4 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-zinc-900/40 border-y border-zinc-800/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">
              {isUser ? 'Você' : 'WebLLM Local AI'}
            </span>

            {!isUser && message.tokensPerSecond && message.tokensPerSecond > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Zap className="w-3 h-3 text-emerald-400" />
                {message.tokensPerSecond} tok/s
              </span>
            ) : null}
          </div>

          {/* Message Text */}
          <div className="text-zinc-200 text-sm sm:text-base selection:bg-emerald-500/30">
            {message.error ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{message.error}</span>
              </div>
            ) : (
              renderFormattedContent(message.content)
            )}

            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
            )}
          </div>

          {/* Message Footer / Actions */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-400">
              <button
                onClick={handleCopy}
                className="hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                title="Copiar resposta"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              {isLastAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="hover:text-zinc-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                  title="Gerar resposta novamente"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regerar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
