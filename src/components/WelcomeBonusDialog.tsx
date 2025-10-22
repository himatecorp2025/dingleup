import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HexagonButton } from './HexagonButton';
import { Gift, Coins, Heart, Sparkles, Star } from 'lucide-react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface WelcomeBonusDialogProps {
  open: boolean;
  onClaim: () => Promise<boolean>;
  onLater: () => void;
  claiming: boolean;
}

export const WelcomeBonusDialog = ({ open, onClaim, onLater, claiming }: WelcomeBonusDialogProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'gift' | 'coins'>('gift');
  const isHandheld = usePlatformDetection();

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

  // Don't render on desktop/laptop
  if (!isHandheld || !open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e] border-4 border-yellow-500/70 shadow-2xl shadow-yellow-500/50 overflow-hidden rounded-[20px]"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' 
        }}
      >
        {/* Casino lights animation - vibrant colors */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 opacity-90 animate-pulse z-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 opacity-90 animate-pulse z-50" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Animated sparkle stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star className="absolute top-8 left-8 w-8 h-8 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" style={{ animationDuration: '1.5s' }} />
          <Sparkles className="absolute top-16 right-10 w-6 h-6 text-pink-400 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <Star className="absolute bottom-20 left-16 w-7 h-7 text-purple-400 animate-pulse drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
          <Sparkles className="absolute bottom-24 right-12 w-5 h-5 text-orange-400 animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl sm:text-3xl font-black text-center bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            🎉 Üdv a DingleUP!-ban! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base sm:text-lg font-bold text-yellow-100 drop-shadow-md mt-2">
            Örülünk, hogy itt vagy! Az induláshoz ajándékokat adunk:
          </DialogDescription>
        </DialogHeader>

        {/* Animation container */}
        <div className="flex flex-col items-center justify-center py-6 relative z-10">
          {showAnimation && (
            <div className="relative w-full flex items-center justify-center h-32">
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
                    <div className="absolute w-32 h-32 bg-gradient-to-r from-yellow-400/40 via-pink-400/40 to-purple-400/40 blur-3xl animate-spin-slow"></div>
                  </div>
                  <div className="relative animate-bounce z-10">
                    <Gift className="w-24 h-24 text-yellow-300 drop-shadow-[0_0_20px_rgba(253,224,71,1)]" strokeWidth={2.5} />
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
                    <div className="absolute w-40 h-40 bg-gradient-to-r from-yellow-300/50 via-orange-400/60 to-pink-400/50 blur-3xl rounded-full animate-pulse"></div>
                  </div>
                  <Coins className="w-28 h-28 text-yellow-300 drop-shadow-[0_0_25px_rgba(253,224,71,1)] animate-scale-in relative z-10" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details - Enhanced casino style */}
        <div className="space-y-4 bg-black/70 backdrop-blur-md rounded-[15px] p-5 border-4 border-yellow-400/60 relative z-10 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
          <h3 className="text-center text-lg sm:text-xl font-black mb-3 text-yellow-300 drop-shadow-lg">
            🎁 Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-[12px] border-2 border-yellow-400/50 shadow-lg">
            <div className="flex items-center gap-3">
              <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300 drop-shadow-md" />
              <span className="font-black text-base sm:text-lg text-white drop-shadow-md">Aranyérmék</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-yellow-200 drop-shadow-lg">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-[12px] border-2 border-red-400/50 shadow-lg">
            <div className="flex items-center gap-3">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-red-400 drop-shadow-md" />
              <span className="font-black text-base sm:text-lg text-white drop-shadow-md">Életek</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-red-200 drop-shadow-lg">+50</span>
          </div>
        </div>

        {/* Buttons - Responsive */}
        <div className="space-y-3 mt-4 relative z-10">
          <HexagonButton
            variant="yellow"
            size="lg"
            onClick={handleClaim}
            disabled={claiming}
            className="w-full text-lg sm:text-xl font-black py-4 shadow-[0_0_20px_rgba(234,179,8,0.6)]"
          >
            {claiming ? '⏳ Feldolgozás...' : '✅ Kérem a bónuszt'}
          </HexagonButton>

          <button
            onClick={onLater}
            disabled={claiming}
            className="w-full py-3 text-base sm:text-lg text-yellow-200/80 hover:text-yellow-100 transition-colors font-bold"
          >
            Később kérem
          </button>
        </div>

        <p className="text-center text-yellow-100/70 text-xs sm:text-sm mt-3 relative z-10">
          ⭐ A bónusz ingyenes. Nem minősül szerencsejátéknak. ⭐
        </p>
      </DialogContent>
    </Dialog>
  );
};
