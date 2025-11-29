import React from 'react';
import { Heart, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionReactionsBarProps {
  liked: boolean;
  disliked: boolean;
  likeCount: number;
  dislikeCount: number;
  loading: boolean;
  onToggleLike: () => void;
  onToggleDislike: () => void;
}

export const QuestionReactionsBar: React.FC<QuestionReactionsBarProps> = ({
  liked,
  disliked,
  likeCount,
  dislikeCount,
  loading,
  onToggleLike,
  onToggleDislike,
}) => {
  return (
    <div 
      className="fixed z-20 flex flex-col"
      style={{ 
        right: 'clamp(0.75rem, 2vw, 1rem)',
        bottom: 'calc(clamp(1.5rem, 3vw, 2rem) + env(safe-area-inset-bottom, 0px) + 5vh)',
        gap: 'clamp(1rem, 3vw, 1.5rem)'
      }}
    >
      {/* LIKE Button - 50% larger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike();
        }}
        disabled={loading}
        className="flex flex-col items-center transition-all hover:scale-110 disabled:opacity-50"
        style={{ gap: 'clamp(0.25rem, 0.5vw, 0.5rem)' }}
        aria-label={liked ? "Unlike question" : "Like question"}
      >
        <div className="relative">
          <Heart
            className={cn(
              "transition-all",
              liked 
                ? "fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" 
                : "text-gray-400 hover:text-red-400"
            )}
            style={{
              width: 'clamp(2rem, 5vw, 2.5rem)',
              height: 'clamp(2rem, 5vw, 2.5rem)'
            }}
          />
          {liked && (
            <div className="absolute inset-0 animate-ping">
              <Heart 
                className="fill-red-500 text-red-500 opacity-20"
                style={{
                  width: 'clamp(2rem, 5vw, 2.5rem)',
                  height: 'clamp(2rem, 5vw, 2.5rem)'
                }}
              />
            </div>
          )}
        </div>
        <span
          className={cn(
            "font-bold transition-colors",
            liked ? "text-red-500" : "text-gray-400"
          )}
          style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
        >
          {likeCount}
        </span>
      </button>

      {/* DISLIKE Button - 50% larger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDislike();
        }}
        disabled={loading}
        className="flex flex-col items-center transition-all hover:scale-110 disabled:opacity-50"
        style={{ gap: 'clamp(0.25rem, 0.5vw, 0.5rem)' }}
        aria-label={disliked ? "Remove dislike" : "Dislike question"}
      >
        <div className="relative">
          <ThumbsDown
            className={cn(
              "transition-all",
              disliked 
                ? "fill-orange-500 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]" 
                : "text-gray-400 hover:text-orange-400"
            )}
            style={{
              width: 'clamp(2rem, 5vw, 2.5rem)',
              height: 'clamp(2rem, 5vw, 2.5rem)'
            }}
          />
          {disliked && (
            <div className="absolute inset-0 animate-ping">
              <ThumbsDown 
                className="fill-orange-500 text-orange-500 opacity-20"
                style={{
                  width: 'clamp(2rem, 5vw, 2.5rem)',
                  height: 'clamp(2rem, 5vw, 2.5rem)'
                }}
              />
            </div>
          )}
        </div>
        <span
          className={cn(
            "font-bold transition-colors",
            disliked ? "text-orange-500" : "text-gray-400"
          )}
          style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
        >
          {dislikeCount}
        </span>
      </button>
    </div>
  );
};