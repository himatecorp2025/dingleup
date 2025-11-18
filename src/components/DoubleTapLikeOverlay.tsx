import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DoubleTapLikeOverlayProps {
  show: boolean;
  onAnimationEnd: () => void;
}

export const DoubleTapLikeOverlay = ({ show, onAnimationEnd }: DoubleTapLikeOverlayProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onAnimationEnd();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show, onAnimationEnd]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      {/* Large heart animation - TikTok style */}
      <Heart
        className="w-32 h-32 fill-red-500 text-red-500 opacity-0 scale-0"
        style={{
          animation: 'likePopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      />
      
      {/* CSS animation */}
      <style>{`
        @keyframes likePopIn {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-15deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(5deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};