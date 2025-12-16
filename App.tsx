import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ScriptDisplay } from './components/ScriptDisplay';
import { generatePodcastScript } from './services/geminiService';
import { ScriptRequest, GenerationStatus } from './types';
import { Headphones, Terminal } from 'lucide-react';
import { LiveSession } from './components/LiveSession';
import { AudioTools } from './components/AudioTools';

export default function App() {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [script, setScript] = useState<string>('');

  const handleGenerate = async (data: ScriptRequest) => {
    setStatus(GenerationStatus.LOADING);
    setScript(''); // Clear previous script
    try {
      const result = await generatePodcastScript(data);
      setScript(result);
      setStatus(GenerationStatus.SUCCESS);
    } catch (error) {
      setScript('Error crítico: La IA se niega a cooperar. Verifica tu conexión o intenta más tarde.');
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleAudioResult = (text: string) => {
    setScript(text);
    setStatus(GenerationStatus.SUCCESS);
  };

  const handleAudioError = () => {
    setScript('Error procesando el audio. Quizás el archivo está corrupto o la IA está de huelga.');
    setStatus(GenerationStatus.ERROR);
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white selection:bg-neon-purple selection:text-white pb-20 font-sans">
      <header className="border-b border-gray-800 bg-[#0f0f12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neon-purple p-2 rounded-lg shadow-[0_0_15px_rgba(176,38,255,0.4)]">
                <Headphones className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter italic">
              GUIONISTA<span className="text-neon-purple">.IA</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
            <Terminal size={12} />
            <span>v2.2.0 // AUDIO_LAB_ACTIVE</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-32">
            <div className="prose prose-invert">
                <h3 className="text-xl font-bold text-white mb-2">Instrucciones de Producción</h3>
                <p className="text-gray-400 text-sm">
                    Define los parámetros de tu show o usa el laboratorio para procesar audios existentes.
                </p>
            </div>
            
            <InputForm onSubmit={handleGenerate} isLoading={status === GenerationStatus.LOADING} />
            
            <AudioTools 
              onLoadingStart={() => setStatus(GenerationStatus.LOADING)}
              onResult={handleAudioResult}
              onError={handleAudioError}
            />
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-8 min-h-[500px]">
            {status === GenerationStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-800 rounded-2xl opacity-50 bg-gray-900/30">
                    <Headphones size={64} className="text-gray-700 mb-4" />
                    <p className="text-xl font-mono text-gray-500">Esperando parámetros de entrada...</p>
                    <p className="text-sm text-gray-600 mt-2">Rellena el formulario o sube un audio.</p>
                </div>
            )}
            
            {status === GenerationStatus.LOADING && (
                <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 border-4 border-gray-800 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-neon-purple border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-lg font-mono text-neon-purple animate-pulse">Procesando datos...</p>
                    <p className="text-sm text-gray-500 mt-2 font-mono">Aplicando filtros de cinismo... [||||||    ]</p>
                </div>
            )}

            {(status === GenerationStatus.SUCCESS || status === GenerationStatus.ERROR) && (
                <ScriptDisplay content={script} />
            )}
        </div>
      </main>
      
      {/* Live Session Overlay/Button */}
      <LiveSession />
    </div>
  );
}