import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Crown, Check, Sparkles, Zap, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackPromoEvent } from '@/lib/analytics';

interface GeniusPromoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
  onLater?: () => void;
}

export const GeniusPromoDialog = ({ open, onClose, onSubscribe, onLater }: GeniusPromoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const isHandheld = usePlatformDetection();

  // Get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const handleSubscribe = async () => {
    if (onSubscribe) onSubscribe();
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info('Átirányítás a fizetési oldalra...');
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error('Hiba történt az előfizetés indításakor');
    }
    setLoading(false);
  };

  const handleLater = () => {
    if (onLater) onLater();
    onClose();
  };

  // Track when dialog opens
  useEffect(() => {
    if (open && userId) {
      trackPromoEvent(userId, 'shown', 'genius_promo', {
        trigger: 'manual'
      });
    }
  }, [open, userId]);

  // Calculate discounted price (-25%)
  const basePrice = 2.99;
  const discountedPrice = Math.round(basePrice * 0.75 * 100) / 100;

  // Don't render on desktop/laptop
  if (!isHandheld || !open) return null;

  return (
    <Dialog open={open} onOpenChange={handleLater}>
      <DialogContent 
        className="flex flex-col bg-[#0F1116] border border-[hsl(var(--dup-gold-600))] shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(212,175,55,0.15)] overflow-hidden rounded-[20px]"
        style={{ 
          width: '95vw',
          maxWidth: '95vw',
          height: 'calc(var(--vh, 1vh) * 70)',
          maxHeight: 'calc(var(--vh, 1vh) * 70)',
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' 
        }}
      >
        {/* Casino lights animation - gold theme */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--dup-gold-400))] to-transparent opacity-80 animate-shimmer z-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--dup-gold-400))] to-transparent opacity-80 animate-shimmer z-50" style={{ animationDelay: '1s' }}></div>
        
        {/* Close button - crimson */}
        <button
          onClick={handleLater}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[hsl(var(--dup-crimson-500))] hover:text-[hsl(var(--dup-crimson-400))] hover:bg-[hsl(var(--dup-crimson-500)/0.1)] transition-all focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)] z-50"
          aria-label="Bezárás"
        >
          ✕
        </button>
        
        {/* Floating sparkles - gold theme */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star className="absolute top-8 left-8 w-8 h-8 text-[hsl(var(--dup-gold-400))] animate-pulse drop-shadow-[0_0_10px_hsl(var(--dup-gold-500))]" style={{ animationDuration: '1.5s' }} />
          <Sparkles className="absolute top-16 right-10 w-6 h-6 text-[hsl(var(--dup-gold-300))] animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <Crown className="absolute bottom-20 left-16 w-8 h-8 text-[hsl(var(--dup-gold-400))] animate-pulse drop-shadow-[0_0_10px_hsl(var(--dup-gold-500))]" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
          <Zap className="absolute bottom-24 right-12 w-7 h-7 text-[hsl(var(--dup-gold-300))] animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center justify-center gap-3 text-white text-2xl sm:text-3xl">
            <div className="relative">
              <div className="absolute inset-0 bg-[hsl(var(--dup-gold-400)/0.6)] blur-2xl animate-pulse"></div>
              <Crown className="relative w-10 h-10 sm:w-12 sm:h-12 text-[hsl(var(--dup-gold-400))] animate-bounce drop-shadow-[0_0_15px_hsl(var(--dup-gold-500))]" />
            </div>
            <span className="bg-gradient-to-r from-[hsl(var(--dup-gold-300))] via-[hsl(var(--dup-gold-500))] to-[hsl(var(--dup-gold-300))] bg-clip-text text-transparent font-black drop-shadow-lg">
              GENIUS ELŐFIZETÉS
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 relative z-10 mt-4">
          {/* Lead text */}
          <p className="text-center text-[hsl(var(--dup-gold-300))] text-xl sm:text-2xl font-black drop-shadow-lg">
            Légy Genius, vedd fel a tempót!
          </p>

          {/* Price tag - enhanced poker casino style with -25% discount */}
          <div className="bg-gradient-to-br from-[#1a5f3a]/60 via-[#0e4d2e]/80 to-[#1a5f3a]/60 rounded-[15px] p-6 border-4 border-[#d4af37] text-center relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/20 via-transparent to-[#ffd700]/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.15),transparent)]"></div>
            
            <div className="relative z-10">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-[#ffd700] mx-auto mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
              <p className="text-[#d4af37] text-sm sm:text-base mb-2 font-black drop-shadow-md">Genius Ár</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-[#d4af37]/70 line-through">${basePrice.toFixed(2)}</span>
                <span className="px-3 py-1 bg-[#6a0d37] text-white text-sm font-black rounded-full">-25%</span>
              </div>
              <p className="text-6xl sm:text-7xl font-black text-[#ffd700] drop-shadow-[0_0_20px_rgba(255,215,0,1)]">${discountedPrice.toFixed(2)}</p>
              <p className="text-[#d4af37] text-base sm:text-lg font-bold mt-1">/ hó</p>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-semibold">Bármikor lemondható</p>
            </div>
          </div>

          {/* Benefits - enhanced with colors */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#ffd700]/30 via-[#1a5f3a]/40 to-transparent rounded-[12px] border-2 border-[#d4af37]/60 shadow-lg">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ffd700]/40 flex items-center justify-center flex-shrink-0 border-2 border-[#d4af37] mt-0.5 shadow-inner">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffd700] drop-shadow-md" />
              </div>
              <p className="text-white font-black text-base sm:text-lg drop-shadow-md">Dupla napi jutalom</p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#c41e3a]/30 via-[#1a5f3a]/40 to-transparent rounded-[12px] border-2 border-[#c41e3a]/60 shadow-lg">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#c41e3a]/40 flex items-center justify-center flex-shrink-0 border-2 border-[#c41e3a] mt-0.5 shadow-inner">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff6b6b] drop-shadow-md" />
              </div>
              <p className="text-white font-black text-base sm:text-lg drop-shadow-md">–25% kedvezmény a Speed Shopban</p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#2a7a4f]/30 via-[#1a5f3a]/40 to-transparent rounded-[12px] border-2 border-[#2a7a4f]/60 shadow-lg">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2a7a4f]/40 flex items-center justify-center flex-shrink-0 border-2 border-[#2a7a4f] mt-0.5 shadow-inner">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[#4ade80] drop-shadow-md" />
              </div>
              <p className="text-white font-black text-base sm:text-lg drop-shadow-md">Közvélemény-szavazások</p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-[#0047ab]/30 via-[#1a5f3a]/40 to-transparent rounded-[12px] border-2 border-[#0047ab]/60 shadow-lg">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0047ab]/40 flex items-center justify-center flex-shrink-0 border-2 border-[#0047ab] mt-0.5 shadow-inner">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[#60a5fa] drop-shadow-md" />
              </div>
              <p className="text-white font-black text-base sm:text-lg drop-shadow-md">TikTok tippek & trükkök</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-5 text-xl sm:text-2xl font-black bg-[hsl(var(--dup-green-500))] hover:bg-[hsl(var(--dup-green-400))] disabled:bg-[hsl(var(--dup-green-300))] disabled:cursor-not-allowed text-white shadow-[0_0_20px_hsl(var(--dup-green-500)/0.6)] border border-[hsl(var(--dup-green-700))] rounded-[15px] transition-all relative overflow-hidden focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)] flex items-center justify-center gap-2"
            >
              <Crown className="w-7 h-7" />
              {loading ? 'Átirányítás...' : `Előfizetek $${discountedPrice.toFixed(2)}/hó`}
            </button>

            <button
              onClick={handleLater}
              disabled={loading}
              className="w-full py-3 text-base sm:text-lg text-[hsl(var(--dup-text-100))] hover:text-[hsl(var(--dup-text-100))] transition-colors font-bold border border-[hsl(var(--dup-gold-600))] bg-transparent hover:bg-[rgba(212,175,55,0.12)] rounded-[12px] focus-visible:outline-none focus-visible:shadow-[var(--dup-focus-ring)] disabled:cursor-not-allowed"
            >
              Mutasd később
            </button>
          </div>

          <p className="text-center text-[hsl(var(--dup-text-300))] text-xs sm:text-sm font-bold leading-relaxed">
            Transzparens előfizetés • Automatikusan megújul • Bármikor lemondható
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
