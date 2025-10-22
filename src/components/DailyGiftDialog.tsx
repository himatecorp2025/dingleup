import { HexagonButton } from './HexagonButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Gift, Coins, Sun, Sparkles, Star, Zap } from 'lucide-react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface DailyGiftDialogProps {
  open: boolean;
  onClaim: () => void;
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
  onLater,
  weeklyEntryCount, 
  nextReward, 
  canClaim,
  isPremium = false 
}: DailyGiftDialogProps) => {
  const isHandheld = usePlatformDetection();

  // Don't render on desktop/laptop
  if (!isHandheld || !open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onLater}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border-4 border-cyan-400/70 shadow-2xl shadow-cyan-500/50 overflow-hidden rounded-[20px]"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' 
        }}
      >
        {/* Casino lights animation - cyan/blue theme */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-90 animate-pulse z-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 opacity-90 animate-pulse z-50" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Floating sparkles - blue/cyan theme */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star className="absolute top-8 left-8 w-8 h-8 text-cyan-300 animate-pulse drop-shadow-[0_0_10px_rgba(103,232,249,0.8)]" style={{ animationDuration: '1.5s' }} />
          <Sparkles className="absolute top-16 right-10 w-6 h-6 text-blue-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <Zap className="absolute bottom-20 left-16 w-7 h-7 text-purple-400 animate-pulse drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
          <Star className="absolute bottom-24 right-12 w-6 h-6 text-pink-400 animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl sm:text-3xl font-black text-center bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            🎁 Napi ajándék 🎁
          </DialogTitle>
          <DialogDescription className="text-center text-base sm:text-lg text-cyan-100 font-bold mt-2">
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
                <p className="text-5xl sm:text-6xl font-black text-cyan-300 flex items-center justify-center gap-4 mb-3 drop-shadow-[0_0_20px_rgba(103,232,249,1)] relative z-10 animate-bounce">
                  <Coins className="w-14 h-14 sm:w-16 sm:h-16 animate-spin" style={{ animationDuration: '3s' }} />
                  +{nextReward}
                </p>
                <p className="text-xl sm:text-2xl text-white font-black relative z-10 drop-shadow-lg">
                  💰 {nextReward} ARANYÉRME {isPremium && '(Genius 2×)'}
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
              <HexagonButton
                variant="yellow"
                size="lg"
                onClick={onClaim}
                className="w-full text-lg sm:text-xl font-black py-4 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
              >
                <Gift className="w-6 h-6 mr-2" />
                Felveszem
              </HexagonButton>
              
              <button
                onClick={onLater}
                className="w-full py-3 text-base sm:text-lg text-cyan-200/80 hover:text-cyan-100 transition-colors font-bold"
              >
                Később
              </button>
            </div>
          ) : (
            <HexagonButton
              variant="outline"
              size="lg"
              onClick={onLater}
              className="w-full text-lg font-black py-4"
            >
              Bezárás
            </HexagonButton>
          )}

          {/* Info */}
          <p className="text-xs sm:text-sm text-center text-cyan-100/70 leading-relaxed">
            A heti számláló hétfő 00:00-kor indul újra.
            {isPremium && ' 🌟 Genius tag vagy? A jutalmad dupla!'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
