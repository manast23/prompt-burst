
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { editImage } from '../services/geminiService';

interface ImageCardProps {
  image: GeneratedImage;
  onUpdate: (updatedImage: GeneratedImage) => void;
  onDelete: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const newImageUrl = await editImage(image.url, editPrompt);
      onUpdate({
        ...image,
        url: newImageUrl,
        prompt: `${image.prompt} + [Edit: ${editPrompt}]`,
        createdAt: Date.now()
      });
      setIsEditing(false);
      setEditPrompt('');
    } catch (error: any) {
      alert(`Editing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (image.status === 'loading') {
    return (
      <div className="relative aspect-square bg-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center animate-pulse border border-slate-700">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-medium animate-bounce px-4 text-center">
          Crafting your masterpiece...
        </p>
      </div>
    );
  }

  if (image.status === 'error') {
    return (
      <div className="relative aspect-square bg-slate-900/50 border border-red-900/50 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-400 text-sm font-medium text-center mb-4">{image.error || 'Failed to generate'}</p>
        <button 
          onClick={() => onDelete(image.id)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="group relative aspect-square bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-blue-500/10">
      <img 
        src={image.url} 
        alt={image.prompt} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-white text-xs font-medium line-clamp-2 mb-3 drop-shadow-lg">{image.prompt}</p>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(true)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg"
          >
            Refine with AI
          </button>
          <button 
            onClick={() => onDelete(image.id)}
            className="p-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-lg transition-colors"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Edit Modal / Input */}
      {isEditing && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
          <button 
            onClick={() => setIsEditing(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
            </svg>
          </button>
          
          <h3 className="text-lg font-bold text-white mb-2">Edit Image</h3>
          <p className="text-slate-400 text-xs mb-4 text-center">Describe the changes you'd like to make to this image.</p>
          
          <form onSubmit={handleEdit} className="w-full space-y-3">
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., 'Add a vintage polaroid filter' or 'Change the sky to sunset'"
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-24"
              autoFocus
            />
            <button
              type="submit"
              disabled={!editPrompt.trim() || isProcessing}
              className={`w-full py-3 rounded-xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${
                isProcessing ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                  Applying Magic...
                </>
              ) : (
                'Apply Edits'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
