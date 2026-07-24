import { ModelOption } from '../types';

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B Instruct',
    family: 'Qwen',
    size: '~1.1 GB',
    vramRequired: '~1.8 GB VRAM',
    description: 'Excelente para Português, código e raciocínio estruturado. Muito equilibrado.',
    recommendedFor: 'Melhor opção para conversas em Português e tarefas gerais.',
    isPopular: true,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B Instruct',
    family: 'Meta Llama',
    size: '~880 MB',
    vramRequired: '~1.2 GB VRAM',
    description: 'Modelo compacto ultra rápido da Meta. Ideal para dispositivos móveis e testes rápidos.',
    recommendedFor: 'Respostas velozes e baixo consumo de memória.',
    isPopular: true,
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi 3.5 Mini Instruct (3.8B)',
    family: 'Microsoft Phi',
    size: '~2.3 GB',
    vramRequired: '~3.2 GB VRAM',
    description: 'Modelo de médio porte da Microsoft com alto poder analítico e de programação.',
    recommendedFor: 'Raciocínio lógico, matemática e programação complexa.',
    isPopular: true,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B Instruct',
    family: 'Hugging Face',
    size: '~1.0 GB',
    vramRequired: '~1.5 GB VRAM',
    description: 'Modelo leve treinado em dados selecionados para alta eficiência e síntese de texto.',
    recommendedFor: 'Resumos, bate-papo informal e criação de conteúdo.',
  },
  {
    id: 'Gemma-2-2b-it-q4f16_1-MLC',
    name: 'Gemma 2 2B IT',
    family: 'Google',
    size: '~1.6 GB',
    vramRequired: '~2.5 GB VRAM',
    description: 'Modelo refinado do Google com ótima fluência e compreensão de contextos diversos.',
    recommendedFor: 'Perguntas e respostas, escrita criativa e auxílio em tarefas.',
  }
];

export const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de inteligência artificial útil, cortês, preciso e fluente em Português.
Responda de forma direta e estruturada. Quando apropriado, utilize formatação em Markdown e blocos de código.
Como você está rodando 100% LOCALMENTE no navegador do usuário via WebGPU, você garante privacidade total sem enviar dados para servidores externos.`;
