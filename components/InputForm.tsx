import React, { useState } from 'react';
import { ScriptRequest } from '../types';
import { Mic, Radio, Zap, Sliders, Activity } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: ScriptRequest) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [toolName, setToolName] = useState('Gemini');
  const [hostName, setHostName] = useState('Cyber-Vato');
  const [podcastName, setPodcastName] = useState('El Algoritmo Bizarro');
  const [toneIntensity, setToneIntensity] = useState(7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ toolName, hostName, podcastName, toneIntensity });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Aesthetic background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 rounded-full blur-3xl -z-10"></div>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 font-mono">
            <Radio className="text-acid-green" />
            <span>Configuración del Show</span>
        </h2>

        <div className="space-y-4">
            <div>
                <label className="block text-gray-400 text-sm mb-1">Herramienta de IA (Tema)</label>
                <div className="relative">
                    <Zap className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={toolName}
                        onChange={(e) => setToolName(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-purple transition-colors"
                        placeholder="Ej: ChatGPT, Gemini..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Nombre del Podcast</label>
                    <div className="relative">
                        <Mic className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={podcastName}
                            onChange={(e) => setPodcastName(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-purple transition-colors"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-gray-400 text-sm mb-1">Nombre del Host</label>
                    <input
                        type="text"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-neon-purple transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="block text-gray-400 text-sm mb-1 flex justify-between">
                    <span>Nivel de Sarcasmo & Acidez</span>
                    <span className="text-acid-green font-mono">{toneIntensity}/10</span>
                </label>
                <div className="relative flex items-center gap-4">
                    <Sliders className="w-5 h-5 text-gray-500" />
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={toneIntensity}
                        onChange={(e) => setToneIntensity(Number(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-acid-green"
                    />
                    <Activity className={`w-5 h-5 ${toneIntensity > 8 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-6 py-4 rounded-lg font-bold text-lg uppercase tracking-wide transition-all
                    ${isLoading 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white hover:from-indigo-600 hover:to-neon-purple shadow-lg shadow-purple-900/50'
                    }`}
            >
                {isLoading ? 'Generando Escaleta...' : 'Producir Episodio'}
            </button>
        </div>
    </form>
  );
};