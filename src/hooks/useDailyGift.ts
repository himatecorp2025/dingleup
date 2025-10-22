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
      // Check localStorage for today's view
      const todayKey = `daily_gift_seen_${userId}_${new Date().toDateString()}`;
      const seenToday = localStorage.getItem(todayKey) === 'true';
      setHasSeenToday(seenToday);

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
      
      // Can claim if not claimed today AND not seen today
      setCanClaim(!isToday && !seenToday);

      // Track impression if showing
      if (!isToday && !seenToday) {
        trackEvent('popup_impression', 'daily');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking daily gift:', error);
      }
    }
  };

  const claimDailyGift = async () => {
    if (!userId || !canClaim) return;

    try {
      const { data, error } = await supabase.rpc('claim_daily_gift');
      
      if (error) throw error;
      
      const result = data as { success: boolean; coins: number; streak: number; error?: string };
      if (result.success) {
        const actualCoins = isPremium ? result.coins * 2 : result.coins;
        
        toast({
          title: '🎁 Napi ajándék',
          description: `+${actualCoins} aranyérme a ${result.streak}. belépésért!${isPremium ? ' (Genius 2x)' : ''}`,
        });

        setCanClaim(false);
        setWeeklyEntryCount(result.streak);
        setNextReward(isPremium ? DAILY_GIFT_REWARDS[result.streak % 7] * 2 : DAILY_GIFT_REWARDS[result.streak % 7]);
        
        // Mark as seen today
        const todayKey = `daily_gift_seen_${userId}_${new Date().toDateString()}`;
        localStorage.setItem(todayKey, 'true');

        // Track claim
        trackEvent('popup_cta_click', 'daily', 'claim');
      } else {
        toast({
          title: 'Hiba',
          description: result.error || 'Nem sikerült az ajándék átvétele',
          variant: 'destructive'
        });
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
    }
  };

  const handleLater = () => {
    if (!userId) return;
    
    // Mark as seen today
    const todayKey = `daily_gift_seen_${userId}_${new Date().toDateString()}`;
    localStorage.setItem(todayKey, 'true');
    setCanClaim(false);
    
    // Track later action
    trackEvent('popup_cta_click', 'daily', 'later');
  };

  useEffect(() => {
    checkDailyGift();
  }, [userId, isPremium]);

  return {
    canClaim,
    weeklyEntryCount,
    nextReward,
    claimDailyGift,
    checkDailyGift,
    handleLater
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