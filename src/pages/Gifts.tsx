import { useI18n } from '@/i18n';
import BottomNav from '@/components/BottomNav';
import boxGold from '@/assets/box-gold.svg';
import { useNavigate } from 'react-router-dom';
import { LogOut, Play, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWalletQuery } from '@/hooks/queries/useWalletQuery';
import { LootboxRewardDisplay } from '@/components/LootboxRewardDisplay';
import { useDebounce } from '@/hooks/useDebounce';
import { useMobilePayment } from '@/hooks/useMobilePayment';

interface StoredLootbox {
  id: string;
  status: string;
  open_cost_gold: number;
  source: string;
  created_at: string;
}

const Gifts = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [storedLootboxes, setStoredLootboxes] = useState<StoredLootbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [rewardDisplay, setRewardDisplay] = useState<{ gold: number; life: number } | null>(null);
  const { walletData, refetchWallet } = useWalletQuery(userId);
  const { startPayment, isProcessing } = useMobilePayment();

  // Get user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  // Fetch stored lootboxes
  useEffect(() => {
    if (!userId) return;

    const fetchStoredLootboxes = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase.functions.invoke('lootbox-stored', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          console.error('[Gifts] Error fetching stored lootboxes:', error);
        } else {
          setStoredLootboxes(data?.storedLootboxes || []);
        }
      } catch (err) {
        console.error('[Gifts] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoredLootboxes();

    // Check for payment success in URL params
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      // Payment successful, trigger verification
      const verifyPayment = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { data, error } = await supabase.functions.invoke('verify-lootbox-payment', {
            body: { sessionId },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (error) {
            console.error('[Gifts] Payment verification error:', error);
            toast.error(t('errors.unknown'));
          } else if (data?.success) {
            toast.success(t('gifts.payment_success'));
            // Clear URL params
            window.history.replaceState({}, '', '/gifts');
            // Refetch stored lootboxes
            fetchStoredLootboxes();
          }
        } catch (err) {
          console.error('[Gifts] Payment verification error:', err);
        }
      };
      verifyPayment();
    } else if (paymentStatus === 'canceled') {
      // Sikertelen vásárlás - egységes hibaüzenet és visszairányítás
      toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
      window.history.replaceState({}, '', '/gifts');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  }, [userId, t]);

  const handleOpenLootbox = async (lootboxId: string) => {
    if (openingId || !walletData) return;

    // Find the lootbox to check its source
    const lootbox = storedLootboxes.find(box => box.id === lootboxId);
    if (!lootbox) return;

    // Check if user has enough gold ONLY for non-purchased (drop) lootboxes
    const isPurchased = lootbox.source === 'purchase';
    if (!isPurchased && walletData.coinsCurrent < 150) {
      toast.error(t('lootbox.not_enough_gold'));
      return;
    }

    try {
      setOpeningId(lootboxId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.not_logged_in'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('lootbox-open-stored', {
        body: { lootboxId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('[Gifts] Open error:', error);
        toast.error(t('errors.unknown'));
        return;
      }

      if (data.error === 'NOT_ENOUGH_GOLD') {
        toast.error(t('lootbox.not_enough_gold'));
        return;
      }

      if (data.rewards) {
        // Show animated reward display
        setRewardDisplay({
          gold: data.rewards.gold,
          life: data.rewards.life,
        });

        // Remove opened lootbox from UI
        setStoredLootboxes(prev => prev.filter(box => box.id !== lootboxId));
        
        // Refresh wallet
        await refetchWallet();
      }
    } catch (err) {
      console.error('[Gifts] Unexpected error:', err);
      toast.error(t('errors.unknown'));
    } finally {
      setOpeningId(null);
    }
  };

  const packages = [
    { boxes: 1, price: 199, displayPrice: '$1.99', displayName: '1 Ajándékdoboz', rewardKey: 'gifts.rewards_1_box' },
    { boxes: 3, price: 499, displayPrice: '$4.99', displayName: '3 Ajándékdoboz', rewardKey: 'gifts.rewards_3_boxes' },
    { boxes: 5, price: 999, displayPrice: '$9.99', displayName: '5 Ajándékdoboz', rewardKey: 'gifts.rewards_5_boxes' },
    { boxes: 10, price: 1799, displayPrice: '$17.99', displayName: '10 Ajándékdoboz', rewardKey: 'gifts.rewards_10_boxes' }
  ];

  /**
   * NATÍV MOBILFIZETÉS (Apple Pay / Google Pay)
   * 
   * Közvetlen gombnyomásra megjelenik a natív fizetési sheet.
   * Fallback: ha natív fizetés nem elérhető, Stripe kártyás form.
   */
  const handlePurchaseRaw = async (pkg: typeof packages[0]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.not_logged_in'));
        return;
      }

      // Natív mobilfizetés indítása
      await startPayment({
        productType: 'lootbox',
        amount: pkg.price, // cents (199 = $1.99)
        currency: 'usd',
        displayName: pkg.displayName,
        metadata: { boxes: pkg.boxes.toString() },
        onSuccess: async () => {
          // Sikeres fizetés után lootbox lista frissítése
          const { data: updatedBoxes } = await supabase
            .from('lootbox_instances')
            .select('*')
            .eq('user_id', userId!)
            .eq('status', 'stored')
            .order('created_at', { ascending: false });

          if (updatedBoxes) {
            setStoredLootboxes(updatedBoxes);
          }
          
          await refetchWallet();
        },
        onError: (error) => {
          console.error('[Gifts] Payment error:', error);
          toast.error(`${t('errors.unknown')}: ${error}`);
        }
      });
    } catch (err) {
      console.error('[Gifts] Unexpected payment error:', err);
      toast.error(t('errors.unknown'));
    }
  };

  // Debounced version to prevent double-click
  const [handlePurchase, isPurchasing] = useDebounce(handlePurchaseRaw, 500);

  return (
    <>
      {/* Reward display overlay */}
      {rewardDisplay && (
        <LootboxRewardDisplay
          gold={rewardDisplay.gold}
          life={rewardDisplay.life}
          onClose={() => setRewardDisplay(null)}
        />
      )}

      <div className="h-[100dvh] bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/game-background.png')] bg-cover bg-center opacity-10 pointer-events-none" />

      <div
        className="relative z-10 flex-1 flex justify-center overflow-hidden"
        style={{ height: 'calc(100dvh - var(--bottom-nav-h) - env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex-1 flex flex-col justify-between" style={{ maxWidth: 'clamp(576px, 90vw, 672px)', margin: '0 auto', padding: 'clamp(0.375rem, 1vh, 0.5rem) clamp(0.75rem, 2vw, 1rem)' }}>
          {/* Header with Back and Play buttons */}
          <div className="flex items-center justify-between gap-2" style={{ marginBottom: 'clamp(0.25rem, 1vh, 0.5rem)' }}>
            {/* Back Button - Left */}
            <button
              onClick={() => navigate('/dashboard')}
              className="relative rounded-full hover:scale-110 transition-all flex-shrink-0"
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                minWidth: 'clamp(40px, 10vw, 56px)',
                minHeight: 'clamp(40px, 10vw, 56px)'
              }}
              title={t('profile.back_to_dashboard')}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(clamp(2px, 0.6vw, 3px), clamp(2px, 0.6vh, 3px))', filter: 'blur(clamp(3px, 0.8vw, 4px))' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" style={{ inset: 0 }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ inset: 'clamp(2px, 0.6vw, 3px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ inset: 'clamp(3px, 0.8vw, 5px)', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset: 'clamp(3px, 0.8vw, 5px)', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
              
              {/* Icon */}
              <LogOut 
                className="text-white relative z-10 -scale-x-100" 
                style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }}
              />
            </button>

            {/* Title - Center */}
            <div className="flex-1 flex flex-col items-center">
              <h1 
                className="font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]"
                style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.875rem)' }}
              >
                {t('gifts.title')}
              </h1>
              <p 
                className="text-yellow-300/80 text-center"
                style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)', marginTop: 'clamp(0.125rem, 0.5vh, 0.25rem)' }}
              >
                {t('lootbox.open_cost')}
              </p>
            </div>

            {/* Play Button - Right */}
            <button
              onClick={() => navigate('/game')}
              className="relative rounded-full hover:scale-110 transition-all flex-shrink-0"
              style={{ 
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                minWidth: 'clamp(40px, 10vw, 56px)',
                minHeight: 'clamp(40px, 10vw, 56px)'
              }}
              title="Play Game"
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(clamp(2px, 0.6vw, 3px), clamp(2px, 0.6vh, 3px))', filter: 'blur(clamp(3px, 0.8vw, 4px))' }} aria-hidden />
              
              {/* OUTER FRAME - Green */}
              <div className="absolute rounded-full bg-gradient-to-br from-green-700 via-green-600 to-green-900 border-2 border-green-400/50 shadow-lg" style={{ inset: 0 }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute rounded-full bg-gradient-to-b from-green-600 via-green-500 to-green-800" style={{ inset: 'clamp(2px, 0.6vw, 3px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute rounded-full bg-gradient-to-b from-green-500 via-green-600 to-green-700" style={{ inset: 'clamp(3px, 0.8vw, 5px)', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute rounded-full pointer-events-none" style={{ inset: 'clamp(3px, 0.8vw, 5px)', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
              
              {/* Icon */}
              <Play 
                className="text-white relative z-10 fill-white" 
                style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }}
              />
            </button>
          </div>

          {/* Header removed from here as it's now part of the button row above */}

          {/* My Reward Boxes Section */}
          <div style={{ marginBottom: 'clamp(10px, 2.5vh, 18px)' }}>
            <h2 
              className="font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]"
              style={{ 
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
                marginBottom: 'clamp(6px, 1.5vh, 12px)'
              }}
            >
              {t('gifts.my_boxes')}
            </h2>
            <div 
              className="grid grid-cols-5"
              style={{ gap: 'clamp(5px, 1.2vw, 10px)' }}
            >
              {loading ? (
                // Loading skeleton
                Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="relative aspect-square bg-black/40 border border-yellow-500/30 flex items-center justify-center backdrop-blur-sm opacity-40 animate-pulse"
                    style={{ borderRadius: 'clamp(6px, 1.5vw, 8px)' }}
                  >
                    <div className="bg-yellow-500/20" style={{ width: '75%', height: '75%', borderRadius: 'clamp(4px, 1vw, 6px)' }} />
                  </div>
                ))
              ) : (
                // Actual slots
                Array.from({ length: 10 }).map((_, index) => {
                  const lootbox = storedLootboxes[index];
                  const isActive = !!lootbox;

                  const boxContent = (
                    <>
                      <img src={boxGold} alt="Gift box" className="object-contain" style={{ width: '75%', height: '75%' }} />
                      
                      {!isActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span 
                            className="font-bold text-yellow-400/60"
                            style={{ fontSize: 'clamp(8px, 2vw, 10px)' }}
                          >
                            {t('gifts.inactive')}
                          </span>
                        </div>
                      )}

                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 flex justify-center" style={{ paddingBottom: 'clamp(2px, 0.5vh, 4px)' }}>
                          <span
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold shadow-lg"
                            style={{ fontSize: 'clamp(7px, 1.8vw, 9px)', padding: 'clamp(1px, 0.3vh, 2px) clamp(4px, 1vw, 8px)', borderRadius: 'clamp(2px, 0.5vw, 3px)' }}
                          >
                            {openingId === lootbox.id ? (
                              <Loader2 style={{ width: 'clamp(10px, 2.5vw, 12px)', height: 'clamp(10px, 2.5vw, 12px)' }} className="animate-spin" />
                            ) : (
                              t('lootbox.open')
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  );

                  if (isActive) {
                    return (
                    <button
                      key={lootbox.id}
                      onClick={() => handleOpenLootbox(lootbox.id)}
                      disabled={!!openingId}
                      className={`relative aspect-square border flex items-center justify-center backdrop-blur-sm bg-black/60 border-yellow-500/60 opacity-100 transition-all hover:bg-black/70 hover:border-yellow-400/80 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                      style={{ borderRadius: 'clamp(6px, 1.5vw, 8px)' }}
                    >
                        {boxContent}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={`empty-${index}`}
                      className={`relative aspect-square border flex items-center justify-center backdrop-blur-sm bg-black/40 border-yellow-500/30 opacity-40`}
                      style={{ borderRadius: 'clamp(6px, 1.5vw, 8px)' }}
                    >
                      {boxContent}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Get New Rewards Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <h2 
              className="font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]"
              style={{ 
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
                marginBottom: 'clamp(6px, 1.5vh, 12px)'
              }}
            >
              {t('gifts.get_new')}
            </h2>
            <div 
              className="grid grid-cols-2"
              style={{ gap: 'clamp(5px, 1.2vw, 10px)', paddingBottom: 'clamp(2px, 0.8vh, 6px)' }}
            >
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className="relative rounded-xl backdrop-blur-sm transform-gpu hover:scale-105 transition-transform cursor-pointer"
                  style={{ padding: 'clamp(7px, 1.8vw, 14px)', borderRadius: 'clamp(10px, 2.5vw, 12px)' }}
                >
                  {/* 3D Frame Effects */}
                  <div className="absolute rounded-xl bg-black/35 blur-md" style={{ top: 'clamp(2px, 0.5vw, 3px)', left: 'clamp(2px, 0.5vw, 3px)', right: 'clamp(-2px, -0.5vw, -3px)', bottom: 'clamp(-2px, -0.5vw, -3px)', borderRadius: 'clamp(10px, 2.5vw, 12px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-700/40 via-yellow-600/30 to-yellow-900/40 border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.4),0_8px_25px_rgba(0,0,0,0.5)]" style={{ borderRadius: 'clamp(10px, 2.5vw, 12px)' }} aria-hidden />
                  <div className="absolute rounded-xl bg-gradient-to-b from-yellow-600/30 via-yellow-500/20 to-yellow-800/30" style={{ top: 'clamp(2px, 0.5vw, 3px)', left: 'clamp(2px, 0.5vw, 3px)', right: 'clamp(2px, 0.5vw, 3px)', bottom: 'clamp(2px, 0.5vw, 3px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)', borderRadius: 'clamp(10px, 2.5vw, 12px)' }} aria-hidden />
                  <div className="absolute rounded-xl bg-gradient-to-b from-black/50 via-black/60 to-black/70" style={{ top: 'clamp(4px, 1vw, 5px)', left: 'clamp(4px, 1vw, 5px)', right: 'clamp(4px, 1vw, 5px)', bottom: 'clamp(4px, 1vw, 5px)', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)', borderRadius: 'clamp(8px, 2vw, 10px)' }} aria-hidden />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <img 
                      src={boxGold} 
                      alt="Gift box" 
                      className="object-contain"
                      style={{ 
                        width: 'clamp(44px, 11vw, 72px)', 
                        height: 'clamp(44px, 11vw, 72px)',
                        marginBottom: 'clamp(4px, 1vh, 8px)'
                      }}
                    />
                    <p 
                      className="font-black text-yellow-400"
                      style={{ 
                        fontSize: 'clamp(0.95rem, 3.8vw, 1.4rem)',
                        marginBottom: 'clamp(2px, 0.5vh, 4px)'
                      }}
                    >
                      {pkg.boxes} {pkg.boxes === 1 ? t('gifts.box_singular') : t('gifts.box_plural')}
                    </p>
                    <p 
                      className="text-yellow-300/80"
                      style={{ 
                        fontSize: 'clamp(0.6rem, 2.3vw, 0.8rem)',
                        marginBottom: 'clamp(2px, 0.5vh, 4px)'
                      }}
                    >
                      {t(pkg.rewardKey)}
                    </p>
                    <p 
                      className="font-bold text-white"
                      style={{ 
                        fontSize: 'clamp(0.82rem, 3.2vw, 1.15rem)',
                        marginBottom: 'clamp(3px, 0.9vh, 7px)'
                      }}
                    >
                      {pkg.displayPrice}
                    </p>
                    <button 
                      onClick={() => handlePurchase(pkg)}
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 font-bold text-black shadow-lg transition-all"
                      style={{ 
                        padding: 'clamp(3px, 0.9vh, 7px) clamp(7px, 1.8vw, 14px)',
                        fontSize: 'clamp(0.72rem, 2.8vw, 0.95rem)',
                        borderRadius: 'clamp(6px, 1.5vw, 8px)'
                      }}
                    >
                      {t('gifts.acquire')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
      </div>
    </>
  );
};

export default Gifts;
