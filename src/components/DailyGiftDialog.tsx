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
  isPremium?: boolean;
}

const DAILY_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DailyGiftDialog = ({ open, onClose, onClaim, currentStreak, nextReward, canClaim, isPremium = false }: DailyGiftDialogProps) => {
  const actualReward = isPremium ? nextReward * 2 : nextReward;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-purple-500/30 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            Napi Ajándék 🎁
            {isPremium && <span className="ml-2">💎</span>}
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm text-purple-300">
            {isPremium ? 'Prémium tag - Dupla jutalmak!' : 'Jelentkezz be minden nap és szerezz aranyérméket!'}
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
              const displayReward = isPremium ? reward * 2 : reward;
              
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
                    {displayReward}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current status */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-2 border-purple-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
            {canClaim ? (
              <>
                <p className="text-xs sm:text-sm text-purple-300 mb-2">
                  {currentStreak + 1}. napi ajándékod {isPremium && '(x2 Prémium Bónusz!)'}
                </p>
                <p className="text-3xl sm:text-4xl font-black text-yellow-400 flex items-center justify-center gap-2 sm:gap-3 mb-2">
                  <Coins className="w-8 h-8 sm:w-10 sm:h-10" />
                  +{actualReward}
                </p>
                <p className="text-base sm:text-lg text-white font-bold">
                  {actualReward} aranyérme a tiéd!
                </p>
                {isPremium && (
                  <p className="text-xs text-green-400 mt-2">
                    ✓ Prémium előfizetés aktív - Dupla jutalmak!
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-purple-300 mb-2">
                  Mai ajándékod már átvéve!
                </p>
                <p className="text-xl sm:text-2xl font-black text-white">
                  Sorozat: {currentStreak} nap
                </p>
              </>
            )}
          </div>

          {/* Premium subscription promo - only if not premium */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-purple-600/20 border border-yellow-500/50 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold text-yellow-400 mb-1">💎 Legyél Prémium Tag! 💎</p>
              <p className="text-[10px] sm:text-xs text-white/90 leading-relaxed">
                Csak <span className="font-bold text-yellow-300">$2.99/hó</span> (~$0.09/nap)<br/>
                <span className="font-bold text-green-400">Dupla napi jutalmak</span> + 
                <span className="font-bold text-red-400"> 30 max élet</span>!
              </p>
            </div>
          )}

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
