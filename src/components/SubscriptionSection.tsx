import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Crown, Check, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface SubscriptionSectionProps {
  isPremium: boolean;
}

export const SubscriptionSection = ({ isPremium }: SubscriptionSectionProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info('Átirányítás a fizetési oldalra...');
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error('Hiba történt az előfizetés indításakor');
    }
    setLoading(false);
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error('Hiba történt');
    }
    setLoading(false);
  };

  return (
    <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-2 border-[#d4af37] backdrop-blur-sm shadow-2xl shadow-[#d4af37]/30 relative overflow-hidden">
      {/* Casino lights animation - gold and red */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4af37] via-[#c41e3a] to-[#d4af37] opacity-90 animate-pulse"></div>
      
      {/* Poker green felt texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(26,95,58,0.3),transparent)] opacity-50"></div>
      
      {/* Floating sparkles - gold and red */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Sparkles className="absolute top-4 left-4 w-6 h-6 text-[#ffd700] animate-pulse" />
        <Sparkles className="absolute top-8 right-8 w-4 h-4 text-[#c41e3a] animate-pulse delay-100" />
        <Sparkles className="absolute bottom-12 left-12 w-5 h-5 text-[#ffb700] animate-pulse delay-200" />
        <Zap className="absolute bottom-8 right-6 w-6 h-6 text-[#ffd700] animate-pulse delay-300" />
      </div>

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-white text-2xl">
          <div className="relative">
            <div className="absolute inset-0 bg-[#ffd700]/50 blur-xl animate-pulse"></div>
            <Crown className="relative w-8 h-8 text-[#ffd700] animate-bounce drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          </div>
          <span className="bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#ffd700] bg-clip-text text-transparent font-black drop-shadow-lg">
            PRÉMIUM ELŐFIZETÉS
          </span>
        </CardTitle>
        <CardDescription className="text-white/90 font-semibold">
          Szerezd meg az exkluzív előnyöket és dominálj!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Price tag - Casino style with poker green and gold */}
        <div className="bg-gradient-to-r from-[#1a5f3a]/40 via-[#0e4d2e]/60 to-[#1a5f3a]/40 rounded-xl p-4 border-2 border-[#d4af37] text-center relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/10 via-transparent to-[#ffd700]/10 animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent)]"></div>
          <p className="text-[#d4af37] text-sm mb-1 relative z-10 font-bold">Csak</p>
          <p className="text-5xl font-black text-[#ffd700] relative z-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">$2.99</p>
          <p className="text-[#d4af37] text-sm relative z-10 font-semibold">/ hónap (~$0.09/nap)</p>
        </div>

        {/* Benefits - casino themed */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#ffd700]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#d4af37]/40 shadow-inner">
            <div className="w-6 h-6 rounded-full bg-[#ffd700]/30 flex items-center justify-center flex-shrink-0 border border-[#d4af37]/50">
              <Check className="w-4 h-4 text-[#ffd700]" />
            </div>
            <p className="text-white font-bold text-sm">Dupla napi jutalom (2x arany minden nap)</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#c41e3a]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#c41e3a]/40 shadow-inner">
            <div className="w-6 h-6 rounded-full bg-[#c41e3a]/30 flex items-center justify-center flex-shrink-0 border border-[#c41e3a]/50">
              <Check className="w-4 h-4 text-[#ff0000]" />
            </div>
            <p className="text-white font-bold text-sm">30 maximális élet (15 helyett)</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#2a7a4f]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#2a7a4f]/40 shadow-inner">
            <div className="w-6 h-6 rounded-full bg-[#2a7a4f]/30 flex items-center justify-center flex-shrink-0 border border-[#2a7a4f]/50">
              <Check className="w-4 h-4 text-[#2a7a4f]" />
            </div>
            <p className="text-white font-bold text-sm">Játékon belüli segítség: +500 arany + 15 élet</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#0047ab]/20 via-[#1a5f3a]/30 to-transparent rounded-lg border border-[#0047ab]/40 shadow-inner">
            <div className="w-6 h-6 rounded-full bg-[#0047ab]/30 flex items-center justify-center flex-shrink-0 border border-[#0047ab]/50">
              <Check className="w-4 h-4 text-[#2563eb]" />
            </div>
            <p className="text-white font-bold text-sm">Exkluzív "Prémium" badge és különleges avatár keret</p>
          </div>
        </div>

        {/* CTA Button - gold casino style */}
        {isPremium ? (
          <Button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full py-6 text-lg font-black bg-gradient-to-r from-[#2a7a4f] to-[#1a5f3a] text-white hover:from-[#2a7a4f] hover:to-[#0e4d2e] shadow-xl shadow-[#2a7a4f]/50 border-2 border-[#2a7a4f]/50"
          >
            <Crown className="w-5 h-5 mr-2" />
            {loading ? 'Betöltés...' : 'ELŐFIZETÉS KEZELÉSE'}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-6 text-lg font-black bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#ffd700] text-black hover:opacity-90 shadow-2xl shadow-[#ffd700]/60 animate-pulse border-2 border-[#ffb700]"
          >
            <Crown className="w-5 h-5 mr-2" />
            {loading ? 'Átirányítás...' : 'ELŐFIZETEK MOST!'}
          </Button>
        )}

        <p className="text-center text-[#d4af37] text-xs font-semibold">
          {isPremium ? 'Prémium tag vagy! 💎' : 'Bármikor lemondható • Azonnali hozzáférés'}
        </p>
      </CardContent>
    </Card>
  );
};
