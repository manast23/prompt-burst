
import React, { useState, useCallback, useRef } from 'react';
import { GeneratedImage } from './types';
import { generateImage } from './services/geminiService';
import ImageCard from './components/ImageCard';

const App: React.FC = () => {
  const [promptText, setPromptText] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!promptText.trim()) return;

    // Split prompts by new lines and clean them
    const individualPrompts = promptText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (individualPrompts.length === 0) return;

    setIsGeneratingAll(true);
    setPromptText('');

    // Create placeholder entries for each prompt
    const newRequestIds = individualPrompts.map(() => crypto.randomUUID());
    const placeholders: GeneratedImage[] = individualPrompts.map((p, i) => ({
      id: newRequestIds[i],
      prompt: p,
      url: '',
      status: 'loading',
      createdAt: Date.now()
    }));

    // Add placeholders to state (newest first)
    setImages(prev => [...placeholders, ...prev]);

    // Fire off all generations simultaneously
    individualPrompts.forEach(async (prompt, index) => {
      const id = newRequestIds[index];
      try {
        const url = await generateImage(prompt);
        setImages(prev => prev.map(img => 
          img.id === id ? { ...img, url, status: 'success' } : img
        ));
      } catch (error: any) {
        setImages(prev => prev.map(img => 
          img.id === id ? { ...img, status: 'error', error: error.message } : img
        ));
      } finally {
        // If all are done (approximate check based on state)
        // Check if there are still any 'loading' images from the current batch
        setImages(prev => {
          const stillLoading = prev.some(img => img.status === 'loading');
          if (!stillLoading) setIsGeneratingAll(false);
          return prev;
        });
      }
    });
  };

  const handleUpdateImage = (updated: GeneratedImage) => {
    setImages(prev => prev.map(img => img.id === updated.id ? updated : img));
  };

  const handleDeleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    if (confirm('Clear all generated images?')) {
      setImages([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">PromptBurst</h1>
            <p className="text-slate-400 text-sm">Batch generation & AI editing power</p>
          </div>
        </div>

        {images.length > 0 && (
          <button 
            onClick={clearAll}
            className="self-start md:self-center px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Gallery
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Persistent Input Section */}
        <div className="sticky top-4 z-20 mb-12">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-1 shadow-2xl overflow-hidden">
            <div className="relative">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Paste multiple prompts here... (Each line is a separate image)"
                className="w-full bg-transparent text-white px-6 pt-6 pb-20 focus:outline-none placeholder:text-slate-500 resize-none min-h-[140px] max-h-[400px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleGenerate();
                }}
              />
              <div className="absolute bottom-4 left-6 right-4 flex items-center justify-between pointer-events-none">
                <span className="text-slate-500 text-xs font-medium bg-slate-800/50 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-auto">
                  {promptText.split('\n').filter(p => p.trim()).length} prompts detected
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={!promptText.trim() || isGeneratingAll}
                  className={`px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-3 pointer-events-auto shadow-2xl ${
                    !promptText.trim() || isGeneratingAll 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {isGeneratingAll ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Generate All
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        {images.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-[3rem] opacity-50">
            <div className="bg-slate-800/50 p-6 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">Your canvas is empty</h2>
            <p className="text-slate-500 max-w-sm">
              Paste a list of image descriptions above. Each line will burst into a unique AI creation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {images.map(image => (
              <ImageCard 
                key={image.id} 
                image={image} 
                onUpdate={handleUpdateImage}
                onDelete={handleDeleteImage}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-auto pt-12 pb-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-500 text-xs font-medium">
          Powered by <span className="text-slate-400">Gemini 2.5 Flash Image</span>
        </p>
        <div className="flex items-center gap-6">
          <span className="text-slate-500 text-xs">Aesthetically crafted with Tailwind</span>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">API Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
