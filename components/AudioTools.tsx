import React, { useState, useRef } from 'react';
import { FileAudio, Upload, FileText, Sparkles, X, Music } from 'lucide-react';
import { processAudio } from '../services/geminiService';

interface AudioToolsProps {
  onResult: (text: string) => void;
  onLoadingStart: () => void;
  onError: () => void;
}

export const AudioTools: React.FC<AudioToolsProps> = ({ onResult, onLoadingStart, onError }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sarcasmLevel, setSarcasmLevel] = useState(8);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        // Simple validation for audio
        if (e.dataTransfer.files[0].type.startsWith('audio/')) {
            setFile(e.dataTransfer.files[0]);
        }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:audio/xyz;base64, prefix
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
            reject(new Error("Failed to convert file"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleProcess = async (mode: 'transcribe' | 'humor') => {
    if (!file) return;

    onLoadingStart();
    try {
      const base64 = await convertToBase64(file);
      const mimeType = file.type || 'audio/mp3'; // Default fallback if type is missing
      
      const text = await processAudio(base64, mimeType, mode, sarcasmLevel);
      
      const header = mode === 'transcribe' 
        ? `*** TRANSCRIPCIÓN DE AUDIO: ${file.name} ***\n\n`
        : `*** REMIX SARCÁSTICO DE AUDIO: ${file.name} (NIVEL ${sarcasmLevel}) ***\n\n`;
      
      onResult(header + text);
    } catch (error) {
      console.error(error);
      onError();
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
            <Music className="text-neon-purple" />
            <span>Laboratorio de Audio</span>
        </h2>

        {!file ? (
            <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                    ${dragActive ? 'border-neon-purple bg-neon-purple/10' : 'border-gray-700 hover:border-gray-500 bg-gray-950'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="audio/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                />
                <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-300 font-medium">Arrastra un audio aquí</p>
                <p className="text-gray-600 text-xs mt-1">o haz click para buscar (MP3, WAV, AAC)</p>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileAudio className="text-acid-green flex-shrink-0" />
                        <span className="text-sm text-gray-200 truncate">{file.name}</span>
                    </div>
                    <button 
                        onClick={() => setFile(null)}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleProcess('transcribe')}
                        className="flex flex-col items-center justify-center p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all hover:scale-105"
                    >
                        <FileText className="w-6 h-6 text-blue-400 mb-2" />
                        <span className="text-xs font-bold text-gray-300">Transcribir</span>
                        <span className="text-[10px] text-gray-500 mt-1">Texto literal</span>
                    </button>

                    <button 
                        onClick={() => handleProcess('humor')}
                        className="flex flex-col items-center justify-center p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all hover:scale-105 group"
                    >
                        <Sparkles className="w-6 h-6 text-neon-purple mb-2 group-hover:animate-pulse" />
                        <span className="text-xs font-bold text-gray-300">Hacer Gracioso</span>
                        <span className="text-[10px] text-gray-500 mt-1">Remix Ácido</span>
                    </button>
                </div>

                <div className="pt-2 border-t border-gray-800">
                    <label className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Nivel de Sarcasmo (para Remix)</span>
                        <span className="text-neon-purple font-mono">{sarcasmLevel}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={sarcasmLevel}
                        onChange={(e) => setSarcasmLevel(Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                    />
                </div>
            </div>
        )}
    </div>
  );
};