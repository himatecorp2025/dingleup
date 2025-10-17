import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Zap, Clock } from 'lucide-react';
import { UserBooster } from '@/types/game';

interface BoosterActivationDialogProps {
  open: boolean;
  onClose: () => void;
  boosters: UserBooster[];
  onActivate: (boosterId: string) => void;
}

const BOOSTER_INFO = {
  DoubleSpeed: { multiplier: '2×', color: 'from-blue-500 to-cyan-500' },
  MegaSpeed: { multiplier: '4×', color: 'from-purple-500 to-pink-500' },
  GigaSpeed: { multiplier: '12×', color: 'from-orange-500 to-red-500' },
  DingleSpeed: { multiplier: '24×', color: 'from-yellow-500 to-orange-500' }
};

export const BoosterActivationDialog = ({ open, onClose, boosters, onActivate }: BoosterActivationDialogProps) => {
  const availableBoosters = boosters.filter(b => !b.activated);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-6 h-6 text-yellow-500" />
            Speed Booster Aktiválás
          </DialogTitle>
          <DialogDescription>
            Válassz egy boostert a gyorsabb élet regeneráláshoz!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {availableBoosters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nincs elérhető boostered.</p>
              <p className="text-sm mt-1">Vásárolj a Shopban!</p>
            </div>
          ) : (
            availableBoosters.map((booster) => {
              const info = BOOSTER_INFO[booster.booster_type];
              return (
                <div
                  key={booster.id}
                  className={`
                    relative overflow-hidden rounded-xl p-4 
                    bg-gradient-to-r ${info.color}
                    text-white shadow-lg
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{booster.booster_type}</h3>
                      <p className="text-sm opacity-90 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {info.multiplier} sebesség
                      </p>
                      <p className="text-xs opacity-75 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        60 perc
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        onActivate(booster.id);
                        onClose();
                      }}
                      variant="secondary"
                      size="sm"
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      Aktiválás
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button onClick={onClose} variant="outline" className="w-full">
          Bezárás
        </Button>
      </DialogContent>
    </Dialog>
  );
};
