import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Zap, HelpCircle, Users, Eye, ShoppingCart, Coins, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { SPEED_BOOSTERS } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { QuickBuyOptInDialog } from './QuickBuyOptInDialog';

interface ShopProps {
  userId: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUsd?: number;
  icon: any;
  action: () => Promise<void>;
  disabled?: boolean;
}

const QUICK_BUY_KEY = 'quick_buy_enabled';

const Shop = ({ userId }: ShopProps) => {
  const { profile, updateProfile, spendCoins, fetchProfile } = useGameProfile(userId);
  const { purchaseBooster } = useUserBoosters(userId);
  const [loading, setLoading] = useState<string | null>(null);
  const [showQuickBuyDialog, setShowQuickBuyDialog] = useState(false);
  const [quickBuyEnabled, setQuickBuyEnabled] = useState(false);
  const [pendingStripeAction, setPendingStripeAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const enabled = localStorage.getItem(QUICK_BUY_KEY) === 'true';
    setQuickBuyEnabled(enabled);
  }, []);

  const handleQuickBuyAccept = () => {
    localStorage.setItem(QUICK_BUY_KEY, 'true');
    setQuickBuyEnabled(true);
    setShowQuickBuyDialog(false);
    if (pendingStripeAction) {
      pendingStripeAction();
      setPendingStripeAction(null);
    }
  };

  const handleQuickBuyDecline = () => {
    setShowQuickBuyDialog(false);
    setPendingStripeAction(null);
  };

  const buyWithStripe = async (boosterType: 'DoubleSpeed' | 'MegaSpeed' | 'GigaSpeed' | 'DingleSpeed') => {
    const executeStripePayment = async () => {
      setLoading(`stripe-${boosterType}`);
      try {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: { productType: boosterType }
        });

        if (error) throw error;

        if (data.url) {
          window.open(data.url, '_blank');
          toast.info('Átirányítás a fizetési oldalra...');
        }
      } catch (error: any) {
        console.error('Error creating payment:', error);
        toast.error('Hiba történt a fizetés indításakor');
      }
      setLoading(null);
    };

    if (!quickBuyEnabled) {
      setPendingStripeAction(() => executeStripePayment);
      setShowQuickBuyDialog(true);
    } else {
      await executeStripePayment();
    }
  };

  if (!profile) return null;

  const buyLife = async () => {
    setLoading('life');
    try {
      const { data, error } = await supabase.rpc('purchase_life');
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('1 élet vásárolva!');
        await fetchProfile();
      } else {
        toast.error(result.error || 'Hiba történt');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error purchasing life:', error);
      toast.error('Hiba történt a vásárlás során');
    }
    setLoading(null);
  };

  const buySpeedBooster = async () => {
    setLoading('speed');
    try {
      const { data, error } = await supabase.rpc('activate_booster', {
        p_booster_type: 'speed',
        p_cost: 150,
        p_multiplier: 2,
        p_duration_hours: 24
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('Speed Booster aktiválva 24 órára!');
        await fetchProfile();
      } else {
        toast.error(result.error || 'Hiba történt');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error activating speed booster:', error);
      toast.error('Hiba történt az aktiválás során');
    }
    setLoading(null);
  };

  const reactivateHelp5050 = async () => {
    setLoading('help5050');
    try {
      const { data, error } = await supabase.rpc('reactivate_help', {
        p_help_type: '50_50',
        p_cost: 15
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('Harmadoló segítség újraaktiválva!');
        await fetchProfile();
      } else {
        toast.error(result.error || 'Hiba történt');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error reactivating help:', error);
      toast.error('Hiba történt');
    }
    setLoading(null);
  };

  const reactivateHelp2x = async () => {
    setLoading('help2x');
    try {
      const { data, error } = await supabase.rpc('reactivate_help', {
        p_help_type: '2x_answer',
        p_cost: 20
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('2x válasz segítség újraaktiválva!');
        await fetchProfile();
      } else {
        toast.error(result.error || 'Hiba történt');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error reactivating help:', error);
      toast.error('Hiba történt');
    }
    setLoading(null);
  };

  const reactivateHelpAudience = async () => {
    setLoading('helpaudience');
    try {
      const { data, error } = await supabase.rpc('reactivate_help', {
        p_help_type: 'audience',
        p_cost: 30
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('Közönség segítség újraaktiválva!');
        await fetchProfile();
      } else {
        toast.error(result.error || 'Hiba történt');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error reactivating help:', error);
      toast.error('Hiba történt');
    }
    setLoading(null);
  };

  const buyBooster = async (boosterType: 'DoubleSpeed' | 'MegaSpeed' | 'GigaSpeed' | 'DingleSpeed') => {
    setLoading(boosterType);
    const booster = SPEED_BOOSTERS.find(b => b.name === boosterType);
    if (!booster) return;
    
    try {
      const { data, error } = await supabase.rpc('activate_booster', {
        p_booster_type: 'max_lives',
        p_cost: booster.price
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        await purchaseBooster(boosterType);
        toast.success(`${booster.name} booster vásárolva! +${booster.lives_gained} élet és ${booster.multiplier}x gyorsítás!`);
        await fetchProfile();
      } else {
        toast.error(result.error || 'Hiba történt');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error purchasing booster:', error);
      toast.error('Hiba történt a vásárlás során');
    }
    setLoading(null);
  };

  const shopItems: ShopItem[] = [
    {
      id: 'life',
      name: '1 Élet',
      description: 'Egy extra élet a játékokhoz',
      price: 25,
      icon: Heart,
      action: buyLife,
      disabled: profile.lives >= profile.max_lives
    },
    {
      id: 'help5050',
      name: 'Harmadoló Segítség',
      description: 'Újraaktiválás a következő játékhoz',
      price: 15,
      icon: HelpCircle,
      action: reactivateHelp5050,
      disabled: profile.help_50_50_active
    },
    {
      id: 'help2x',
      name: '2x Válasz Segítség',
      description: 'Újraaktiválás következő játékhoz',
      price: 20,
      icon: Eye,
      action: reactivateHelp2x,
      disabled: profile.help_2x_answer_active
    },
    {
      id: 'helpaudience',
      name: 'Közönség Segítség',
      description: 'Újraaktiválás következő játékhoz',
      price: 30,
      icon: Users,
      action: reactivateHelpAudience,
      disabled: profile.help_audience_active
    }
  ];

  const boosterItems: ShopItem[] = SPEED_BOOSTERS.map(booster => ({
    id: booster.name,
    name: booster.name,
    description: `${booster.multiplier}x gyorsítás, +${booster.lives_gained} élet`,
    price: booster.price,
    priceUsd: booster.priceUsd,
    icon: Zap,
    action: () => buyBooster(booster.name as any)
  }));

  // Check for payment success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const productType = params.get('product');

    if (paymentStatus === 'success' && productType) {
      toast.success(`${productType} booster vásárlás sikeres!`);
      // Clean URL
      window.history.replaceState({}, '', '/shop');
    } else if (paymentStatus === 'cancelled') {
      toast.info('Fizetés megszakítva');
      window.history.replaceState({}, '', '/shop');
    }
  }, []);

  return (
    <div className="space-y-6">
      <QuickBuyOptInDialog 
        open={showQuickBuyDialog} 
        onAccept={handleQuickBuyAccept}
        onDecline={handleQuickBuyDecline}
      />
      {/* Balance Card */}
      <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="bg-yellow-500/10 rounded-xl p-4 text-center border border-yellow-500/30">
            <p className="text-sm text-white/70 mb-1">Egyenleged</p>
            <p className="text-3xl font-bold text-yellow-500 flex items-center justify-center gap-2">
              <Coins className="w-8 h-8 text-yellow-500" />
              {profile.coins}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Boosters Section */}
      <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-6 h-6 text-yellow-500" />
            Speed Boosterek
          </CardTitle>
          <CardDescription className="text-white/70">
            Vásárolj speed boostereket aranyérméért vagy valódi pénzért
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boosterItems.map((item) => {
              const Icon = item.icon;
              const isLoadingCoins = loading === item.id;
              const isLoadingStripe = loading === `stripe-${item.id}`;
              const canAfford = profile.coins >= item.price;
              
              return (
                <div
                  key={item.id}
                  className="border-2 rounded-xl p-4 transition-all border-purple-500/30 hover:border-yellow-500/50 bg-black/40"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Icon className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-1 text-white">{item.name}</h4>
                      <p className="text-sm text-white/70">{item.description}</p>
                    </div>
                  </div>

                  {/* Coin Purchase */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg flex items-center gap-1 text-yellow-500">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      {item.price}
                    </span>
                    <Button
                      onClick={item.action}
                      disabled={!canAfford || isLoadingCoins || isLoadingStripe}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isLoadingCoins ? 'Vásárlás...' : 'Érmével'}
                    </Button>
                  </div>

                  {/* Stripe Purchase */}
                  {item.priceUsd && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="font-bold text-lg flex items-center gap-1 text-green-400">
                        <CreditCard className="w-5 h-5" />
                        ${(item.priceUsd / 100).toFixed(2)}
                      </span>
                      <Button
                        onClick={() => buyWithStripe(item.id as any)}
                        disabled={isLoadingCoins || isLoadingStripe}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isLoadingStripe ? 'Fizetés...' : 'Kártyával'}
                      </Button>
                    </div>
                  )}

                  {!canAfford && (
                    <p className="text-xs text-red-500 mt-2">
                      Nincs elég aranyérméd
                    </p>
                  )}
                  
                  {item.priceUsd && (
                    <p className="text-xs text-white/50 mt-2">
                      További lehetőségek a Shopban
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shop Items Section */}
      <Card className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-6 h-6 text-purple-500" />
            Bolt
          </CardTitle>
          <CardDescription className="text-white/70">
            Vásárolj extra életeket és segítségeket aranyérméért
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shopItems.map((item) => {
              const Icon = item.icon;
              const isLoading = loading === item.id;
              const canAfford = profile.coins >= item.price;
              
              return (
                <div
                  key={item.id}
                  className="border-2 rounded-xl p-4 transition-all border-purple-500/30 hover:border-purple-500/50 bg-black/40"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Icon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-1 text-white">{item.name}</h4>
                      <p className="text-sm text-white/70">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg flex items-center gap-1 text-yellow-500">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      {item.price}
                    </span>
                    <Button
                      onClick={item.action}
                      disabled={!canAfford || isLoading}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? 'Vásárlás...' : item.disabled ? 'Újraaktivál' : 'Vásárlás'}
                    </Button>
                  </div>

                  {item.disabled && (
                    <p className="text-xs text-white/50 mt-2">
                      Már aktív vagy maximális szinten
                    </p>
                  )}
                  {!canAfford && !item.disabled && (
                    <p className="text-xs text-red-500 mt-2">
                      Nincs elég aranyérméd
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Shop;
