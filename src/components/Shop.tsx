import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Zap, HelpCircle, Users, Eye, ShoppingCart, Coins, CreditCard, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { SPEED_BOOSTERS } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { QuickBuyOptInDialogFixed } from './QuickBuyOptInDialogFixed';
import { GeniusSubscriptionDialog } from './GeniusSubscriptionDialog';
import { TipsVideosGrid } from './TipsVideosGrid';
import { calculateUsdPrice, calculateCoinCost } from '@/lib/geniusPricing';
import { trackShopInteraction } from '@/lib/analytics';

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
            toast.success(`${productType} booster megszerzése sikeres! +${data.livesBonus} élet hozzáadva!`);
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
      
      const booster = SPEED_BOOSTERS.find(b => b.name === boosterType);
      if (!booster) return;
      
      // Track purchase initiated
      trackShopInteraction(userId, 'purchase_initiated', 'booster_stripe', {
        product_id: boosterType,
        product_name: booster.name,
        price_amount: booster.priceUsd,
        currency: 'USD'
      });
      
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
        trackShopInteraction(userId, 'purchase_cancelled', 'booster_stripe');
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
    
    // Track purchase initiated
    trackShopInteraction(userId, 'purchase_initiated', 'life', {
      product_id: 'life',
      product_name: '1 Élet',
      price_amount: 25,
      currency: 'coins'
    });
    
    try {
      const { data, error } = await supabase.rpc('purchase_life');
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('1 élet megszerzése sikeres!');
        await fetchProfile();
        
        // Track purchase completed
        trackShopInteraction(userId, 'purchase_completed', 'life', {
          product_id: 'life',
          product_name: '1 Élet',
          price_amount: 25,
          currency: 'coins'
        });
      } else {
        toast.error(result.error || 'Hiba történt');
        trackShopInteraction(userId, 'purchase_cancelled', 'life');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error purchasing life:', error);
      toast.error('Hiba történt a megszerzés során');
      trackShopInteraction(userId, 'purchase_cancelled', 'life');
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
        p_help_type: 'third',
        p_cost: 15
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast.success('1/3 segítség újraaktiválva!');
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
    
    // Track purchase initiated
    trackShopInteraction(userId, 'purchase_initiated', 'booster', {
      product_id: boosterType,
      product_name: booster.name,
      price_amount: booster.price,
      currency: 'coins'
    });
    
    try {
      const { data, error } = await supabase.rpc('activate_booster', {
        p_booster_type: 'max_lives',
        p_cost: booster.price
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (result.success) {
        await purchaseBooster(boosterType);
        toast.success(`${booster.name} booster megszerzése sikeres! +${booster.lives_gained} élet és ${booster.multiplier}x gyorsítás!`);
        await fetchProfile();
        
        // Track purchase completed
        trackShopInteraction(userId, 'purchase_completed', 'booster', {
          product_id: boosterType,
          product_name: booster.name,
          price_amount: booster.price,
          currency: 'coins'
        });
      } else {
        toast.error(result.error || 'Hiba történt');
        trackShopInteraction(userId, 'purchase_cancelled', 'booster');
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error purchasing booster:', error);
      toast.error('Hiba történt a megszerzés során');
      trackShopInteraction(userId, 'purchase_cancelled', 'booster');
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
      name: '1/3 Segítség',
      description: 'Újraaktiválás a következő játékhoz',
      price: 15,
      icon: HelpCircle,
      action: reactivateHelp5050,
      disabled: profile.help_third_active
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
      <QuickBuyOptInDialogFixed 
        open={showQuickBuyDialog} 
        onAccept={handleQuickBuyAccept}
        onDecline={handleQuickBuyDecline}
      />
      <GeniusSubscriptionDialog
        open={showGeniusDialog}
        onOpenChange={setShowGeniusDialog}
      />
      
      <div className="space-y-8">
        {/* User Coins Display - 3D Box Style */}
        <div className="relative rounded-2xl p-6 text-center overflow-hidden">
          {/* BASE SHADOW */}
          <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
          
          {/* OUTER FRAME */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-900 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20" aria-hidden />
          
          {/* MIDDLE FRAME */}
          <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
          
          {/* INNER LAYER */}
          <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-b from-yellow-500/40 via-yellow-600/40 to-yellow-700/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
          
          {/* SPECULAR HIGHLIGHT */}
          <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.18) 40%, transparent 70%)' }} aria-hidden />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3">
              <Coins className="w-8 h-8 text-yellow-100 drop-shadow-lg" />
              <span className="text-3xl font-bold text-white drop-shadow-lg">{profile.coins}</span>
            </div>
            <p className="text-white drop-shadow-lg mt-2">Jelenlegi egyenleged</p>
          </div>
        </div>

        {/* Tips & Tricks Section - ONLY for Genius members */}
        {isGenius && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                Tippek & Trükkök
              </h2>
            </div>
            <p className="text-white/80 mb-4">
              Exkluzív videók csak Genius tagoknak!
            </p>
            
            <TipsVideosGrid 
              isGenius={isGenius} 
              onSubscribeClick={() => setShowGeniusDialog(true)} 
            />
          </div>
        )}

        {/* Subscription Info Box - only show if NOT Genius */}
        {!isGenius && (
          <div className="relative rounded-xl p-4 backdrop-blur-sm overflow-hidden animate-pulse" data-tutorial="genius-section" style={{ animationDuration: '3s' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-purple-500/30 via-purple-600/30 to-purple-700/30" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.12), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)' }} aria-hidden />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/30 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                </div>
                <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-lg">Genius Előfizetés</h3>
              </div>
              <p className="text-white/90 text-sm mb-3 font-semibold drop-shadow-lg">
                🌟 Dupla napi jutalmak, 50% kedvezmény speed boosterekre, 25% kedvezmény valódi pénzes megszerzéseknél, és exkluzív Tippek & Trükkök videók!
              </p>
              <button 
                onClick={() => setShowGeniusDialog(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black py-3 px-4 rounded-lg transition-all shadow-lg shadow-yellow-500/50"
              >
                Előfizetek $2.99/hó
              </button>
            </div>
          </div>
        )}

        {/* Speed Boosters Section */}
        <div className="space-y-4" data-tutorial="boosters-section">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Boosterek</h2>
          </div>
          <p className="text-white/80 mb-4">
            Szerezz meg boostereket aranyérméért – aktiváld őket a játék előtt!
          </p>
          
          {/* Responsive grid: 2-3 cols mobile, 3-4 tablet */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-full overflow-x-hidden">
            {boosterItems.map((item) => (
              <div 
                key={item.id} 
                className="relative rounded-xl p-3 overflow-hidden hover:scale-105 transition-all flex flex-col min-h-[200px] md:min-h-[220px]"
              >
                {/* BASE SHADOW */}
                <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(5px)' }} aria-hidden />
                
                {/* OUTER FRAME */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/40 shadow-lg shadow-purple-500/20" aria-hidden />
                
                {/* MIDDLE FRAME */}
                <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
                
                {/* INNER LAYER */}
                <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-[#1a1a3e]/90 via-[#0f0f2e]/90 to-[#1a1a3e]/90" style={{ boxShadow: 'inset 0 6px 16px rgba(255,255,255,0.08), inset 0 -6px 16px rgba(0,0,0,0.4)' }} aria-hidden />
                
                {/* SPECULAR HIGHLIGHT */}
                <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)' }} aria-hidden />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Genius Badge */}
                  {isGenius && item.baseCoinPrice && item.baseCoinPrice !== item.price && (
                    <div className="flex justify-end mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500 text-black font-black px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3" />
                        -50%
                      </span>
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className="w-full aspect-video flex items-center justify-center mb-2">
                    <div className="p-3 bg-yellow-500/10 rounded-xl border-2 border-yellow-500/30">
                      <item.icon className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm md:text-base font-bold text-white mb-1 line-clamp-2 break-words drop-shadow-lg">
                    {item.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-white/70 mb-2 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  
                  {/* Price - Coins */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Coins className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        {isGenius && item.baseCoinPrice && item.baseCoinPrice !== item.price ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-bold text-yellow-600/50 line-through">{item.baseCoinPrice}</span>
                            <span className="text-base md:text-lg font-bold text-yellow-400">{item.price}</span>
                          </div>
                        ) : (
                          <span className="text-base md:text-lg font-bold text-yellow-500">{item.price}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => item.action()}
                      disabled={loading === item.id || profile.coins < item.price}
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white text-xs md:text-sm font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading === item.id ? 'Betöltés...' : 'MEGSZERZEM'}
                    </button>

                    {/* Stripe USD purchase option */}
                    {item.priceUsd && (
                      <>
                        <div className="border-t border-white/10 my-1"></div>
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <CreditCard className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {isGenius && item.baseUsdPrice && item.baseUsdPrice !== item.priceUsd ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs font-bold text-green-600/50 line-through">
                                  ${item.baseUsdPrice.toFixed(2)}
                                </span>
                                <span className="text-base md:text-lg font-bold text-green-400">
                                  ${item.priceUsd.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-base md:text-lg font-bold text-green-500">
                                ${item.priceUsd.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => buyWithStripe(item.id as any)}
                          disabled={loading === `stripe-${item.id}`}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs md:text-sm font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {loading === `stripe-${item.id}` ? 'Betöltés...' : (
                            <>
                              <CreditCard className="w-3 h-3" />
                              MEGSZERZEM USD
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Shop Items Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Bolt</h2>
          </div>
          <p className="text-white/80 mb-4">
            Szerezz meg extra életeket és segítségeket aranyérméért
          </p>
          
          {/* Responsive grid: 2-3 cols mobile, 3-4 tablet */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-full overflow-x-hidden">
            {shopItems.map((item) => (
              <div 
                key={item.id} 
                className="relative rounded-xl p-3 overflow-hidden hover:scale-105 transition-all flex flex-col min-h-[180px]"
              >
                {/* BASE SHADOW */}
                <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(5px)' }} aria-hidden />
                
                {/* OUTER FRAME */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/40 shadow-lg shadow-purple-500/20" aria-hidden />
                
                {/* MIDDLE FRAME */}
                <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
                
                {/* INNER LAYER */}
                <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-[#1a1a3e]/90 via-[#0f0f2e]/90 to-[#1a1a3e]/90" style={{ boxShadow: 'inset 0 6px 16px rgba(255,255,255,0.08), inset 0 -6px 16px rgba(0,0,0,0.4)' }} aria-hidden />
                
                {/* SPECULAR HIGHLIGHT */}
                <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)' }} aria-hidden />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon */}
                  <div className="w-full aspect-video flex items-center justify-center mb-2">
                    <div className="p-3 bg-purple-500/10 rounded-xl border-2 border-purple-500/30">
                      <item.icon className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm md:text-base font-bold text-white mb-1 line-clamp-2 break-words drop-shadow-lg">
                    {item.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-white/70 mb-2 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  
                  {/* Price and Button */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-base md:text-lg font-bold text-yellow-500">{item.price}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => item.action()}
                      disabled={loading === item.id || profile.coins < item.price || item.disabled}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white text-xs md:text-sm font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading === item.id ? 'Betöltés...' : 'AKAROM'}
                    </button>
                    
                    {item.disabled && (
                      <p className="text-[10px] text-white/50 mt-1 text-center">
                        Már aktív
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
