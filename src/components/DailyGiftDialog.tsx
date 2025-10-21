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
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[70vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-purple-500/30 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            Napi Ajándék 🎁
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm text-purple-300">
            Jelentkezz be minden nap és szerezz aranyérméket!
          </DialogDescription>
        </DialogHeader>

        {/* Köszönő Napocska középen */}
        {canClaim && (
          <div className="flex justify-center py-4">
            <Sun className="w-32 h-32 text-yellow-400 animate-pulse drop-shadow-2xl" />
          </div>
        )}

        <div className="space-y-4">
          {/* Streak display */}
          <div className="grid grid-cols-7 gap-2">
            {DAILY_REWARDS.map((reward, index) => {
              const isCompleted = index < currentStreak;
              const isCurrent = index === currentStreak;
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center p-2
                    ${isCompleted ? 'bg-primary/20 border-2 border-primary' : ''}
                    ${isCurrent ? 'bg-primary/10 border-2 border-primary border-dashed' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted border-2 border-border' : ''}
                  `}
                >
                  <span className="text-xs font-bold">{index + 1}</span>
                  <span className="text-xs flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    {reward}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current status */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-2 border-purple-500/50 rounded-2xl p-6 text-center">
            {canClaim ? (
              <>
                <p className="text-sm text-purple-300 mb-2">
                  {currentStreak + 1}. napi ajándékod
                </p>
                <p className="text-4xl font-black text-yellow-400 flex items-center justify-center gap-3 mb-2">
                  <Coins className="w-10 h-10" />
                  +{nextReward}
                </p>
                <p className="text-lg text-white font-bold">
                  {nextReward} aranyérme a tiéd!
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-purple-300 mb-2">
                  Mai ajándékod már átvéve!
                </p>
                <p className="text-2xl font-black text-white">
                  Sorozat: {currentStreak} nap
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
              <Gift className="w-5 h-5 mr-2" />
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
          <p className="text-xs text-center text-muted-foreground">
            A sorozat minden hétfőn nullázódik. A 7. nap után újra kezdődik a ciklus.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
