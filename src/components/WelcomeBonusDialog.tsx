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
    <Dialog open={open}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-primary/20 via-background to-accent/20 border-2 border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Helló! Szia! 👋
          </DialogTitle>
          <DialogDescription className="text-center text-xl font-medium mt-2">
            Örülünk, hogy itt vagy! Ezért megjutalmazunk! 🎁
          </DialogDescription>
        </DialogHeader>

        {/* Animation container - Aranyérmével teli láda */}
        <div className="flex flex-col items-center justify-center py-8 min-h-[250px]">
          {showAnimation && (
            <div className="relative w-full flex items-center justify-center">
              {/* Chest phase - animált láda aranyérmékkel */}
              <div 
                className={`transition-all duration-1000 ${
                  animationPhase === 'gift' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <div className="relative">
                  {/* Láda */}
                  <div className="relative animate-bounce">
                    <Gift className="w-40 h-40 text-yellow-500" strokeWidth={2} />
                    <div className="absolute inset-0 bg-yellow-500/30 blur-3xl rounded-full animate-pulse" />
                  </div>
                  {/* Aranyérmék körülötte */}
                  <div className="absolute -top-2 -right-2 animate-pulse">
                    <Coins className="w-12 h-12 text-yellow-400" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 animate-pulse delay-75">
                    <Coins className="w-10 h-10 text-yellow-400" />
                  </div>
                  <div className="absolute top-1/2 -right-4 animate-pulse delay-150">
                    <Coins className="w-8 h-8 text-yellow-400" />
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
                  <Coins className="w-40 h-40 text-yellow-500 drop-shadow-2xl animate-scale-in" />
                  <div className="absolute inset-0 bg-yellow-500/40 blur-3xl rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details */}
        <div className="space-y-3 bg-gradient-to-br from-background/90 to-background/70 rounded-2xl p-6 border-2 border-primary/30 shadow-2xl mb-6">
          <h3 className="text-center text-lg font-bold mb-4 text-primary">
            Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-yellow-500" />
              <span className="font-bold text-lg">Aranyérmék</span>
            </div>
            <span className="text-3xl font-black text-yellow-500">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="font-bold text-lg">Életek</span>
            </div>
            <span className="text-3xl font-black text-red-500">+50</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-500" />
              <span className="font-bold text-lg">DingleSpeed Booster</span>
            </div>
            <span className="text-3xl font-black text-purple-500">+1</span>
          </div>
        </div>

        {/* Claim button */}
        <HexagonButton
          variant="yellow"
          size="lg"
          onClick={handleClaim}
          disabled={claiming}
          className="w-full px-12 py-4 text-xl font-bold transform hover:scale-110 transition-transform shadow-2xl animate-fade-in"
        >
          {claiming ? 'Feldolgozás...' : 'Átveszem! 🎉'}
        </HexagonButton>

        <p className="text-center text-muted-foreground text-xs mt-2">
          Ez az ajándék csak egyszer kapható meg
        </p>
      </DialogContent>
    </Dialog>
  );
};
