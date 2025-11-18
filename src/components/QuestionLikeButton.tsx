import { Heart } from 'lucide-react';
import { useQuestionLike } from '@/hooks/useQuestionLike';
import { useState } from 'react';

interface QuestionLikeButtonProps {
  questionId: string;
  onDoubleTap?: () => void;
}

export const QuestionLikeButton = ({ questionId }: QuestionLikeButtonProps) => {
  const { liked, likeCount, toggleLike } = useQuestionLike(questionId);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent double-tap detection on parent
    const newLikedState = await toggleLike();
    
    // Trigger animation on like (not unlike)
    if (newLikedState) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 relative">
      {/* Like button */}
      <button
        onClick={handleLike}
        className="relative p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label={liked ? 'Lájk visszavonása' : 'Kérdés lájkolása'}
      >
        {/* Shadow base */}
        <div 
          className="absolute inset-0 bg-black/30 rounded-full blur-md" 
          style={{ transform: 'translate(2px, 2px)' }}
          aria-hidden 
        />
        
        {/* Background glow when liked */}
        {liked && (
          <div 
            className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"
            aria-hidden
          />
        )}
        
        {/* Heart icon */}
        <Heart
          className={`w-7 h-7 relative z-10 transition-all duration-300 ${
            liked 
              ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
              : 'fill-none text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
          }`}
          strokeWidth={liked ? 0 : 2.5}
        />
        
        {/* Pop animation on like */}
        {isAnimating && (
          <Heart
            className="absolute inset-0 m-auto w-7 h-7 fill-red-500 text-red-500 animate-ping opacity-75 pointer-events-none"
            aria-hidden
          />
        )}
      </button>

      {/* Like count */}
      <div className="text-white text-sm font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] min-w-[2.5rem] text-center">
        {likeCount > 0 ? (
          likeCount >= 1000 
            ? `${(likeCount / 1000).toFixed(1)}k` 
            : likeCount
        ) : '0'}
      </div>
    </div>
  );
};