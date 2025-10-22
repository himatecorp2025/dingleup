import { HexagonButton } from './HexagonButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Gift, Coins, Sun, Sparkles, Star, Zap } from 'lucide-react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface DailyGiftDialogProps {
  open: boolean;
  onClaim: () => void;
  onClaimSuccess?: () => void;
  onLater: () => void;
  weeklyEntryCount: number;
  nextReward: number;
  canClaim: boolean;
  isPremium?: boolean;
}

const DAILY_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DailyGiftDialog = ({ 
  open, 
  onClaim,
  onClaimSuccess,
  onLater,
  weeklyEntryCount, 
  nextReward, 
  canClaim,
  isPremium = false 
}: DailyGiftDialogProps) => {
  const handleClaim = () => {
    onClaim();
    // Signal that claim was successful - trigger genius promo
    if (onClaimSuccess) {
      setTimeout(() => onClaimSuccess(), 500);
    }
  };
  const isHandheld = usePlatformDetection();

  // Don't render on desktop/laptop
  if (!isHandheld || !open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onLater}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-[#0F1116] border border-[hsl(var(--dup-gold-600))] shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(212,175,55,0.15)] overflow-hidden rounded-[20px]"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' 
        }}
      >
        {/* Casino lights animation - gold theme */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--dup-gold-400))] to-transparent opacity-80 animate-shimmer z-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--dup-gold-400))] to-transparent opacity-80 animate-shimmer z-50" style={{ animationDelay: '1s' }}></div>
        
        {/* Close button - crimson */}
        <button
          onClick={onLater}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[hsl(var(--dup-crimson-500))] hover:text-[hsl(var(--dup-crimson-400))] hover:bg-[hsl(var(--dup-crimson-500)/0.1)] transition-all focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)] z-50"
          aria-label="Bezárás"
        >
          ✕
        </button>
        
        {/* Floating sparkles - gold theme */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star className="absolute top-8 left-8 w-8 h-8 text-[hsl(var(--dup-gold-400))] animate-pulse drop-shadow-[0_0_10px_hsl(var(--dup-gold-500))]" style={{ animationDuration: '1.5s' }} />
          <Sparkles className="absolute top-16 right-10 w-6 h-6 text-[hsl(var(--dup-gold-300))] animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <Gift className="absolute bottom-20 left-16 w-7 h-7 text-[hsl(var(--dup-gold-500))] animate-pulse drop-shadow-[0_0_10px_hsl(var(--dup-gold-400))]" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
          <Sparkles className="absolute bottom-24 right-12 w-5 h-5 text-[hsl(var(--dup-gold-400))] animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl sm:text-3xl font-black text-center bg-gradient-to-r from-[hsl(var(--dup-gold-300))] via-[hsl(var(--dup-gold-500))] to-[hsl(var(--dup-gold-300))] bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            🎁 Napi ajándék 🎁
          </DialogTitle>
          <DialogDescription className="text-center text-base sm:text-lg text-[hsl(var(--dup-text-100))] font-bold mt-2">
            Ez a(z) {weeklyEntryCount + 1}. belépésed ezen a héten.
          </DialogDescription>
        </DialogHeader>

        {/* Sun icon if can claim - vibrant */}
        {canClaim && (
          <div className="flex justify-center py-6 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 via-orange-400/40 to-yellow-400/40 blur-3xl rounded-full animate-pulse"></div>
              <Sun className="relative w-36 h-36 sm:w-40 sm:h-40 text-yellow-300 animate-pulse drop-shadow-[0_0_30px_rgba(253,224,71,1)]" />
            </div>
          </div>
        )}

        <div className="space-y-5 relative z-10">
          {/* Streak display - enhanced */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {DAILY_REWARDS.map((reward, index) => {
              const isCompleted = index < weeklyEntryCount;
              const isCurrent = index === weeklyEntryCount;
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-[10px] flex flex-col items-center justify-center p-2 transition-all shadow-lg
                    ${isCompleted ? 'bg-gradient-to-br from-cyan-500/40 to-blue-500/40 border-2 border-cyan-400 shadow-cyan-400/50' : ''}
                    ${isCurrent ? 'bg-gradient-to-br from-yellow-500/40 to-orange-500/40 border-2 border-yellow-400 border-dashed animate-pulse shadow-yellow-400/50' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-800/50 border-2 border-gray-600' : ''}
                  `}
                >
                  <span className="text-xs sm:text-sm font-black text-white drop-shadow-md">{index + 1}</span>
                  <span className="text-xs sm:text-sm flex items-center gap-1 text-white font-bold">
                    <Coins className="w-3 h-3" />
                    {reward}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current status - enhanced casino style */}
          <div className="bg-gradient-to-br from-blue-900/50 via-cyan-900/40 to-purple-900/50 border-4 border-cyan-400/70 rounded-[15px] p-6 sm:p-8 text-center shadow-2xl shadow-cyan-500/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-blue-500/20 animate-pulse"></div>
            
            {canClaim ? (
              <>
                <p className="text-base sm:text-lg text-cyan-200 font-black mb-3 relative z-10 drop-shadow-md">
                  🎉 JUTALMAD
                </p>
                {isPremium ? (
                  <div className="space-y-2 mb-3">
                    <p className="text-3xl sm:text-4xl font-black text-cyan-400/50 line-through relative z-10">
                      +{nextReward / 2}
                    </p>
                    <p className="text-5xl sm:text-6xl font-black text-yellow-300 flex items-center justify-center gap-4 drop-shadow-[0_0_20px_rgba(253,224,71,1)] relative z-10 animate-bounce">
                      <Coins className="w-14 h-14 sm:w-16 sm:h-16 animate-spin" style={{ animationDuration: '3s' }} />
                      +{nextReward}
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-200 font-black relative z-10 animate-pulse">
                      🌟 GENIUS TAG VAGY? DUPLA JÁR! 🌟
                    </p>
                  </div>
                ) : (
                  <p className="text-5xl sm:text-6xl font-black text-cyan-300 flex items-center justify-center gap-4 mb-3 drop-shadow-[0_0_20px_rgba(103,232,249,1)] relative z-10 animate-bounce">
                    <Coins className="w-14 h-14 sm:w-16 sm:h-16 animate-spin" style={{ animationDuration: '3s' }} />
                    +{nextReward}
                  </p>
                )}
                <p className="text-xl sm:text-2xl text-white font-black relative z-10 drop-shadow-lg">
                  💰 {nextReward} ARANYÉRME
                </p>
              </>
            ) : (
              <>
                <p className="text-base sm:text-lg text-cyan-200 font-black mb-3 relative z-10">
                  ✅ MAI AJÁNDÉKOD MÁR ÁTVÉVE!
                </p>
                <p className="text-3xl sm:text-4xl font-black text-cyan-300 relative z-10 drop-shadow-lg">
                  🔥 SOROZAT: {weeklyEntryCount} BELÉPÉS 🔥
                </p>
              </>
            )}
          </div>

          {/* Action buttons - responsive */}
          {canClaim ? (
          <div className="space-y-3">
              <button
                onClick={handleClaim}
                className="w-full bg-[hsl(var(--dup-green-500))] hover:bg-[hsl(var(--dup-green-400))] text-white font-black text-lg sm:text-xl py-4 rounded-[12px] border border-[hsl(var(--dup-green-700))] shadow-[0_0_20px_hsl(var(--dup-green-500)/0.6)] transition-all focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)] flex items-center justify-center gap-2"
              >
                <Gift className="w-6 h-6" />
                Felveszem
              </button>
              
              <button
                onClick={onLater}
                className="w-full py-3 text-base sm:text-lg text-[hsl(var(--dup-text-100))] hover:text-[hsl(var(--dup-text-100))] transition-colors font-bold border border-[hsl(var(--dup-gold-600))] bg-transparent hover:bg-[rgba(212,175,55,0.12)] rounded-[12px] focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)]"
              >
                Később
              </button>
            </div>
          ) : (
            <button
              onClick={onLater}
              className="w-full py-4 text-lg font-black text-[hsl(var(--dup-text-100))] border border-[hsl(var(--dup-gold-600))] bg-transparent hover:bg-[rgba(212,175,55,0.12)] rounded-[12px] focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)] transition-all"
            >
              Bezárás
            </button>
          )}

          {/* Info */}
          <p className="text-xs sm:text-sm text-center text-[hsl(var(--dup-text-300))] leading-relaxed">
            A heti számláló hétfő 00:00-kor indul újra.
            {isPremium && (
              <span className="block mt-2 text-yellow-300 font-black animate-pulse">
                🌟 Genius tag vagy! A jutalmad dupla! 🌟
              </span>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
