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
      <DialogContent className="max-w-none w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent animate-fade-in">
            🎉 ÜDVÖZLŐ BÓNUSZ! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-xl font-medium mt-2 text-white">
            Köszönjük, hogy csatlakoztál hozzánk! Itt van a jutalmad! 🎁
          </DialogDescription>
        </DialogHeader>

        {/* Animation container - KASZINÓ STÍLUSÚ ANIMÁCIÓ */}
        <div className="flex flex-col items-center justify-center py-6 min-h-[200px]">
          {showAnimation && (
            <div className="relative w-full flex items-center justify-center">
              {/* Chest phase - Robbanó aranyláda */}
              <div 
                className={`transition-all duration-1000 ${
                  animationPhase === 'gift' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <div className="relative">
                  {/* Fénycsóvák a háttérben */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-48 h-48 bg-gradient-to-r from-yellow-500/20 via-yellow-300/30 to-yellow-500/20 blur-3xl animate-spin-slow"></div>
                  </div>
                  
                  {/* Láda középen */}
                  <div className="relative animate-bounce z-10">
                    <Gift className="w-32 h-32 text-yellow-400 drop-shadow-2xl" strokeWidth={2.5} />
                    <div className="absolute inset-0 bg-yellow-400/50 blur-3xl rounded-full animate-pulse" />
                  </div>
                  
                  {/* Repülő aranyérmék minden irányba */}
                  <div className="absolute -top-4 -right-4 animate-bounce delay-100">
                    <Coins className="w-14 h-14 text-yellow-300 drop-shadow-xl" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 animate-bounce delay-200">
                    <Coins className="w-12 h-12 text-yellow-400 drop-shadow-xl" />
                  </div>
                  <div className="absolute top-1/2 -right-6 animate-bounce delay-300">
                    <Coins className="w-10 h-10 text-yellow-300 drop-shadow-xl" />
                  </div>
                  <div className="absolute top-1/4 -left-5 animate-bounce delay-150">
                    <Coins className="w-11 h-11 text-yellow-400 drop-shadow-xl" />
                  </div>
                </div>
              </div>

              {/* Coins explosion phase - Hatalmas aranyérme zápor */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
                  animationPhase === 'coins' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <div className="relative">
                  {/* Fénykör a háttérben */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-64 h-64 bg-gradient-to-r from-yellow-400/30 via-orange-400/40 to-yellow-400/30 blur-3xl rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Nagy aranyérme középen */}
                  <Coins className="w-40 h-40 text-yellow-400 drop-shadow-2xl animate-scale-in relative z-10" strokeWidth={2.5} />
                  
                  {/* Csillogó effektek */}
                  <div className="absolute inset-0 bg-yellow-400/60 blur-3xl rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details */}
        <div className="space-y-3 bg-black/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20 mb-6 text-white">
          <h3 className="text-center text-lg font-bold mb-4 text-yellow-400">
            🎁 Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-500" />
              <span className="font-bold text-lg text-white">Aranyérmék</span>
            </div>
            <span className="text-3xl font-black text-white">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="font-bold text-lg text-white">Életek</span>
            </div>
            <span className="text-3xl font-black text-white">+50</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-500" />
              <span className="font-bold text-lg text-white">DingleSpeed Booster</span>
            </div>
            <span className="text-3xl font-black text-white">+1</span>
          </div>
        </div>

        {/* Claim button */}
        <HexagonButton
          variant="yellow"
          size="lg"
          onClick={handleClaim}
          disabled={claiming}
          className="w-full px-12 py-4 text-xl font-black transform hover:scale-110 transition-all shadow-2xl shadow-yellow-500/50 animate-pulse"
        >
          {claiming ? '⏳ Feldolgozás...' : '✅ ELFOGADOM! 🎉'}
        </HexagonButton>

        <p className="text-center text-white/70 text-xs mt-2">
          ⭐ Ez az ajándék csak egyszer kapható meg ⭐
        </p>
      </DialogContent>
    </Dialog>
  );
};
