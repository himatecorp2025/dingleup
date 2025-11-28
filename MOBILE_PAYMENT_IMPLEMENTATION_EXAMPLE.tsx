/**
 * PÉLDAKÓD: Gifts.tsx átkötése natív mobilfizetésre
 * 
 * Ez a fájl bemutatja, hogyan kell a meglévő lootbox vásárlási gombokat
 * átkötni a központi mobilfizetési rendszerre.
 */

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
import { useMobilePayment } from '@/hooks/useMobilePayment'; // ← ÚJ IMPORT

interface StoredLootbox {
  id: string;
  status: string;
  open_cost_gold: number;
  source: string;
  created_at: string;
}

const GiftsWithMobilePayment = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [storedLootboxes, setStoredLootboxes] = useState<StoredLootbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [rewardDisplay, setRewardDisplay] = useState<{ gold: number; life: number } | null>(null);
  const { walletData, refetchWallet } = useWalletQuery(userId);
  
  // ← ÚJ: Mobilfizetési hook inicializálás
  const { startPayment, isProcessing } = useMobilePayment();

  // ... (user session check, lootbox loading, stb.)

  /**
   * Lootbox megnyitás logika - VÁLTOZATLAN
   */
  const handleOpenLootbox = async (lootboxId: string) => {
    // ... (meglévő kód)
  };

  /**
   * Lootbox vásárlás csomag definíciók
   * ÚJ: price most cents-ben (199 = $1.99), priceId már nem kell
   */
  const packages = [
    { boxes: 1, price: 199, displayName: '1 Ajándékdoboz', rewardKey: 'gifts.rewards_1_box' },
    { boxes: 3, price: 499, displayName: '3 Ajándékdoboz', rewardKey: 'gifts.rewards_3_boxes' },
    { boxes: 5, price: 999, displayName: '5 Ajándékdoboz', rewardKey: 'gifts.rewards_5_boxes' },
    { boxes: 10, price: 1799, displayName: '10 Ajándékdoboz', rewardKey: 'gifts.rewards_10_boxes' }
  ];

  /**
   * LOOTBOX VÁSÁRLÁS - ÚJ NATÍV MOBILFIZETÉSSEL
   * 
   * Előtte: Stripe Checkout redirect (új oldalra navigálás)
   * Utána: Natív fizetési sheet (Apple Pay / Google Pay)
   */
  const handlePurchaseRaw = async (pkg: typeof packages[0]) => {
    try {
      // Auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.not_logged_in'));
        return;
      }

      // ← ÚJ: Natív mobilfizetés indítása
      await startPayment({
        productType: 'lootbox',
        amount: pkg.price, // cents (199 = $1.99)
        currency: 'usd',
        displayName: pkg.displayName,
        metadata: { boxes: pkg.boxes.toString() },
        
        // Sikeres fizetés után lootbox lista frissítése
        onSuccess: async () => {
          toast.success('Sikeres vásárlás! 🎉');
          
          // Lootbox instances újratöltése
          const { data: updatedBoxes } = await supabase
            .from('lootbox_instances')
            .select('*')
            .eq('user_id', userId!)
            .eq('status', 'stored')
            .order('created_at', { ascending: false });

          if (updatedBoxes) {
            setStoredLootboxes(updatedBoxes);
          }
          
          // Wallet frissítése
          await refetchWallet();
        },
        
        // Hibaelhárítás
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

  // Debounced version (dupla kattintás elleni védelem)
  const handlePurchase = useDebounce(handlePurchaseRaw, 500);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-secondary/80 backdrop-blur-sm rounded-full hover:bg-secondary transition-colors"
          >
            <LogOut className="h-6 w-6 text-foreground" />
          </button>

          <h1 className="text-2xl font-bold text-primary">
            {t('gifts.title')}
          </h1>

          <button
            onClick={() => navigate('/game')}
            className="p-2 bg-primary/80 backdrop-blur-sm rounded-full hover:bg-primary transition-colors"
          >
            <Play className="h-6 w-6 text-primary-foreground" />
          </button>
        </div>

        {/* My Reward Boxes section - VÁLTOZATLAN */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">
            {t('gifts.my_reward_boxes')}
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[...Array(10)].map((_, idx) => {
                const lootbox = storedLootboxes[idx];
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center relative
                      ${lootbox 
                        ? 'border-primary bg-primary/10 cursor-pointer hover:bg-primary/20 transition-all hover:scale-105' 
                        : 'border-muted bg-muted/5'
                      }`}
                    onClick={() => lootbox && handleOpenLootbox(lootbox.id)}
                  >
                    {lootbox ? (
                      openingId === lootbox.id ? (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      ) : (
                        <>
                          <img src={boxGold} alt="Ajándékdoboz" className="w-20 h-20" />
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="text-xs font-semibold text-primary bg-background/80 px-2 py-1 rounded">
                              {t('gifts.open_box')}
                            </span>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="text-muted-foreground/40 text-5xl font-bold">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Get New Rewards section - ÚJ GOMBOK */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">
            {t('gifts.get_new_rewards')}
          </h2>

          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.boxes}
                className="bg-card border-2 border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <img src={boxGold} alt="Ajándékdoboz" className="w-12 h-12" />
                    <div>
                      <h3 className="font-bold text-lg">
                        {pkg.boxes} {pkg.boxes === 1 ? t('gifts.box') : t('gifts.boxes')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(pkg.rewardKey)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${(pkg.price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* ← ÚJ: Vásárlás gomb natív mobilfizetéssel */}
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={isProcessing}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-lg 
                    hover:bg-primary/90 transition-all hover:scale-[1.02] disabled:opacity-50 
                    disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('gifts.processing')}
                    </>
                  ) : (
                    t('gifts.get_it')
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reward display overlay - VÁLTOZATLAN */}
      {rewardDisplay && (
        <LootboxRewardDisplay
          gold={rewardDisplay.gold}
          life={rewardDisplay.life}
          onClose={() => setRewardDisplay(null)}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default GiftsWithMobilePayment;
