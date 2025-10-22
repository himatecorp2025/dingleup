import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HexagonButton } from './HexagonButton';
import { Gift, Coins, Heart } from 'lucide-react';

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
      
      // Transition to coins phase after 1s
      const timer = setTimeout(() => {
        setAnimationPhase('coins');
      }, 1000);

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
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-[95vw] max-w-md h-auto max-h-[70vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/30 flex flex-col relative overflow-hidden">
        {/* Casino lights animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-bold text-center bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
            🎉 ÜDVÖZLŐ BÓNUSZ! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-[10px] sm:text-xs font-medium text-white">
            Köszönjük, hogy csatlakoztál! 🎁
          </DialogDescription>
        </DialogHeader>

        {/* Animation container - KOMPAKT */}
        <div className="flex flex-col items-center justify-center py-1 flex-shrink-0">
          {showAnimation && (
            <div className="relative w-full flex items-center justify-center h-20 sm:h-24">
              {/* Chest phase */}
              <div 
                className={`transition-all duration-1000 ${
                  animationPhase === 'gift' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-yellow-500/20 via-yellow-300/30 to-yellow-500/20 blur-2xl animate-spin-slow"></div>
                  </div>
                  <div className="relative animate-bounce z-10">
                    <Gift className="w-14 h-14 sm:w-20 sm:h-20 text-yellow-400 drop-shadow-2xl" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Coins explosion phase */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
                  animationPhase === 'coins' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-yellow-400/30 via-orange-400/40 to-yellow-400/30 blur-2xl rounded-full animate-pulse"></div>
                  </div>
                  <Coins className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-400 drop-shadow-2xl animate-scale-in relative z-10" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details - KOMPAKT - stays within viewport */}
        <div className="space-y-1 sm:space-y-1.5 bg-black/80 backdrop-blur-sm rounded-lg p-2 sm:p-3 border-2 border-yellow-500/50 flex-shrink-0">
          <h3 className="text-center text-[10px] sm:text-xs font-bold mb-1 text-white">
            🎁 Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-1 sm:p-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span className="font-bold text-[10px] sm:text-xs text-white">Aranyérmék</span>
            </div>
            <span className="text-sm sm:text-base font-black text-white">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-1 sm:p-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              <span className="font-bold text-[10px] sm:text-xs text-white">Életek</span>
            </div>
            <span className="text-sm sm:text-base font-black text-white">+50</span>
          </div>
        </div>

        {/* Claim button */}
        <HexagonButton
          variant="yellow"
          size="lg"
          onClick={handleClaim}
          disabled={claiming}
          className="w-full text-sm sm:text-base font-black py-1.5 sm:py-2 flex-shrink-0"
        >
          {claiming ? '⏳ Feldolgozás...' : '✅ ELFOGADOM! 🎉'}
        </HexagonButton>

        <p className="text-center text-white/70 text-[9px] sm:text-[10px] flex-shrink-0">
          ⭐ Egyszer kapható meg ⭐
        </p>
      </DialogContent>
    </Dialog>
  );
};
