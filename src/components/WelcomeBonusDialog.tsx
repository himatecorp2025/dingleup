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
      <DialogContent className="max-w-lg bg-gradient-to-br from-primary/20 via-background to-accent/20 border-2 border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Helló! Szia! 👋
          </DialogTitle>
          <DialogDescription className="text-center text-xl font-medium mt-2">
            Örülünk, hogy itt vagy! Ezért megjutalmazunk! 🎁
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
                <div className="relative">
                  <Gift className="w-32 h-32 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                </div>
              </div>

              {/* Coins phase */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-600 ${
                  animationPhase === 'coins' 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                <Coins className="w-32 h-32 text-yellow-500 mx-auto drop-shadow-2xl animate-scale-in" />
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
