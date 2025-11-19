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
    <div className="fixed right-3 sm:right-4 z-20 flex flex-col gap-4 sm:gap-6" style={{ 
      bottom: 'calc(7.2rem + env(safe-area-inset-bottom, 0px))'
    }}>
      {/* LIKE Button - 50% larger */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike();
        }}
        disabled={loading}
        className="flex flex-col items-center gap-1 transition-all hover:scale-110 disabled:opacity-50"
        aria-label={liked ? "Unlike question" : "Like question"}
      >
        <div className="relative">
          <Heart
            className={cn(
              "w-10 h-10 transition-all",
              liked 
                ? "fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]" 
                : "text-gray-400 hover:text-red-400"
            )}
          />
          {liked && (
            <div className="absolute inset-0 animate-ping">
              <Heart className="w-10 h-10 fill-red-500 text-red-500 opacity-20" />
            </div>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-bold transition-colors",
            liked ? "text-red-500" : "text-gray-400"
          )}
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
        className="flex flex-col items-center gap-1 transition-all hover:scale-110 disabled:opacity-50"
        aria-label={disliked ? "Remove dislike" : "Dislike question"}
      >
        <div className="relative">
          <ThumbsDown
            className={cn(
              "w-10 h-10 transition-all",
              disliked 
                ? "fill-orange-500 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]" 
                : "text-gray-400 hover:text-orange-400"
            )}
          />
          {disliked && (
            <div className="absolute inset-0 animate-ping">
              <ThumbsDown className="w-10 h-10 fill-orange-500 text-orange-500 opacity-20" />
            </div>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-bold transition-colors",
            disliked ? "text-orange-500" : "text-gray-400"
          )}
        >
          {dislikeCount}
        </span>
      </button>
    </div>
  );
};