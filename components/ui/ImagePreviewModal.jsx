import React from 'react';
import { X } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, onClose, imageUrl, title }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] p-4 bg-white rounded-lg shadow-2xl overflow-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-900 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all z-[210]"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-slate-900">
            {title}
          </h3>
        </div>
        <img
          src={imageUrl.replace('&sz=w1000', '&sz=w2000')}
          alt={title}
          className="block w-full h-auto max-h-[75vh] object-contain rounded-md"
        />
      </div>
    </div>
  );
}
