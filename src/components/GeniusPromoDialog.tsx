import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Crown, Check, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeniusPromoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
  onLater?: () => void;
}

export const GeniusPromoDialog = ({ open, onClose, onSubscribe, onLater }: GeniusPromoDialogProps) => {
  const [loading, setLoading] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={handleLater}>
      <DialogContent 
        className="w-[95vw] max-w-md bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-2 border-[#d4af37] shadow-2xl shadow-[#d4af37]/30 overflow-hidden"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        {/* Casino lights animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4af37] via-[#c41e3a] to-[#d4af37] opacity-90 animate-pulse"></div>
        
        {/* Poker green felt texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(26,95,58,0.3),transparent)] opacity-50"></div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Sparkles className="absolute top-4 left-4 w-6 h-6 text-[#ffd700] animate-pulse" />
          <Sparkles className="absolute top-8 right-8 w-4 h-4 text-[#c41e3a] animate-pulse" style={{ animationDelay: '0.1s' }} />
          <Sparkles className="absolute bottom-12 left-12 w-5 h-5 text-[#ffb700] animate-pulse" style={{ animationDelay: '0.2s' }} />
          <Zap className="absolute bottom-8 right-6 w-6 h-6 text-[#ffd700] animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="flex items-center justify-center gap-3 text-white text-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ffd700]/50 blur-xl animate-pulse"></div>
              <Crown className="relative w-8 h-8 text-[#ffd700] animate-bounce drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
            </div>
            <span className="bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#ffd700] bg-clip-text text-transparent font-black drop-shadow-lg">
              GENIUS ELŐFIZETÉS
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 relative z-10 mt-4">
          {/* Lead text */}
          <p className="text-center text-white text-base">
            Légy Genius, vedd fel a tempót!
          </p>

          {/* Price tag */}
          <div className="bg-gradient-to-r from-[#1a5f3a]/40 via-[#0e4d2e]/60 to-[#1a5f3a]/40 rounded-xl p-4 border-2 border-[#d4af37] text-center relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/10 via-transparent to-[#ffd700]/10 animate-pulse"></div>
            <p className="text-[#d4af37] text-sm mb-1 relative z-10 font-bold">Csak</p>
            <p className="text-5xl font-black text-[#ffd700] relative z-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">$2.99</p>
            <p className="text-[#d4af37] text-sm relative z-10 font-semibold">/ hó</p>
            <p className="text-white/60 text-xs mt-1">Bármikor lemondható</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#ffd700]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#d4af37]/40">
              <div className="w-6 h-6 rounded-full bg-[#ffd700]/30 flex items-center justify-center flex-shrink-0 border border-[#d4af37]/50 mt-0.5">
                <Check className="w-4 h-4 text-[#ffd700]" />
              </div>
              <p className="text-white font-bold text-sm">Dupla napi jutalom</p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#c41e3a]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#c41e3a]/40">
              <div className="w-6 h-6 rounded-full bg-[#c41e3a]/30 flex items-center justify-center flex-shrink-0 border border-[#c41e3a]/50 mt-0.5">
                <Check className="w-4 h-4 text-[#ff0000]" />
              </div>
              <p className="text-white font-bold text-sm">–25% kedvezmény minden Speed Shop vásárlásból</p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#2a7a4f]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#2a7a4f]/40">
              <div className="w-6 h-6 rounded-full bg-[#2a7a4f]/30 flex items-center justify-center flex-shrink-0 border border-[#2a7a4f]/50 mt-0.5">
                <Check className="w-4 h-4 text-[#2a7a4f]" />
              </div>
              <p className="text-white font-bold text-sm">Közvélemény-szavazásokhoz hozzáférés</p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#0047ab]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#0047ab]/40">
              <div className="w-6 h-6 rounded-full bg-[#0047ab]/30 flex items-center justify-center flex-shrink-0 border border-[#0047ab]/50 mt-0.5">
                <Check className="w-4 h-4 text-[#2563eb]" />
              </div>
              <p className="text-white font-bold text-sm">TikTok tippek & trükkök videók</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 text-lg font-black bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#ffd700] text-black hover:opacity-90 shadow-2xl shadow-[#ffd700]/60 animate-pulse border-2 border-[#ffb700] rounded-lg transition-all"
            >
              <Crown className="w-5 h-5 mr-2 inline" />
              {loading ? 'Átirányítás...' : 'Előfizetek $2.99/hó'}
            </button>

            <button
              onClick={handleLater}
              disabled={loading}
              className="w-full py-2 text-sm text-[#d4af37] hover:text-[#ffd700] transition-colors"
            >
              Mutasd később
            </button>
          </div>

          <p className="text-center text-[#d4af37] text-xs font-semibold">
            Transzparens előfizetés. Automatikusan megújul, bármikor lemondható a Profilban.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
