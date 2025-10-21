import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Heart } from "lucide-react";

interface InsufficientResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'coins' | 'lives';
  requiredAmount?: number;
  currentAmount?: number;
  onGoToShop: () => void;
}

export const InsufficientResourcesDialog = ({
  open,
  onOpenChange,
  type,
  requiredAmount,
  currentAmount,
  onGoToShop
}: InsufficientResourcesDialogProps) => {
  const Icon = type === 'coins' ? Coins : Heart;
  const title = type === 'coins' ? 'Nincs elegendő aranyérme!' : 'Nincs elegendő élet!';
  const description = requiredAmount && currentAmount !== undefined
    ? `Szükséges: ${requiredAmount}, Jelenleg: ${currentAmount}`
    : 'Látogass el a boltba, hogy több erőforrást szerezz!';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-6 h-6 ${type === 'coins' ? 'text-yellow-500' : 'text-red-500'}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Mégse
          </Button>
          <Button onClick={onGoToShop} className="gap-2">
            Bolt megnyitása
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
