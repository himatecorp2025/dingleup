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
    <Card className="bg-gradient-to-br from-yellow-900/40 via-orange-900/40 to-yellow-900/40 border-2 border-yellow-500/50 backdrop-blur-sm shadow-2xl shadow-yellow-500/30 relative overflow-hidden">
      {/* Casino lights animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse"></div>
      
      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-400 animate-pulse" />
        <Sparkles className="absolute top-8 right-8 w-4 h-4 text-orange-400 animate-pulse delay-100" />
        <Sparkles className="absolute bottom-12 left-12 w-5 h-5 text-red-400 animate-pulse delay-200" />
        <Zap className="absolute bottom-8 right-6 w-6 h-6 text-purple-400 animate-pulse delay-300" />
      </div>

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-white text-2xl">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/50 blur-xl animate-pulse"></div>
            <Crown className="relative w-8 h-8 text-yellow-400 animate-bounce" />
          </div>
          <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent font-black">
            PRÉMIUM ELŐFIZETÉS
          </span>
        </CardTitle>
        <CardDescription className="text-white/90 font-semibold">
          Szerezd meg az exkluzív előnyöket és dominálj!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Price tag - Casino style */}
        <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-xl p-4 border-2 border-yellow-500/50 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse"></div>
          <p className="text-white/70 text-sm mb-1 relative z-10">Csak</p>
          <p className="text-5xl font-black text-yellow-400 relative z-10 drop-shadow-lg">$2.99</p>
          <p className="text-white/90 text-sm relative z-10">/ hónap (~$0.09/nap)</p>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30">
            <div className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-white font-bold text-sm">Dupla napi jutalom (2x arany minden nap)</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/20 to-transparent rounded-lg border border-red-500/30">
            <div className="w-6 h-6 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-white font-bold text-sm">30 maximális élet (15 helyett)</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/20 to-transparent rounded-lg border border-green-500/30">
            <div className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-white font-bold text-sm">Játékon belüli segítség: +500 arany + 15 élet</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/20 to-transparent rounded-lg border border-purple-500/30">
            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-white font-bold text-sm">Exkluzív "Prémium" badge és különleges avatár keret</p>
          </div>
        </div>

        {/* CTA Button */}
        {isPremium ? (
          <Button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full py-6 text-lg font-black bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900 shadow-xl shadow-green-500/50"
          >
            <Crown className="w-5 h-5 mr-2" />
            {loading ? 'Betöltés...' : 'ELŐFIZETÉS KEZELÉSE'}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-6 text-lg font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 text-black hover:opacity-90 shadow-xl shadow-yellow-500/50 animate-pulse"
          >
            <Crown className="w-5 h-5 mr-2" />
            {loading ? 'Átirányítás...' : 'ELŐFIZETEK MOST!'}
          </Button>
        )}

        <p className="text-center text-white/70 text-xs">
          {isPremium ? 'Prémium tag vagy! 💎' : 'Bármikor lemondható • Azonnali hozzáférés'}
        </p>
      </CardContent>
    </Card>
  );
};
