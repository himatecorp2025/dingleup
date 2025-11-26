import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { DailyRankReward } from '@/hooks/useDailyRankReward';
import { GoldRewardCoin3D } from './icons/GoldRewardCoin3D';
import { LifeIcon3D } from './icons/LifeIcon3D';

interface DailyRankRewardDialogProps {
  open: boolean;
  reward: DailyRankReward | null;
  isClaiming: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

/**
 * Temu-style addictive daily rank reward popup
 * Shows rank-based styling: gold (1st), silver (2nd), bronze (3rd), IT-blue (4-10/25)
 */
export const DailyRankRewardDialog = ({ 
  open, 
  reward, 
  isClaiming,
  onClaim, 
  onDismiss 
}: DailyRankRewardDialogProps) => {
  const { t, lang } = useI18n();

  if (!reward) return null;

  // Determine styling based on rank
  const getRankStyling = (rank: number) => {
    if (rank === 1) {
      return {
        bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
        borderColor: '#FFD700',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        textColor: '#FFD700',
        titleText: lang === 'hu' ? '🏆 ELSŐ HELYEZETT!' : '🏆 1ST PLACE!',
        badgeGradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
        particles: true
      };
    } else if (rank === 2) {
      return {
        bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #909090 100%)',
        borderColor: '#C0C0C0',
        glowColor: 'rgba(192, 192, 192, 0.6)',
        textColor: '#C0C0C0',
        titleText: lang === 'hu' ? '🥈 MÁSODIK HELYEZETT!' : '🥈 2ND PLACE!',
        badgeGradient: 'linear-gradient(135deg, #E8E8E8, #C0C0C0)',
        particles: false
      };
    } else if (rank === 3) {
      return {
        bgGradient: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 50%, #8B4513 100%)',
        borderColor: '#CD7F32',
        glowColor: 'rgba(205, 127, 50, 0.6)',
        textColor: '#CD7F32',
        titleText: lang === 'hu' ? '🥉 HARMADIK HELYEZETT!' : '🥉 3RD PLACE!',
        badgeGradient: 'linear-gradient(135deg, #CD7F32, #B8860B)',
        particles: false
      };
    } else {
      // IT-Blue for ranks 4-10 or 4-25 (Sunday)
      return {
        bgGradient: 'linear-gradient(135deg, #00D4FF 0%, #0080FF 50%, #0040FF 100%)',
        borderColor: '#00D4FF',
        glowColor: 'rgba(0, 212, 255, 0.6)',
        textColor: '#00D4FF',
        titleText: lang === 'hu' ? `🎯 ${rank}. HELYEZETT!` : `🎯 ${rank}TH PLACE!`,
        badgeGradient: 'linear-gradient(135deg, #00D4FF, #0080FF)',
        particles: false
      };
    }
  };

  const styling = getRankStyling(reward.rank);

  const messageText = lang === 'hu' 
    ? `${reward.username}, gratulálunk! Bekerültél a ${reward.isSundayJackpot ? 'Vasárnapi Jackpot' : 'napi'} TOP${reward.isSundayJackpot ? '25' : '10'}-be!`
    : `${reward.username}, congratulations! You made it to the ${reward.isSundayJackpot ? 'Sunday Jackpot' : 'daily'} TOP${reward.isSundayJackpot ? '25' : '10'}!`;

  const claimButtonText = lang === 'hu' ? '💰 JUTALOM FELVÉTELE!' : '💰 CLAIM REWARD!';
  const dismissText = lang === 'hu' ? 'Most nem' : 'Not now';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="overflow-visible p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden z-[99999]"
        style={{ margin: 0, maxHeight: 'none', minHeight: '100dvh', zIndex: 99999 }}
      >
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-lg">
          <DialogTitle className="sr-only">Napi Ranglista Jutalom</DialogTitle>
          <DialogDescription className="sr-only">Tegnapi ranglistás helyezésed jutalma</DialogDescription>

          {/* Main reward card */}
          <div 
            className="relative w-[90vw] max-w-[500px] rounded-3xl overflow-hidden"
            style={{
              background: styling.bgGradient,
              boxShadow: `0 0 40px ${styling.glowColor}, 0 20px 60px rgba(0,0,0,0.5)`,
              border: `3px solid ${styling.borderColor}`,
              animation: 'bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
          >
            {/* Particles effect for 1st place */}
            {styling.particles && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-all"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Content */}
            <div className="relative z-10 p-8 pt-12 flex flex-col items-center text-center">
              {/* Title badge */}
              <div 
                className="px-8 py-3 rounded-full mb-6 font-black text-white text-xl uppercase"
                style={{
                  background: styling.badgeGradient,
                  boxShadow: `0 4px 15px ${styling.glowColor}`,
                  letterSpacing: '0.1em'
                }}
              >
                {styling.titleText}
              </div>

              {/* User message */}
              <p className="text-white text-lg font-bold mb-6 drop-shadow-lg">
                {messageText}
              </p>

              {/* Reward display */}
              <div className="flex gap-8 mb-8 items-center justify-center">
                {/* Gold */}
                <div className="flex flex-col items-center">
                  <GoldRewardCoin3D className="w-20 h-20 mb-2" />
                  <span 
                    className="text-3xl font-black drop-shadow-lg"
                    style={{ color: styling.textColor }}
                  >
                    +{reward.gold}
                  </span>
                  <span className="text-white text-sm font-semibold uppercase">
                    {lang === 'hu' ? 'Arany' : 'Gold'}
                  </span>
                </div>

                {/* Lives */}
                <div className="flex flex-col items-center">
                  <LifeIcon3D className="w-20 h-20 mb-2" />
                  <span 
                    className="text-3xl font-black drop-shadow-lg"
                    style={{ color: styling.textColor }}
                  >
                    +{reward.lives}
                  </span>
                  <span className="text-white text-sm font-semibold uppercase">
                    {lang === 'hu' ? 'Élet' : 'Lives'}
                  </span>
                </div>
              </div>

              {/* Addictive marketing copy */}
              <p className="text-white/90 text-base font-semibold mb-8 max-w-[400px] leading-relaxed">
                {lang === 'hu' 
                  ? '🔥 Király vagy! Ma te uralod a táblát! Fogadd el a jutalmat és játssz tovább!' 
                  : '🔥 You\'re amazing! You rule the board today! Claim your reward and keep playing!'}
              </p>

              {/* Claim button */}
              <button
                onClick={onClaim}
                disabled={isClaiming}
                className="w-full max-w-[350px] py-4 rounded-2xl font-black text-white text-xl uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.5), inset 0 -2px 0 rgba(0,0,0,0.2)',
                }}
              >
                {isClaiming ? (lang === 'hu' ? '⏳ FELDOLGOZÁS...' : '⏳ PROCESSING...') : claimButtonText}
              </button>

              {/* Dismiss text */}
              <button
                onClick={onDismiss}
                className="mt-4 text-white/60 hover:text-white/90 text-sm font-semibold underline transition-all"
              >
                {dismissText}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(1);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.5);
          }
        }
      `}</style>
    </Dialog>
  );
};
