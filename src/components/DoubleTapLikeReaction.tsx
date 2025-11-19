import React, { useState, useRef } from 'react';
import { Heart } from 'lucide-react';

interface DoubleTapLikeReactionProps {
  onDoubleTap: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DoubleTapLikeReaction: React.FC<DoubleTapLikeReactionProps> = ({
  onDoubleTap,
  children,
  className = '',
}) => {
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef<number>(0);
  const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected - prevent propagation
      e.stopPropagation();
      onDoubleTap();
      
      // Show heart animation
      setShowHeart(true);
      
      // Clear previous timeout if exists
      if (heartTimeoutRef.current) {
        clearTimeout(heartTimeoutRef.current);
      }
      
      // Hide heart after animation
      heartTimeoutRef.current = setTimeout(() => {
        setShowHeart(false);
      }, 800);
    }
    
    lastTapRef.current = now;
  };

  return (
    <div 
      className={`${className}`}
      onClickCapture={handleTap}
      style={{ isolation: 'isolate' }}
    >
      {children}
      
      {/* TikTok-style heart animation on double tap */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200]">
          <div className="animate-[ping_0.8s_ease-out]">
            <Heart className="w-32 h-32 fill-red-500 text-red-500 opacity-80 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
          </div>
        </div>
      )}
    </div>
  );
};