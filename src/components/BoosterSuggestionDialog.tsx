import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Zap, X } from 'lucide-react';

interface BoosterSuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  onActivate: () => void;
  boosterCount: number;
}

export const BoosterSuggestionDialog = ({ open, onClose, onActivate, boosterCount }: BoosterSuggestionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-6 h-6 text-yellow-500" />
            Van Speed Boostered!
          </DialogTitle>
          <DialogDescription>
            {boosterCount} használható booster vár aktiválásra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 text-center">
            <Zap className="w-16 h-16 mx-auto mb-3 text-yellow-500" />
            <p className="text-lg font-medium mb-2">
              Aktiválod most a boosteredet?
            </p>
            <p className="text-sm text-muted-foreground">
              Gyorsabb élet regenerálás 60 percig!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                onActivate();
                onClose();
              }}
              className="w-full"
              size="lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Aktiválom
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <X className="w-4 h-4 mr-2" />
              Később
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
