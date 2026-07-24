import React, { useState, useRef } from 'react';
import {
  X,
  FileCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Globe,
  Server,
  FolderOpen,
  ArrowRight,
  FileText,
  Sparkles
} from 'lucide-react';
import { ModelOption } from '../types';

interface GgufImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCustomModel: (model: ModelOption) => void;
}

export const GgufImportModal: React.FC<GgufImportModalProps> = ({
  isOpen,
  onClose,
  onImportCustomModel,
}) => {
  const [activeTab, setActiveTab] = useState<'gguf' | 'huggingface' | 'ollama'>('gguf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    isGgufValid: boolean;
    version?: number;
    tensorCount?: number;
    error?: string;
  } | null>(null);

  // Hugging Face inputs
  const [hfRepo, setHfRepo] = useState('');
  const [hfModelName, setHfModelName] = useState('');

  // Ollama state
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local GGUF file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeFormatted =
      file.size > 1024 * 1024 * 1024
        ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : `${sizeInMB} MB`;

    // Read first 12 bytes to verify GGUF magic header
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const view = new DataView(buffer);
      const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
      );

      const isGguf = magic === 'GGUF';
      let version: number | undefined = undefined;

      if (isGguf) {
        version = view.getUint32(4, true); // Little endian GGUF version
      }

      setFileDetails({
        name: file.name,
        size: sizeFormatted,
        isGgufValid: isGguf,
        version: isGguf ? version : undefined,
        error: isGguf
          ? undefined
          : `Cabeçalho "${magic}" inválido. Certifique-se de selecionar um arquivo com extensão .gguf válido.`,
      });
    } catch (err) {
      setFileDetails({
        name: file.name,
        size: sizeFormatted,
        isGgufValid: false,
        error: 'Erro ao ler cabeçalho do arquivo local.',
      });
    }
  };

  // Add Local GGUF Model
  const handleConfirmGgufImport = () => {
    if (!selectedFile || !fileDetails) return;

    const cleanName = selectedFile.name
      .replace(/\.gguf$/i, '')
      .replace(/[-_]/g, ' ');

    const newModel: ModelOption = {
      id: `local-gguf-${Date.now()}`,
      name: `[GGUF] ${cleanName}`,
      family: 'GGUF Local',
      size: fileDetails.size,
      vramRequired: 'Alocação Local GPU',
      description: `Modelo .GGUF importado do disco local: ${selectedFile.name}`,
      recommendedFor: 'Execução e testes locais de modelos customizados.',
      isCustom: true,
      customType: 'gguf',
      fileRef: selectedFile,
    };

    onImportCustomModel(newModel);
    onClose();
  };

  // Add HuggingFace MLC repo
  const handleConfirmHfImport = () => {
    if (!hfRepo.trim()) return;

    const name = hfModelName.trim() || hfRepo.split('/').pop() || 'HuggingFace Model';

    const newModel: ModelOption = {
      id: hfRepo.trim(),
      name: `[HF] ${name}`,
      family: 'Hugging Face',
      size: 'Varia',
      vramRequired: 'Configurado via WebGPU',
      description: `Repositório Hugging Face MLC: ${hfRepo}`,
      recommendedFor: 'Modelos customizados hospedados no Hugging Face MLC.',
      isCustom: true,
      customType: 'huggingface',
      modelUrl: hfRepo.trim(),
    };

    onImportCustomModel(newModel);
    onClose();
  };

  // Fetch local Ollama models
  const handleFetchOllamaModels = async () => {
    setOllamaLoading(true);
    setOllamaError(null);
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`);
      if (!res.ok) {
        throw new Error(`Servidor respondeu com status ${res.status}`);
      }
      const data = await res.json();
      const modelNames = (data.models || []).map((m: any) => m.name);
      setOllamaModels(modelNames);
      if (modelNames.length > 0) {
        setSelectedOllamaModel(modelNames[0]);
      } else {
        setOllamaError('Nenhum modelo .GGUF encontrado no Ollama local.');
      }
    } catch (err: any) {
      setOllamaError(
        `Não foi possível conectar ao Ollama em ${ollamaUrl}. Certifique-se de que o Ollama está rodando e CORS está permitido (OLLAMA_ORIGINS="*").`
      );
    } finally {
      setOllamaLoading(false);
    }
  };

  const handleConfirmOllamaImport = () => {
    if (!selectedOllamaModel) return;

    const newModel: ModelOption = {
      id: `ollama-${selectedOllamaModel}`,
      name: `[Ollama GGUF] ${selectedOllamaModel}`,
      family: 'Ollama GGUF',
      size: 'Local Ollama',
      vramRequired: 'Gerenciado pelo Ollama',
      description: `Modelo .GGUF rodando no Ollama local (${selectedOllamaModel})`,
      recommendedFor: 'Modelos .GGUF carregados via servidor Ollama.',
      isCustom: true,
      customType: 'ollama',
      modelUrl: `${ollamaUrl}/api/chat`,
    };

    onImportCustomModel(newModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5 text-zinc-100 font-bold text-base">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <span>Importar Modelo (.GGUF / Customizado)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('gguf')}
            className={`py-3 px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'gguf'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Arquivo Local (.GGUF)</span>
          </button>

          <button
            onClick={() => setActiveTab('huggingface')}
            className={`py-3 px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'huggingface'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Hugging Face MLC</span>
          </button>

          <button
            onClick={() => setActiveTab('ollama')}
            className={`py-3 px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ollama'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Servidor Ollama GGUF</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-zinc-300">
          {/* TAB 1: LOCAL GGUF FILE */}
          {activeTab === 'gguf' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Selecione um arquivo de modelo quantizado <code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded">.gguf</code> do seu computador. O aplicativo irá validar o cabeçalho GGUF e adicionar o modelo à sua lista local.
                </p>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-zinc-950/60 hover:bg-zinc-950 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gguf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-zinc-500 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" />
                <h4 className="font-semibold text-zinc-200 text-sm">
                  Clique ou arraste um arquivo .GGUF aqui
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Suporta Llama, Qwen, Phi, Mistral e Gemma quantizados em GGUF
                </p>
              </div>

              {/* Selected File Card */}
              {fileDetails && (
                <div
                  className={`p-4 rounded-xl border ${
                    fileDetails.isGgufValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {fileDetails.isGgufValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">
                        {fileDetails.name}
                      </div>
                      <div className="text-xs opacity-80 flex flex-wrap gap-2">
                        <span>Tamanho: {fileDetails.size}</span>
                        {fileDetails.version && (
                          <span>• Formato GGUF v{fileDetails.version} Validado</span>
                        )}
                      </div>
                      {fileDetails.error && (
                        <p className="text-xs text-rose-400 mt-1">
                          {fileDetails.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs text-zinc-400">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Nota sobre execução WebGPU / GGUF:</span>
                </div>
                <p>
                  O WebLLM executa kernels compilados de alta performance para WebGPU (MLC). Modelos GGUF importados são registrados para processamento com mapeamento de tensores e compatibilidade de instrução local.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmGgufImport}
                  disabled={!fileDetails?.isGgufValid}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Adicionar Modelo GGUF</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HUGGING FACE MLC REPO */}
          {activeTab === 'huggingface' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Adicione qualquer modelo formatado em MLC / WebLLM direto de um repositório do Hugging Face.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1">
                    Repositório do Hugging Face
                  </label>
                  <input
                    type="text"
                    value={hfRepo}
                    onChange={(e) => setHfRepo(e.target.value)}
                    placeholder="Ex: mlc-ai/Llama-3-8B-Instruct-q4f16_1-MLC"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1">
                    Nome de Exibição Personalizado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={hfModelName}
                    onChange={(e) => setHfModelName(e.target.value)}
                    placeholder="Ex: Meu Modelo Llama 3 8B Custom"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmHfImport}
                  disabled={!hfRepo.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Globe className="w-4 h-4" />
                  <span>Importar do Hugging Face</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: OLLAMA LOCAL GGUF */}
          {activeTab === 'ollama' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Conecte ao seu servidor local do Ollama para carregar e utilizar seus modelos .GGUF já instalados no computador.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  onClick={handleFetchOllamaModels}
                  disabled={ollamaLoading}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium text-xs border border-zinc-700 transition-colors"
                >
                  {ollamaLoading ? 'Buscando...' : 'Buscar Modelos'}
                </button>
              </div>

              {ollamaError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {ollamaError}
                </div>
              )}

              {ollamaModels.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1">
                    Selecione o Modelo .GGUF Detectado:
                  </label>
                  <select
                    value={selectedOllamaModel}
                    onChange={(e) => setSelectedOllamaModel(e.target.value)}
                    className="w-full bg-zinc-950 text-zinc-100 text-xs sm:text-sm rounded-xl px-3 py-2 border border-zinc-700 focus:outline-none"
                  >
                    {ollamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmOllamaImport}
                  disabled={!selectedOllamaModel}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Server className="w-4 h-4" />
                  <span>Conectar Modelo Ollama</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
