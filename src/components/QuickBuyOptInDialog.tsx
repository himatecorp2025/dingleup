import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap } from 'lucide-react';

interface QuickBuyOptInDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function QuickBuyOptInDialog({ open, onAccept, onDecline }: QuickBuyOptInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900 to-blue-900 border-yellow-400">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-400 text-xl">
            <Zap className="w-6 h-6" />
            Gyorsvásárlás bekapcsolása
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-black/30 rounded-lg border border-yellow-400/30">
            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-200 space-y-2">
              <p className="font-semibold text-white">
                Azonnali teljesítést kérek, és tudomásul veszem, hogy a 14 napos elállási jog a teljesítés megkezdését követően nem gyakorolható.
              </p>
              <p>
                A megrendelés fizetési kötelezettséggel jár.
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-300 space-y-2">
            <p>
              A Gyorsvásárlás aktiválásával az első vásárlás után minden további vásárlás egyetlen gombnyomással történhet, külön űrlap nélkül.
            </p>
            <p className="text-xs text-gray-400">
              A funkció bármikor kikapcsolható a Profil menüben.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={onDecline}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Nem most
          </Button>
          <Button 
            onClick={onAccept}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
          >
            Elfogadom és bekapcsolom a Gyorsvásárlást
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}