import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Radio, Power, Volume2, X } from 'lucide-react';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const LiveSession: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); // To hold the active session object if needed, though mostly handled via closure in example

  // Cleanup function to stop audio contexts and stream
  const cleanup = useCallback(() => {
    if (sessionRef.current) {
        // Unfortunately standard API doesn't expose a clean .close() on the session object returned by connect
        // but the connection is managed via the promise/socket. 
        // We will rely on reloading or component unmount logic usually, 
        // but for this demo we'll just stop the audio contexts.
    }
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    setVolume(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Initialize GoogleGenAI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputAudioContext;
      audioContextRef.current = outputAudioContext;
      nextStartTimeRef.current = 0;

      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }, // Fenrir sounds deeper/authoritative
          },
          systemInstruction: "Eres el productor ejecutivo de un podcast de tecnología sarcástico. Tu trabajo es ayudar al guionista (el usuario) a hacer una lluvia de ideas. Eres cínico, rápido, usas humor negro y odias los clichés. Habla español.",
        },
        callbacks: {
          onopen: () => {
            console.log("Live session connected");
            setIsActive(true);
            setIsConnecting(false);

            // Setup Input Processing
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              
              // Simple volume visualization
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5, 1)); // Amplify for visual

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            
            if (base64Audio) {
              const ctx = audioContextRef.current;
              if (!ctx) return;

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(source => source.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Live session closed");
            cleanup();
          },
          onerror: (e) => {
            console.error("Live session error", e);
            setError("Error de conexión");
            cleanup();
          }
        }
      });
      
      // Store session logic if needed, effectively handled by the promise chain
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar la sesión. Verifica el micrófono.");
      setIsConnecting(false);
    }
  };

  // Helper Functions
  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    
    // Manual base64 encoding to avoid external deps if needed, 
    // but btoa is standard.
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  if (!isActive && !isConnecting) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={startSession}
          className="group flex items-center gap-3 bg-gray-900 border border-neon-purple/50 hover:border-neon-purple text-white px-6 py-4 rounded-full shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] transition-all transform hover:-translate-y-1"
        >
          <div className="relative">
            <Radio className="w-6 h-6 text-neon-purple animate-pulse" />
            <div className="absolute inset-0 bg-neon-purple blur-md opacity-40"></div>
          </div>
          <div className="text-left">
            <div className="font-bold uppercase tracking-wider text-sm">Hablar con Productor</div>
            <div className="text-[10px] text-gray-400">Modo Live Brainstorming</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50">
      <div className="bg-gray-900 border border-neon-purple rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <h3 className="font-bold text-white tracking-wide">PRODUCER_LIVE_FEED</h3>
            </div>
            <button 
                onClick={cleanup}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <div className="flex items-center justify-center gap-6 py-4 relative z-10">
            {/* Visualizer Circle */}
            <div className="relative w-24 h-24 flex items-center justify-center">
                <div 
                    className="absolute inset-0 bg-neon-purple rounded-full opacity-20 transition-all duration-75"
                    style={{ transform: `scale(${1 + volume * 2})` }}
                ></div>
                <div 
                    className="absolute inset-0 border-2 border-neon-purple rounded-full opacity-50 transition-all duration-100"
                    style={{ transform: `scale(${1 + volume})` }}
                ></div>
                <Mic className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            </div>
        </div>

        <div className="text-center space-y-2 relative z-10">
            {isConnecting ? (
                <p className="text-neon-purple font-mono text-sm animate-pulse">Estableciendo enlace seguro...</p>
            ) : (
                <p className="text-gray-300 text-sm">"Cuéntame qué ideas tienes para el guion..."</p>
            )}
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <div className="mt-4 flex justify-center relative z-10">
            <button 
                onClick={cleanup}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm border border-red-500/30 transition-colors"
            >
                <Power size={14} />
                <span>Desconectar</span>
            </button>
        </div>
      </div>
    </div>
  );
};
