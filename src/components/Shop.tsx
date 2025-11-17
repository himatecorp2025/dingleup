import { useState } from 'react';
import { Button } from './ui/button';
import { Heart, HelpCircle, Users, Eye, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useGameProfile } from '@/hooks/useGameProfile';
import { supabase } from '@/integrations/supabase/client';
import { trackShopInteraction } from '@/lib/analytics';

interface ShopProps {
  userId: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;
  action: () => Promise<void>;
  disabled?: boolean;
}

const Shop = ({ userId }: ShopProps) => {
  const { profile, spendCoins, fetchProfile } = useGameProfile(userId);
  const [loading, setLoading] = useState<string | null>(null);

  const buyLife = async () => {
    if (!profile) return;
    
    setLoading('life');
    trackShopInteraction(userId, 'purchase_initiated', 'life', {
      product_id: 'extra_life',
      product_name: 'Extra Life',
      price_amount: 100,
      currency: 'coins'
    });

    const success = await spendCoins(100);
    if (success) {
      const { error } = await supabase.rpc('credit_lives', {
        p_user_id: userId,
        p_delta_lives: 1,
        p_source: 'shop_purchase',
        p_idempotency_key: `shop_life_${Date.now()}`
      });

      if (error) {
        toast.error('Hiba történt az élet vásárlás során');
      } else {
        toast.success('Sikeresen vásároltál 1 életet!');
        trackShopInteraction(userId, 'purchase_completed', 'life', {
          product_id: 'extra_life',
          product_name: 'Extra Life',
          price_amount: 100,
          currency: 'coins'
        });
        await fetchProfile();
      }
    } else {
      toast.error('Nincs elég aranyérméd!');
      trackShopInteraction(userId, 'purchase_cancelled', 'life', {
        product_id: 'extra_life',
        metadata: { reason: 'insufficient_coins' }
      });
    }
    setLoading(null);
  };

  const reactivateHelp = async (helpType: 'third' | '2x_answer' | 'audience', cost: number) => {
    if (!profile) return;
    
    setLoading(helpType);
    trackShopInteraction(userId, 'purchase_initiated', 'help', {
      product_id: helpType,
      product_name: `Reactivate ${helpType}`,
      price_amount: cost,
      currency: 'coins'
    });

    const { data, error } = await supabase.rpc('reactivate_help', {
      p_help_type: helpType,
      p_cost: cost
    });

    const resultData = data as any;
    if (error || !resultData?.success) {
      toast.error(resultData?.error || 'Hiba történt a segítség újraaktiválása során');
      trackShopInteraction(userId, 'purchase_cancelled', 'help', {
        product_id: helpType,
        metadata: { reason: resultData?.error || 'unknown' }
      });
    } else {
      toast.success('Segítség újraaktiválva!');
      trackShopInteraction(userId, 'purchase_completed', 'help', {
        product_id: helpType,
        product_name: `Reactivate ${helpType}`,
        price_amount: cost,
        currency: 'coins'
      });
      await fetchProfile();
    }
    setLoading(null);
  };

  const shopItems: ShopItem[] = [
    {
      id: 'life',
      name: 'Extra Élet',
      description: '+1 élet',
      price: 100,
      icon: Heart,
      action: buyLife
    }
  ];

  const helpItems: ShopItem[] = [
    {
      id: 'third',
      name: 'Harmadolás',
      description: 'Újraaktiválás',
      price: 15,
      icon: Users,
      action: () => reactivateHelp('third', 15),
      disabled: profile?.help_third_active
    },
    {
      id: '2x_answer',
      name: '2x Válasz',
      description: 'Újraaktiválás',
      price: 20,
      icon: Eye,
      action: () => reactivateHelp('2x_answer', 20),
      disabled: profile?.help_2x_answer_active
    },
    {
      id: 'audience',
      name: 'Közönség',
      description: 'Újraaktiválás',
      price: 30,
      icon: HelpCircle,
      action: () => reactivateHelp('audience', 30),
      disabled: profile?.help_audience_active
    }
  ];

  return (
    <div className="space-y-8">
      {/* User Coins Display */}
      <div className="relative rounded-2xl p-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/30" aria-hidden />
        <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-700" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
        <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-b from-yellow-500/30 via-yellow-600/30 to-yellow-700/30" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.12), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
        <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)' }} aria-hidden />
        
        <div className="relative z-10 flex flex-col items-center gap-2">
          <Coins className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
          <p className="text-white/90 text-sm font-semibold drop-shadow-lg">Jelenlegi egyenleged</p>
          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-100 drop-shadow-2xl">
            {profile?.coins || 0}
          </p>
        </div>
      </div>

      {/* Shop Items */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Vásárolj</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shopItems.map(item => (
            <div key={item.id} className="relative rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20" aria-hidden />
              <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2)' }} aria-hidden />
              <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-purple-500/30 via-purple-600/30 to-purple-700/30" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)' }} aria-hidden />
              
              <div className="relative z-10 flex flex-col h-full p-4">
                <div className="w-full aspect-video flex items-center justify-center mb-2">
                  <div className="p-3 bg-yellow-500/10 rounded-xl border-2 border-yellow-500/30">
                    <item.icon className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-white/70 text-sm mb-2 flex-1">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-lg">{item.price}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={item.action}
                    disabled={loading === item.id || item.disabled}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
                  >
                    {loading === item.id ? 'Feldolgozás...' : 'Vásárlás'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Items */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Segítségek újraaktiválása</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {helpItems.map(item => (
            <div key={item.id} className={`relative rounded-xl overflow-hidden ${item.disabled ? 'opacity-50' : ''}`}>
              <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-900 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20" aria-hidden />
              <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-blue-600 via-blue-500 to-blue-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2)' }} aria-hidden />
              <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-blue-500/30 via-blue-600/30 to-blue-700/30" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)' }} aria-hidden />
              
              <div className="relative z-10 flex flex-col h-full p-4">
                <div className="w-full aspect-video flex items-center justify-center mb-2">
                  <div className="p-3 bg-blue-500/10 rounded-xl border-2 border-blue-500/30">
                    <item.icon className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-white/70 text-sm mb-2 flex-1">{item.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-lg">{item.price}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={item.action}
                    disabled={loading === item.id || item.disabled}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold"
                  >
                    {item.disabled ? 'Aktív' : loading === item.id ? 'Feldolgozás...' : 'Újraaktivál'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;
