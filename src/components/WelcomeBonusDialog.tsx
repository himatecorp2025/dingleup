import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HexagonButton } from './HexagonButton';
import { Gift, Coins, RotateCcw } from 'lucide-react';

interface WelcomeBonusDialogProps {
  open: boolean;
  onClaim: () => Promise<boolean>;
  claiming: boolean;
}

export const WelcomeBonusDialog = ({ open, onClaim, claiming }: WelcomeBonusDialogProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'gift' | 'coins'>('gift');

  useEffect(() => {
    if (open) {
      setShowAnimation(true);
      setAnimationPhase('gift');
      
      // Transition to coins phase after 0.6s
      const timer = setTimeout(() => {
        setAnimationPhase('coins');
      }, 600);

      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [open]);

  const handleClaim = async () => {
    const success = await onClaim();
    if (success) {
      // Dialog will close automatically as open prop changes
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/95 to-blue-900/95 border-4 border-yellow-500">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-center text-yellow-400 mb-2">
            🎉 Üdvözlünk a DingleUP-ban! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-white text-lg">
            Első bejelentkezési bónuszod:
          </DialogDescription>
        </DialogHeader>

        {/* Animation container */}
        <div className="flex flex-col items-center justify-center py-8 min-h-[200px]">
          {showAnimation && (
            <div className="relative">
              {/* Gift phase */}
              <div 
                className={`transition-all duration-600 ${
                  animationPhase === 'gift' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <Gift className="w-32 h-32 text-yellow-400 animate-pulse" />
              </div>

              {/* Coins phase */}
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-600 ${
                  animationPhase === 'coins' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <div className="flex items-center gap-3 mb-4 animate-scale-in">
                  <Coins className="w-16 h-16 text-yellow-400" />
                  <span className="text-5xl font-black text-yellow-400">+2500</span>
                </div>
                <div className="flex items-center gap-3 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <RotateCcw className="w-12 h-12 text-purple-400" />
                  <span className="text-3xl font-black text-purple-400">+1</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details */}
        <div className="space-y-3 mb-6">
          <div className="bg-yellow-500/20 rounded-xl p-4 border-2 border-yellow-500/50 text-center">
            <p className="text-yellow-300 font-bold text-lg">2500 aranyérme 🪙</p>
            <p className="text-white/70 text-sm">Használd fel a játékban és a boltban!</p>
          </div>
          <div className="bg-purple-500/20 rounded-xl p-4 border-2 border-purple-500/50 text-center">
            <p className="text-purple-300 font-bold text-lg">1× Kérdéscsere 🔄</p>
            <p className="text-white/70 text-sm">Cseréld ki a nehéz kérdéseket!</p>
          </div>
        </div>

        {/* Claim button */}
        <HexagonButton
          variant="yellow"
          size="lg"
          onClick={handleClaim}
          disabled={claiming}
          className="w-full animate-fade-in"
        >
          {claiming ? 'Feldolgozás...' : 'Felveszem! 🎁'}
        </HexagonButton>

        <p className="text-center text-white/50 text-xs mt-2">
          Ez az ajándék csak egyszer kapható meg
        </p>
      </DialogContent>
    </Dialog>
  );
};
