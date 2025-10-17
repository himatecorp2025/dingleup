import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Gift, Coins } from 'lucide-react';

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Napi ajándék
          </DialogTitle>
          <DialogDescription>
            Jelentkezz be minden nap és szerezz aranyérméket!
          </DialogDescription>
        </DialogHeader>

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
          <div className="bg-accent/50 rounded-xl p-4 text-center">
            {canClaim ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  {currentStreak + 1}. napi ajándékod
                </p>
                <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                  <Coins className="w-8 h-8" />
                  +{nextReward}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Mai ajándékod már átvéve!
                </p>
                <p className="text-lg font-bold">
                  Sorozat: {currentStreak} nap
                </p>
              </>
            )}
          </div>

          {/* Action button */}
          {canClaim ? (
            <Button onClick={onClaim} className="w-full" size="lg">
              <Gift className="w-5 h-5 mr-2" />
              Átveszem!
            </Button>
          ) : (
            <Button onClick={onClose} variant="outline" className="w-full">
              Bezárás
            </Button>
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
