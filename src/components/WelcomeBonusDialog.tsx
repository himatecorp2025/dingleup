import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HexagonButton } from './HexagonButton';
import { Gift, Coins, Heart, Zap } from 'lucide-react';

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
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
            🎉 ÜDVÖZLŐ BÓNUSZ! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium text-white">
            Köszönjük, hogy csatlakoztál! 🎁
          </DialogDescription>
        </DialogHeader>

        {/* Animation container - KOMPAKT */}
        <div className="flex flex-col items-center justify-center py-2">
          {showAnimation && (
            <div className="relative w-full flex items-center justify-center h-32">
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
                    <div className="absolute w-24 h-24 bg-gradient-to-r from-yellow-500/20 via-yellow-300/30 to-yellow-500/20 blur-2xl animate-spin-slow"></div>
                  </div>
                  <div className="relative animate-bounce z-10">
                    <Gift className="w-20 h-20 text-yellow-400 drop-shadow-2xl" strokeWidth={2.5} />
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
                    <div className="absolute w-32 h-32 bg-gradient-to-r from-yellow-400/30 via-orange-400/40 to-yellow-400/30 blur-2xl rounded-full animate-pulse"></div>
                  </div>
                  <Coins className="w-24 h-24 text-yellow-400 drop-shadow-2xl animate-scale-in relative z-10" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details - KOMPAKT */}
        <div className="space-y-2 bg-black/80 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-500/50">
          <h3 className="text-center text-sm font-bold mb-2 text-white">
            🎁 Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-sm text-white">Aranyérmék</span>
            </div>
            <span className="text-xl font-black text-white">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-sm text-white">Életek</span>
            </div>
            <span className="text-xl font-black text-white">+50</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="font-bold text-sm text-white">DingleSpeed</span>
            </div>
            <span className="text-xl font-black text-white">+1</span>
          </div>
        </div>

        {/* Claim button - BOOSTER STÍLUS */}
        <HexagonButton
          variant="yellow"
          size="lg"
          onClick={handleClaim}
          disabled={claiming}
          className="w-full text-lg font-black text-black"
        >
          {claiming ? '⏳ Feldolgozás...' : '✅ ELFOGADOM! 🎉'}
        </HexagonButton>

        <p className="text-center text-white/70 text-xs">
          ⭐ Egyszer kapható meg ⭐
        </p>
      </DialogContent>
    </Dialog>
  );
};
