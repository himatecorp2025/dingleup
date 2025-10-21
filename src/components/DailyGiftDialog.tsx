import { HexagonButton } from './HexagonButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Gift, Coins, Sun } from 'lucide-react';

interface DailyGiftDialogProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  currentStreak: number;
  nextReward: number;
  canClaim: boolean;
}

const DAILY_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DailyGiftDialog = ({ open, onClose, onClaim, currentStreak, nextReward, canClaim }: DailyGiftDialogProps) => {
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-4 border-yellow-500/70 shadow-2xl shadow-yellow-500/50 flex flex-col relative overflow-hidden">
        {/* Casino lights animation - top */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-90 animate-pulse z-50"></div>
        {/* Casino lights animation - bottom */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 opacity-90 animate-pulse z-50" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute top-20 right-10 w-3 h-3 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-5 w-3 h-3 bg-orange-400 rounded-full animate-ping" style={{ animationDuration: '2.2s', animationDelay: '1.5s' }}></div>
        </div>
        
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-black text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            🎰 NAPI AJÁNDÉK 🎰
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm text-yellow-300/90 font-semibold">
            🎲 Jelentkezz be minden nap és szerezz aranyérméket! 🎲
          </DialogDescription>
        </DialogHeader>

        {/* Köszönő Napocska középen */}
        {canClaim && (
          <div className="flex justify-center py-3 sm:py-4">
            <Sun className="w-24 h-24 sm:w-32 sm:h-32 text-yellow-400 animate-pulse drop-shadow-2xl" />
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {/* Streak display */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {DAILY_REWARDS.map((reward, index) => {
              const isCompleted = index < currentStreak;
              const isCurrent = index === currentStreak;
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-1 sm:p-2
                    ${isCompleted ? 'bg-primary/20 border-2 border-primary' : ''}
                    ${isCurrent ? 'bg-primary/10 border-2 border-primary border-dashed' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted border-2 border-border' : ''}
                  `}
                >
                  <span className="text-[10px] sm:text-xs font-bold">{index + 1}</span>
                  <span className="text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                    <Coins className="w-2 h-2 sm:w-3 sm:h-3" />
                    {reward}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current status */}
          <div className="bg-gradient-to-br from-yellow-600/30 via-orange-600/20 to-red-600/30 border-4 border-yellow-500/70 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-2xl shadow-yellow-500/50 relative overflow-hidden">
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-orange-500/20 animate-pulse"></div>
            
            {canClaim ? (
              <>
                <p className="text-xs sm:text-sm text-yellow-200 font-bold mb-2 relative z-10">
                  🎉 {currentStreak + 1}. NAPI AJÁNDÉKOD
                </p>
                <p className="text-4xl sm:text-5xl font-black text-yellow-400 flex items-center justify-center gap-2 sm:gap-3 mb-2 drop-shadow-2xl relative z-10 animate-bounce">
                  <Coins className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" style={{ animationDuration: '3s' }} />
                  +{nextReward}
                </p>
                <p className="text-lg sm:text-xl text-white font-black relative z-10">
                  💰 {nextReward} ARANYÉRME A TIÉD! 💰
                </p>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-yellow-200 font-bold mb-2 relative z-10">
                  ✅ MAI AJÁNDÉKOD MÁR ÁTVÉVE!
                </p>
                <p className="text-2xl sm:text-3xl font-black text-yellow-400 relative z-10">
                  🔥 SOROZAT: {currentStreak} NAP 🔥
                </p>
              </>
            )}
          </div>

          {/* Action button */}
          {canClaim ? (
            <HexagonButton
              variant="yellow"
              size="lg"
              onClick={onClaim}
              className="w-full"
            >
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Köszönöm a napi jutalmat! 🎉
            </HexagonButton>
          ) : (
            <HexagonButton
              variant="outline"
              size="lg"
              onClick={onClose}
              className="w-full"
            >
              Bezárás
            </HexagonButton>
          )}

          {/* Info */}
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
            A sorozat minden hétfőn nullázódik. A 7. nap után újra kezdődik a ciklus.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
