import { Heart } from 'lucide-react';
import { useQuestionLike } from '@/hooks/useQuestionLike';
import { useState } from 'react';
import { useI18n } from '@/i18n';

interface QuestionLikeButtonProps {
  questionId: string;
  onDoubleTap?: () => void;
}

export const QuestionLikeButton = ({ questionId }: QuestionLikeButtonProps) => {
  const { t } = useI18n();
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
    <div className="flex flex-col items-center relative" style={{ gap: 'clamp(0.25rem, 0.5vw, 0.5rem)' }}>
      {/* Like button */}
      <button
        onClick={handleLike}
        className="relative rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ padding: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}
        aria-label={liked ? t('aria.unlike_question') : t('aria.like_question')}
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
          className={`relative z-10 transition-all duration-300 ${
            liked 
              ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
              : 'fill-none text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
          }`}
          style={{
            width: 'clamp(1.5rem, 3vw, 1.75rem)',
            height: 'clamp(1.5rem, 3vw, 1.75rem)'
          }}
          strokeWidth={liked ? 0 : 2.5}
        />
        
        {/* Pop animation on like */}
        {isAnimating && (
          <Heart
            className="absolute inset-0 m-auto fill-red-500 text-red-500 animate-ping opacity-75 pointer-events-none"
            style={{
              width: 'clamp(1.5rem, 3vw, 1.75rem)',
              height: 'clamp(1.5rem, 3vw, 1.75rem)'
            }}
            aria-hidden
          />
        )}
      </button>

      {/* Like count */}
      <div 
        className="text-white font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center"
        style={{ 
          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          minWidth: 'clamp(2rem, 4vw, 2.5rem)'
        }}
      >
        {likeCount > 0 ? (
          likeCount >= 1000 
            ? `${(likeCount / 1000).toFixed(1)}k` 
            : likeCount
        ) : '0'}
      </div>
    </div>
  );
};