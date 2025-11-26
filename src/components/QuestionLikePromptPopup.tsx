import { X, Heart } from "lucide-react";
import { useI18n } from "@/i18n/useI18n";

interface QuestionLikePromptPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  isLiked: boolean;
}

export const QuestionLikePromptPopup = ({
  isOpen,
  onClose,
  onLike,
  isLiked,
}: QuestionLikePromptPopupProps) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-[90%] max-w-md mx-4">
        {/* 3D Card Container with Casino Aesthetic */}
        <div className="relative bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 rounded-3xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.4),0_0_100px_rgba(99,102,241,0.3)] border-2 border-purple-400/30">
          {/* Glow Effects */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 opacity-20 blur-xl" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            {/* Animated Heart Icon */}
            <div className="relative">
              <div className="absolute inset-0 animate-pulse">
                <Heart 
                  className="w-20 h-20 text-pink-500 opacity-30 blur-md" 
                  fill="currentColor"
                />
              </div>
              <Heart 
                className={`relative w-20 h-20 transition-all duration-300 ${
                  isLiked ? 'text-red-500 scale-110' : 'text-white'
                }`}
                fill={isLiked ? "currentColor" : "none"}
                strokeWidth={2}
              />
            </div>

            {/* Title Text */}
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              {t('game.like_prompt_title')}
            </h2>

            {/* Description */}
            <p className="text-lg text-purple-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              {t('game.like_prompt_description')}
            </p>

            {/* Like Button with 3D Effect */}
            <button
              onClick={() => {
                onLike();
                onClose();
              }}
              disabled={isLiked}
              className={`
                relative group px-8 py-4 rounded-2xl font-bold text-lg
                transition-all duration-300 transform
                ${isLiked 
                  ? 'bg-gray-600 cursor-not-allowed opacity-60' 
                  : 'bg-gradient-to-br from-pink-500 via-red-500 to-rose-600 hover:scale-105 active:scale-95 shadow-[0_8px_30px_rgba(236,72,153,0.5)]'
                }
              `}
              style={{
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                boxShadow: isLiked ? 'none' : '0 0 30px rgba(236,72,153,0.6), inset 0 2px 10px rgba(255,255,255,0.2)',
              }}
            >
              {/* Button Inner Glow */}
              {!isLiked && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20 pointer-events-none" />
              )}
              
              <span className="relative flex items-center gap-2 text-white">
                <Heart 
                  className="w-6 h-6" 
                  fill={isLiked ? "currentColor" : "none"}
                />
                {isLiked ? t('game.already_liked') : t('game.like_button')}
              </span>
            </button>

            {/* Skip hint */}
            <p className="text-sm text-purple-200/60 italic">
              {t('game.like_prompt_skip_hint')}
            </p>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-purple-400/50 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-400/50 rounded-br-3xl" />
        </div>
      </div>
    </div>
  );
};
