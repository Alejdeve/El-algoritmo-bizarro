import React from 'react';
import { Copy, Download } from 'lucide-react';

interface ScriptDisplayProps {
  content: string;
}

export const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ content }) => {
  if (!content) return null;

  // Simple formatter to make the script look like a screenplay
  const renderContent = () => {
    return content.split('\n').map((line, i) => {
      // Highlight Characters and SFX/Music cues which usually are in brackets like [HOST] or [SFX]
      const isCue = line.trim().startsWith('[') && line.includes(']');
      const isHeader = line.startsWith('**') || line.startsWith('##') || line.startsWith('#');
      
      if (isCue) {
        // Style specific cues differently
        const isSfx = line.toLowerCase().includes('sfx') || line.toLowerCase().includes('música');
        return (
            <p key={i} className={`mt-6 mb-2 font-mono font-bold tracking-wide ${isSfx ? 'text-neon-purple italic' : 'text-acid-green'}`}>
                {line}
            </p>
        );
      }
      
      if (isHeader) {
          const cleanLine = line.replace(/\*|#/g, '');
          return <h3 key={i} className="text-xl font-bold text-white mt-8 mb-4 border-b border-gray-700 pb-2">{cleanLine}</h3>
      }

      // Format bold text inside standard lines
      if (line.includes('**')) {
          const parts = line.split('**');
          return (
              <p key={i} className="mb-3 text-gray-300 leading-relaxed text-lg max-w-3xl">
                  {parts.map((part, idx) => 
                      idx % 2 === 1 ? <span key={idx} className="font-bold text-white bg-white/5 px-1 rounded">{part}</span> : part
                  )}
              </p>
          )
      }
      
      return <p key={i} className="mb-3 text-gray-300 leading-relaxed text-lg max-w-3xl">{line}</p>;
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-white font-mono">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
            <span className="tracking-widest font-bold">ON AIR</span>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={copyToClipboard} 
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
                title="Copiar al portapapeles"
            >
                <Copy size={16} />
                <span className="hidden sm:inline">Copiar</span>
            </button>
        </div>
      </div>
      <div className="p-8 overflow-y-auto font-sans bg-[#0f0f12]">
        <div className="font-mono text-xs text-gray-600 mb-8 border-l-2 border-acid-green pl-3">
            <p>PROJECT: PODCAST_GEN_AI</p>
            <p>STATUS: FINAL_DRAFT</p>
        </div>
        {renderContent()}
        <div className="mt-12 text-center text-gray-600 font-mono text-sm">
            --- FIN DE LA TRANSMISIÓN ---
        </div>
      </div>
    </div>
  );
};