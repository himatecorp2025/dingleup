import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HexagonButton } from './HexagonButton';
import { Gift, Coins, Heart, Sparkles } from 'lucide-react';

interface WelcomeBonusDialogProps {
  open: boolean;
  onClaim: () => Promise<boolean>;
  onLater: () => void;
  claiming: boolean;
}

export const WelcomeBonusDialog = ({ open, onClaim, onLater, claiming }: WelcomeBonusDialogProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'gift' | 'coins'>('gift');

  useEffect(() => {
    if (open) {
      setShowAnimation(true);
      setAnimationPhase('gift');
      
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
      // Dialog will close automatically
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/30 overflow-hidden"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        {/* Casino lights animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Sparkles className="absolute top-10 left-10 w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDuration: '2s' }} />
          <Sparkles className="absolute top-20 right-10 w-4 h-4 text-red-400 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          <Sparkles className="absolute bottom-20 left-20 w-5 h-5 text-purple-400 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
            🎉 Üdv a DingleUP!-ban! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium text-white">
            Örülünk, hogy itt vagy! Az induláshoz ajándékokat adunk:
          </DialogDescription>
        </DialogHeader>

        {/* Animation container */}
        <div className="flex flex-col items-center justify-center py-4">
          {showAnimation && (
            <div className="relative w-full flex items-center justify-center h-24">
              {/* Gift phase */}
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

        {/* Bonus details */}
        <div className="space-y-3 bg-black/80 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-500/50">
          <h3 className="text-center text-sm font-bold mb-2 text-white">
            🎁 Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-sm text-white">Aranyérmék</span>
            </div>
            <span className="text-lg font-black text-white">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg border border-red-500/30">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-sm text-white">Életek</span>
            </div>
            <span className="text-lg font-black text-white">+50</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <HexagonButton
            variant="yellow"
            size="lg"
            onClick={handleClaim}
            disabled={claiming}
            className="w-full text-base font-black"
          >
            {claiming ? '⏳ Feldolgozás...' : '✅ Kérem a bónuszt'}
          </HexagonButton>

          <button
            onClick={onLater}
            disabled={claiming}
            className="w-full py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Később kérem
          </button>
        </div>

        <p className="text-center text-white/70 text-xs">
          A bónusz ingyenes. Nem minősül szerencsejátéknak.
        </p>
      </DialogContent>
    </Dialog>
  );
};
