import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DAILY_GIFT_REWARDS = [50, 75, 110, 160, 220, 300, 500];

export const useDailyGift = (userId: string | undefined, isPremium: boolean = false) => {
  const [canClaim, setCanClaim] = useState(false);
  const [weeklyEntryCount, setWeeklyEntryCount] = useState(0);
  const [nextReward, setNextReward] = useState(0);
  const [hasSeenToday, setHasSeenToday] = useState(false);

  const checkDailyGift = async () => {
    if (!userId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_gift_streak, daily_gift_last_claimed')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const now = new Date();
      const lastClaimed = profile.daily_gift_last_claimed 
        ? new Date(profile.daily_gift_last_claimed)
        : null;
      
      // Check if already claimed today
      const isToday = lastClaimed && 
        lastClaimed.getDate() === now.getDate() &&
        lastClaimed.getMonth() === now.getMonth() &&
        lastClaimed.getFullYear() === now.getFullYear();

      const entryCount = profile.daily_gift_streak || 0;
      const reward = DAILY_GIFT_REWARDS[entryCount % 7];

      setWeeklyEntryCount(entryCount);
      setNextReward(isPremium ? reward * 2 : reward);
      
      // Show popup if not claimed today (megjelenik automatikusan)
      setCanClaim(!isToday);

      // Track impression if showing (only if not claimed today)
      if (!isToday) {
        trackEvent('popup_impression', 'daily');
        console.log('[DailyGift] Showing popup for day', entryCount + 1, 'reward:', isPremium ? reward * 2 : reward);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking daily gift:', error);
      }
    }
  };

  const claimDailyGift = async (refetchWallet?: () => Promise<void>) => {
    if (!userId || !canClaim) return false;

    try {
      const { data, error } = await supabase.rpc('claim_daily_gift');
      
      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        isSubscriber?: boolean;
        baseCoins?: number;
        grantedCoins?: number;
        walletBalance?: number;
        streak: number; 
        error?: string 
      };
      
      if (result.success) {
        // Server-authoritative message
        const isGenius = result.isSubscriber || false;
        const baseAmount = result.baseCoins || 0;
        const grantedAmount = result.grantedCoins || 0;
        
        toast({
          title: '🎁 Napi ajándék',
          description: isGenius 
            ? `Jutalmad: ${baseAmount} → ${grantedAmount} érme (Genius dupla!)` 
            : `Jutalmad: +${grantedAmount} érme`,
        });

        setCanClaim(false);
        setWeeklyEntryCount(result.streak);
        const nextBase = DAILY_GIFT_REWARDS[result.streak % 7];
        setNextReward(isGenius ? nextBase * 2 : nextBase);
        
        // Mark as seen today
        const todayKey = `daily_gift_seen_${userId}_${new Date().toDateString()}`;
        localStorage.setItem(todayKey, 'true');

        // Refetch wallet to update balance
        if (refetchWallet) {
          await refetchWallet();
        }

        // Track claim
        trackEvent('popup_cta_click', 'daily', 'claim');
        
        return true;
      } else {
        toast({
          title: 'Hiba',
          description: result.error || 'Nem sikerült az ajándék átvétele',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error claiming daily gift:', error);
      }
      toast({
        title: 'Hiba',
        description: 'Nem sikerült az ajándék átvétele',
        variant: 'destructive'
      });
      return false;
    }
  };

  const handleLater = () => {
    if (!userId) return;
    
    // Just close the dialog without marking as seen
    // User can come back later same day and claim
    setCanClaim(false);
    
    // Track later action
    trackEvent('popup_cta_click', 'daily', 'later');
  };

  useEffect(() => {
    checkDailyGift();
  }, [userId, isPremium]);

  return {
    canClaim, // A popup megjelenését a hook belsőleg kezeli
    weeklyEntryCount,
    nextReward,
    claimDailyGift,
    checkDailyGift,
    handleLater,
    setCanClaim
  };
};

// Analytics helper
const trackEvent = (event: string, type: string, action?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      type,
      action,
      timestamp: new Date().toISOString()
    });
  }
  
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, { type, action });
  }
};