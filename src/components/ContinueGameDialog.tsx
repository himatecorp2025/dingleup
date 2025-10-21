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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e] border-2 border-purple-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base text-white/80 pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
          {canAfford && (
            <Button 
              onClick={onContinue} 
              className="w-full gap-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white"
            >
              <Coins className="w-4 h-4" />
              Folytatás ({cost} aranyérme)
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onExit} 
            className="w-full border-white/30 text-white hover:bg-white/10"
          >
            {canAfford ? 'Kilépés és mentés' : 'Vissza a főoldalra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
