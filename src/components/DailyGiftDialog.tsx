import { HexagonButton } from './HexagonButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Gift, Coins, Sun, Sparkles } from 'lucide-react';

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
  
  return (
    <Dialog open={open} onOpenChange={onLater}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-4 border-yellow-500/70 shadow-2xl shadow-yellow-500/50 overflow-hidden"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        {/* Casino lights animation */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-90 animate-pulse z-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 opacity-90 animate-pulse z-50" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Sparkles className="absolute top-10 left-10 w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDuration: '2s' }} />
          <Sparkles className="absolute top-20 right-10 w-4 h-4 text-red-400 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          <Sparkles className="absolute bottom-20 left-20 w-5 h-5 text-purple-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            🎁 Napi ajándék 🎁
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-yellow-300/90 font-semibold">
            Ez a(z) {weeklyEntryCount + 1}. belépésed ezen a héten.
          </DialogDescription>
        </DialogHeader>

        {/* Sun icon if can claim */}
        {canClaim && (
          <div className="flex justify-center py-4">
            <Sun className="w-32 h-32 text-yellow-400 animate-pulse drop-shadow-2xl" />
          </div>
        )}

        <div className="space-y-4">
          {/* Streak display */}
          <div className="grid grid-cols-7 gap-2">
            {DAILY_REWARDS.map((reward, index) => {
              const isCompleted = index < weeklyEntryCount;
              const isCurrent = index === weeklyEntryCount;
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center p-2
                    ${isCompleted ? 'bg-yellow-500/30 border-2 border-yellow-500' : ''}
                    ${isCurrent ? 'bg-yellow-500/20 border-2 border-yellow-500 border-dashed animate-pulse' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-800 border-2 border-gray-600' : ''}
                  `}
                >
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                  <span className="text-xs flex items-center gap-1 text-white">
                    <Coins className="w-3 h-3" />
                    {reward}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current status */}
          <div className="bg-gradient-to-br from-yellow-600/30 via-orange-600/20 to-red-600/30 border-4 border-yellow-500/70 rounded-2xl p-6 text-center shadow-2xl shadow-yellow-500/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-orange-500/20 animate-pulse"></div>
            
            {canClaim ? (
              <>
                <p className="text-sm text-yellow-200 font-bold mb-2 relative z-10">
                  🎉 Jutalmad
                </p>
                <p className="text-5xl font-black text-yellow-400 flex items-center justify-center gap-3 mb-2 drop-shadow-2xl relative z-10 animate-bounce">
                  <Coins className="w-12 h-12 animate-spin" style={{ animationDuration: '3s' }} />
                  +{nextReward}
                </p>
                <p className="text-xl text-white font-black relative z-10">
                  💰 {nextReward} ARANYÉRME {isPremium && '(Genius 2x)'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-yellow-200 font-bold mb-2 relative z-10">
                  ✅ MAI AJÁNDÉKOD MÁR ÁTVÉVE!
                </p>
                <p className="text-3xl font-black text-yellow-400 relative z-10">
                  🔥 SOROZAT: {weeklyEntryCount} BELÉPÉS 🔥
                </p>
              </>
            )}
          </div>

          {/* Action buttons */}
          {canClaim ? (
            <div className="space-y-2">
              <HexagonButton
                variant="yellow"
                size="lg"
                onClick={onClaim}
                className="w-full"
              >
                <Gift className="w-5 h-5 mr-2" />
                Felveszem
              </HexagonButton>
              
              <button
                onClick={onLater}
                className="w-full py-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                Később
              </button>
            </div>
          ) : (
            <HexagonButton
              variant="outline"
              size="lg"
              onClick={onLater}
              className="w-full"
            >
              Bezárás
            </HexagonButton>
          )}

          {/* Info */}
          <p className="text-xs text-center text-white/70">
            A heti számláló hétfő 00:00-kor indul újra.
            {isPremium && ' Genius tag vagy? A jutalmad dupla!'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
