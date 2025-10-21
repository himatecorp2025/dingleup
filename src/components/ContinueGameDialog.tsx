import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Clock, X } from "lucide-react";

interface ContinueGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'timeout' | 'wrong' | 'out-of-lives';
  cost: number;
  currentCoins: number;
  onContinue: () => void;
  onExit: () => void;
}

export const ContinueGameDialog = ({
  open,
  onOpenChange,
  type,
  cost,
  currentCoins,
  onContinue,
  onExit
}: ContinueGameDialogProps) => {
  const canAfford = currentCoins >= cost;

  const getTitle = () => {
    switch (type) {
      case 'timeout':
        return 'Lejárt az idő!';
      case 'wrong':
        return 'Rossz válasz!';
      case 'out-of-lives':
        return 'Elfogyott az életed!';
      default:
        return 'Folytatás?';
    }
  };

  const getDescription = () => {
    if (!canAfford) {
      return 'Nincs elegendő aranyérméd a folytatáshoz. Látogass el a boltba!';
    }
    return `Folytathatod a játékot ${cost} aranyérméért, vagy kilépés esetén mentésre kerül a jelenlegi eredményed.`;
  };

  const getIcon = () => {
    switch (type) {
      case 'timeout':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'wrong':
        return <X className="w-6 h-6 text-red-500" />;
      case 'out-of-lives':
        return <span className="text-3xl">💔</span>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {canAfford && (
            <Button onClick={onContinue} className="w-full gap-2">
              <Coins className="w-4 h-4" />
              Folytatás ({cost} aranyérme)
            </Button>
          )}
          <Button variant="outline" onClick={onExit} className="w-full">
            {canAfford ? 'Kilépés és mentés' : 'Vissza a főoldalra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
