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
        className="w-[95vw] max-w-md bg-[hsl(var(--dup-ui-bg-900))] border-2 border-[hsl(var(--dup-gold-600))] shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_20px_hsl(var(--dup-gold-500)/0.18)] overflow-hidden rounded-[20px]"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' 
        }}
      >
        {/* Gold shimmer border animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--dup-gold-400))] to-transparent opacity-80 animate-shimmer"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--dup-gold-400))] to-transparent opacity-80 animate-shimmer" style={{ animationDelay: '1s' }}></div>
        
        {/* Animated sparkle stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star className="absolute top-8 left-8 w-8 h-8 text-[hsl(var(--dup-gold-400))] animate-pulse drop-shadow-[0_0_10px_hsl(var(--dup-gold-500))]" style={{ animationDuration: '1.5s' }} />
          <Sparkles className="absolute top-16 right-10 w-6 h-6 text-[hsl(var(--dup-gold-300))] animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <Star className="absolute bottom-20 left-16 w-7 h-7 text-[hsl(var(--dup-gold-500))] animate-pulse drop-shadow-[0_0_10px_hsl(var(--dup-gold-400))]" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
          <Sparkles className="absolute bottom-24 right-12 w-5 h-5 text-[hsl(var(--dup-gold-400))] animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl sm:text-3xl font-black text-center bg-gradient-to-r from-[hsl(var(--dup-gold-300))] via-[hsl(var(--dup-gold-500))] to-[hsl(var(--dup-gold-300))] bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            🎉 Üdv a DingleUP!-ban! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base sm:text-lg font-bold text-[hsl(var(--dup-text-100))] drop-shadow-md mt-2">
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
                    <div className="absolute w-32 h-32 bg-gradient-to-r from-[hsl(var(--dup-gold-500)/0.4)] via-[hsl(var(--dup-gold-400)/0.4)] to-[hsl(var(--dup-gold-500)/0.4)] blur-3xl animate-spin-slow"></div>
                  </div>
                  <div className="relative animate-bounce z-10">
                    <Gift className="w-24 h-24 text-[hsl(var(--dup-gold-400))] drop-shadow-[0_0_20px_hsl(var(--dup-gold-500))]" strokeWidth={2.5} />
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
                    <div className="absolute w-40 h-40 bg-gradient-to-r from-[hsl(var(--dup-gold-400)/0.5)] via-[hsl(var(--dup-gold-500)/0.6)] to-[hsl(var(--dup-gold-400)/0.5)] blur-3xl rounded-full animate-pulse"></div>
                  </div>
                  <Coins className="w-28 h-28 text-[hsl(var(--dup-gold-400))] drop-shadow-[0_0_25px_hsl(var(--dup-gold-500))] animate-scale-in relative z-10" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bonus details - Casino style with gold theme */}
        <div className="space-y-4 bg-black/70 backdrop-blur-md rounded-[15px] p-5 border-2 border-[hsl(var(--dup-gold-600)/0.6)] relative z-10 shadow-[0_0_30px_hsl(var(--dup-gold-500)/0.4)]">
          <h3 className="text-center text-lg sm:text-xl font-black mb-3 text-[hsl(var(--dup-gold-300))] drop-shadow-lg">
            🎁 Regisztrációs Bónuszod:
          </h3>
          
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-[hsl(var(--dup-gold-500)/0.25)] to-[hsl(var(--dup-gold-400)/0.25)] rounded-[12px] border-2 border-[hsl(var(--dup-gold-500)/0.5)] shadow-lg">
            <div className="flex items-center gap-3">
              <Coins className="w-7 h-7 sm:w-8 sm:h-8 text-[hsl(var(--dup-gold-400))] drop-shadow-md" />
              <span className="font-black text-base sm:text-lg text-[hsl(var(--dup-text-100))] drop-shadow-md">Aranyérmék</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[hsl(var(--dup-gold-300))] drop-shadow-lg">+2,500</span>
          </div>
          
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-[hsl(var(--dup-crimson-600)/0.25)] to-[hsl(var(--dup-crimson-500)/0.25)] rounded-[12px] border-2 border-[hsl(var(--dup-crimson-500)/0.5)] shadow-lg">
            <div className="flex items-center gap-3">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-[hsl(var(--dup-crimson-400))] drop-shadow-md" />
              <span className="font-black text-base sm:text-lg text-[hsl(var(--dup-text-100))] drop-shadow-md">Életek</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-[hsl(var(--dup-crimson-400))] drop-shadow-lg">+50</span>
          </div>
        </div>

        {/* Buttons - Using casino green for primary CTA */}
        <div className="space-y-3 mt-4 relative z-10">
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full bg-[hsl(var(--dup-green-500))] hover:bg-[hsl(var(--dup-green-400))] disabled:bg-[hsl(var(--dup-green-300))] text-white font-black text-lg sm:text-xl py-4 rounded-[12px] border-2 border-[hsl(var(--dup-green-700))] shadow-[0_0_20px_hsl(var(--dup-green-500)/0.6)] transition-all focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)]"
          >
            {claiming ? '⏳ Feldolgozás...' : '✅ Kérem a bónuszt'}
          </button>

          <button
            onClick={onLater}
            disabled={claiming}
            className="w-full py-3 text-base sm:text-lg text-[hsl(var(--dup-text-200))] hover:text-[hsl(var(--dup-text-100))] transition-colors font-bold border border-[hsl(var(--dup-gold-600))] bg-transparent hover:bg-[hsl(var(--dup-gold-600)/0.12)] rounded-[12px] focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)]"
          >
            Később kérem
          </button>
        </div>

        <p className="text-center text-[hsl(var(--dup-text-300))] text-xs sm:text-sm mt-3 relative z-10">
          ⭐ A bónusz ingyenes. Nem minősül szerencsejátéknak. ⭐
        </p>
      </DialogContent>
    </Dialog>
  );
};
