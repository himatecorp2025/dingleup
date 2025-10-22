import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Crown, Check, Sparkles, Zap, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface GeniusPromoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
  onLater?: () => void;
}

export const GeniusPromoDialog = ({ open, onClose, onSubscribe, onLater }: GeniusPromoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isHandheld = usePlatformDetection();

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

  // Don't render on desktop/laptop
  if (!isHandheld || !open) return null;

  return (
    <Dialog open={open} onOpenChange={handleLater}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-4 border-[#d4af37] shadow-2xl shadow-[#d4af37]/50 overflow-hidden rounded-[20px]"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' 
        }}
      >
        {/* Casino lights animation - gold/green poker theme */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#d4af37] via-[#c41e3a] to-[#2a7a4f] opacity-90 animate-pulse z-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#2a7a4f] via-[#d4af37] to-[#c41e3a] opacity-90 animate-pulse z-50" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Poker green felt texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(26,95,58,0.4),transparent)] opacity-60"></div>
        
        {/* Floating sparkles - gold/red poker theme */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star className="absolute top-8 left-8 w-8 h-8 text-[#ffd700] animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]" style={{ animationDuration: '1.5s' }} />
          <Sparkles className="absolute top-16 right-10 w-6 h-6 text-[#c41e3a] animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <Crown className="absolute bottom-20 left-16 w-8 h-8 text-[#ffd700] animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
          <Zap className="absolute bottom-24 right-12 w-7 h-7 text-[#ffb700] animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center justify-center gap-3 text-white text-2xl sm:text-3xl">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ffd700]/60 blur-2xl animate-pulse"></div>
              <Crown className="relative w-10 h-10 sm:w-12 sm:h-12 text-[#ffd700] animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,1)]" />
            </div>
            <span className="bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffd700] bg-clip-text text-transparent font-black drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)]">
              GENIUS ELŐFIZETÉS
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 relative z-10 mt-4">
          {/* Lead text - vibrant */}
          <p className="text-center text-[#ffd700] text-xl sm:text-2xl font-black drop-shadow-lg">
            Légy Genius, vedd fel a tempót!
          </p>

          {/* Price tag - enhanced poker casino style */}
          <div className="bg-gradient-to-br from-[#1a5f3a]/60 via-[#0e4d2e]/80 to-[#1a5f3a]/60 rounded-[15px] p-6 border-4 border-[#d4af37] text-center relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/20 via-transparent to-[#ffd700]/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.15),transparent)]"></div>
            
            <div className="relative z-10">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-[#ffd700] mx-auto mb-2 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
              <p className="text-[#d4af37] text-sm sm:text-base mb-2 font-black drop-shadow-md">Csak</p>
              <p className="text-6xl sm:text-7xl font-black text-[#ffd700] drop-shadow-[0_0_20px_rgba(255,215,0,1)]">$2.99</p>
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

          {/* CTA Buttons - enhanced */}
          <div className="space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-5 text-xl sm:text-2xl font-black bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffd700] text-black hover:opacity-95 shadow-[0_0_30px_rgba(255,215,0,0.7)] animate-pulse border-4 border-[#ffb700] rounded-[15px] transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <Crown className="w-7 h-7 mr-2 inline" />
              {loading ? 'Átirányítás...' : 'Előfizetek $2.99/hó'}
            </button>

            <button
              onClick={handleLater}
              disabled={loading}
              className="w-full py-3 text-base sm:text-lg text-[#d4af37] hover:text-[#ffd700] transition-colors font-bold"
            >
              Mutasd később
            </button>
          </div>

          <p className="text-center text-[#d4af37] text-xs sm:text-sm font-bold leading-relaxed">
            Transzparens előfizetés • Automatikusan megújul • Bármikor lemondható
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
