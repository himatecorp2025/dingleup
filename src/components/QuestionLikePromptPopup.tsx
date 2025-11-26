import { X, Heart } from "lucide-react";
import { useI18n } from "@/i18n/useI18n";
import { CoinIcon3D } from "@/components/icons/CoinIcon3D";

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
        {/* 3D Card Container with Enhanced Casino Aesthetic */}
        <div className="relative bg-gradient-to-br from-purple-900/98 via-purple-800/98 to-indigo-900/98 rounded-3xl p-8 shadow-[0_0_80px_rgba(168,85,247,0.6),0_0_120px_rgba(99,102,241,0.5),0_20px_50px_rgba(0,0,0,0.8)] border-2 border-purple-400/40">
          {/* Enhanced Glow Effects */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-purple-500/30 to-transparent pointer-events-none" />
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 opacity-30 blur-2xl animate-pulse" />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />

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
            {/* Animated Coin Icon with 3D Effects */}
            <div className="relative">
              <div className="absolute inset-0 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-yellow-500/40 blur-2xl" />
              </div>
              <div className="relative animate-bounce-slow">
                <CoinIcon3D size={96} className="drop-shadow-[0_8px_30px_rgba(234,179,8,0.8)]" />
              </div>
              {/* Floating sparkles */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-300 rounded-full animate-ping" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Title Text with Coin Reward */}
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.7)]">
                {t('game.like_prompt_title')}
              </h2>
              <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xl animate-pulse">
                <CoinIcon3D size={32} />
                <span className="drop-shadow-[0_2px_10px_rgba(234,179,8,0.9)]">
                  +10 {t('game.like_prompt_coin_reward')}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-lg text-purple-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] leading-relaxed">
              {t('game.like_prompt_description')}
            </p>

            {/* Like Button with Enhanced 3D Effect */}
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
                  : 'bg-gradient-to-br from-pink-500 via-red-500 to-rose-600 hover:scale-110 active:scale-95 shadow-[0_10px_40px_rgba(236,72,153,0.7),0_0_60px_rgba(236,72,153,0.4)]'
                }
              `}
              style={{
                textShadow: '0 3px 15px rgba(0,0,0,0.8)',
                boxShadow: isLiked ? 'none' : '0 0 40px rgba(236,72,153,0.8), inset 0 3px 15px rgba(255,255,255,0.3), inset 0 -3px 10px rgba(0,0,0,0.3)',
              }}
            >
              {/* Enhanced Button Inner Glow */}
              {!isLiked && (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-black/20 pointer-events-none" />
                </>
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
