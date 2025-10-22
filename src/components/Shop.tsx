import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Zap, HelpCircle, Users, Eye, ShoppingCart, Coins, CreditCard, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { SPEED_BOOSTERS } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { QuickBuyOptInDialog } from './QuickBuyOptInDialog';
import { GeniusSubscriptionDialog } from './GeniusSubscriptionDialog';
import { TipsVideosGrid } from './TipsVideosGrid';
import { calculateUsdPrice, calculateCoinCost } from '@/lib/geniusPricing';

interface ShopProps {
  userId: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUsd?: number;
  baseCoinPrice?: number;
  baseUsdPrice?: number;
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
  const [showGeniusDialog, setShowGeniusDialog] = useState(false);

  const isGenius = profile?.is_subscribed || false;

  useEffect(() => {
    const enabled = localStorage.getItem(QUICK_BUY_KEY) === 'true';
    setQuickBuyEnabled(enabled);
  }, []);

  // Track price renders for discounted items
  useEffect(() => {
    if (isGenius && profile) {
      boosterItems.forEach(item => {
        if (item.baseCoinPrice && item.baseCoinPrice !== item.price) {
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'price_render', {
              userId,
              itemType: item.id,
              basePrice: item.baseCoinPrice,
              discountedPrice: item.price,
              discountPercent: 50
            });
          }
        }
        if (item.baseUsdPrice && item.priceUsd && item.baseUsdPrice !== item.priceUsd) {
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'price_render', {
              userId,
              itemType: item.id,
              basePrice: item.baseUsdPrice,
              discountedPrice: item.priceUsd,
              discountPercent: 25
            });
          }
        }
      });
    }
  }, [isGenius, profile]);

  // Check for payment success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const productType = params.get('product');
    const sessionId = params.get('session_id');

    const verifyPayment = async () => {
      if (paymentStatus === 'success' && productType && sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId }
          });

          if (error) throw error;

          if (data.success) {
            toast.success(`${productType} booster sikeres vásárlás! +${data.livesBonus} élet hozzáadva!`);
            await fetchProfile();
          }
        } catch (error: any) {
          console.error('Error verifying payment:', error);
          toast.error('Fizetés ellenőrzése sikertelen, kérlek lépj kapcsolatba a support-tal');
        }
        // Clean URL
        window.history.replaceState({}, '', '/shop');
      } else if (paymentStatus === 'cancelled') {
        toast.info('Fizetés megszakítva');
        window.history.replaceState({}, '', '/shop');
      }
    };

    verifyPayment();
  }, [fetchProfile]);

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

  // Booster items with Genius pricing
  const boosterOrder = ['DingleSpeed', 'GigaSpeed', 'MegaSpeed', 'DoubleSpeed'];
  const boosterItems: ShopItem[] = boosterOrder
    .map(name => SPEED_BOOSTERS.find(b => b.name === name))
    .filter(Boolean)
    .map(booster => {
      const baseCoinCost = booster!.price;
      const baseUsdPrice = booster!.priceUsd;
      const discountedCoinCost = calculateCoinCost(baseCoinCost, { is_subscriber: isGenius });
      const discountedUsdPrice = baseUsdPrice ? calculateUsdPrice(baseUsdPrice, { is_subscriber: isGenius }) : undefined;
      
      return {
        id: booster!.name,
        name: booster!.name,
        description: `${booster!.multiplier}x gyorsítás, +${booster!.lives_gained} élet`,
        price: discountedCoinCost,
        priceUsd: discountedUsdPrice,
        baseCoinPrice: baseCoinCost,
        baseUsdPrice: baseUsdPrice,
        icon: Zap,
        action: () => buyBooster(booster!.name as any)
      };
    });

  return (
    <>
      <QuickBuyOptInDialog 
        open={showQuickBuyDialog} 
        onAccept={handleQuickBuyAccept}
        onDecline={handleQuickBuyDecline}
      />
      <GeniusSubscriptionDialog
        open={showGeniusDialog}
        onOpenChange={setShowGeniusDialog}
      />
      
      <div className="space-y-8">
        {/* User Coins Display */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-2xl p-6 text-center border-2 border-yellow-400/50">
          <div className="flex items-center justify-center gap-3">
            <Coins className="w-8 h-8 text-yellow-900" />
            <span className="text-3xl font-bold text-yellow-900">{profile.coins}</span>
          </div>
          <p className="text-yellow-900 mt-2">Jelenlegi egyenleged</p>
        </div>

        {/* Subscription Info Box - only show if NOT Genius */}
        {!isGenius && (
          <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 border-2 border-purple-500/50 rounded-xl p-4 backdrop-blur-sm animate-pulse" data-tutorial="genius-section" style={{ animationDuration: '3s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/30 rounded-lg">
                <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              </div>
              <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">Genius Előfizetés</h3>
            </div>
            <p className="text-white/90 text-sm mb-3 font-semibold">
              🌟 Dupla napi jutalmak, 50% kedvezmény speed boosterekre, 25% kedvezmény valódi pénzes vásárlásoknál, és exkluzív Tippek & Trükkök videók!
            </p>
            <button 
              onClick={() => setShowGeniusDialog(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black py-3 px-4 rounded-lg transition-all shadow-lg shadow-yellow-500/50"
            >
              Előfizetek $2.99/hó
            </button>
          </div>
        )}

        {/* Speed Boosters Section */}
        <div className="space-y-4" data-tutorial="boosters-section">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Boosterek</h2>
          </div>
          <p className="text-white/80 mb-4">
            Vásárolj boostereket aranyérméért – aktiváld őket a játék előtt!
          </p>
          
          <div className="grid gap-4">
            {boosterItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e] rounded-xl p-6 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl border-2 border-yellow-500/30">
                    <item.icon className="w-8 h-8 text-yellow-500" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-white/70 text-sm mb-3">{item.description}</p>
                    
                    <div className="flex flex-col gap-3">
                      {/* Coins purchase option */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          {isGenius && item.baseCoinPrice && item.baseCoinPrice !== item.price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-yellow-600/50 line-through">{item.baseCoinPrice}</span>
                              <span className="text-2xl font-bold text-yellow-400 animate-pulse">{item.price}</span>
                              <span className="text-xs bg-yellow-500 text-black font-black px-2 py-1 rounded-full">-50%</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-yellow-500">{item.price}</span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => item.action()}
                          disabled={loading === item.id || profile.coins < item.price}
                          className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === item.id ? 'Betöltés...' : 'Vásárlás Coins-ért'}
                        </button>
                      </div>

                      {/* Stripe USD purchase option */}
                      {item.priceUsd && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-green-500" />
                            {isGenius && item.baseUsdPrice && item.baseUsdPrice !== item.priceUsd ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600/50 line-through">
                                  ${item.baseUsdPrice.toFixed(2)}
                                </span>
                                <span className="text-2xl font-bold text-green-400 animate-pulse">
                                  ${item.priceUsd.toFixed(2)}
                                </span>
                                <span className="text-xs bg-green-500 text-black font-black px-2 py-1 rounded-full">-25%</span>
                              </div>
                            ) : (
                              <span className="text-2xl font-bold text-green-500">
                                ${item.priceUsd.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => buyWithStripe(item.id as any)}
                            disabled={loading === `stripe-${item.id}`}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {loading === `stripe-${item.id}` ? 'Betöltés...' : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Vásárlás USD-ért
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips & Tricks Section - only for Genius or show teaser */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
              Tippek & Trükkök
            </h2>
          </div>
          <p className="text-white/80 mb-4">
            {isGenius ? 'Exkluzív videók csak Genius tagoknak!' : 'Exkluzív videók - Genius előfizetéssel!'}
          </p>
          
          <TipsVideosGrid 
            isGenius={isGenius} 
            onSubscribeClick={() => setShowGeniusDialog(true)} 
          />
        </div>

        {/* Shop Items Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Bolt</h2>
          </div>
          <p className="text-white/80 mb-4">
            Vásárolj extra életeket és segítségeket aranyérméért
          </p>
          
          <div className="grid gap-4">
            {shopItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e] rounded-xl p-6 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl border-2 border-purple-500/30">
                    <item.icon className="w-8 h-8 text-purple-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-white/70 text-sm mb-3">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-yellow-500">{item.price}</span>
                      </div>
                      
                      <button
                        onClick={() => item.action()}
                        disabled={loading === item.id || profile.coins < item.price || item.disabled}
                        className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === item.id ? 'Betöltés...' : 'Újraaktivál'}
                      </button>
                    </div>
                    
                    {item.disabled && (
                      <p className="text-xs text-white/50 mt-2">
                        Már aktív vagy maximális szinten
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Shop;
