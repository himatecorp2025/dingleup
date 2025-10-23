import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageViewer = ({ imageUrl, onClose }: ImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 4);
    setScale(newScale);
    
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[10020] bg-black/95 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-[#1a1a1a]/80 hover:bg-[#1a1a1a] rounded-full transition-all duration-200 border border-[#D4AF37]/30"
        aria-label="Bezárás"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm text-center px-4">
        <p>Dupla kattintás a nagyításhoz • Scroll a zoom-hoz • Húzd a képet</p>
      </div>

      {/* Image */}
      <div
        className="relative max-w-[95vw] max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
      >
        <img
          src={imageUrl}
          alt="Teljes méret"
          className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl shadow-[#D4AF37]/20 border border-[#D4AF37]/20 transition-transform duration-200"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
        />
      </div>
    </div>
  );
};