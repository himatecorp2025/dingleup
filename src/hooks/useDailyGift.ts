import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DAILY_GIFT_REWARDS = [50, 75, 110, 160, 220, 300, 500];

export const useDailyGift = (userId: string | undefined) => {
  const [canClaim, setCanClaim] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [nextReward, setNextReward] = useState(0);

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

      // Check if it's a new week (Monday reset)
      const isNewWeek = lastClaimed && now.getDay() === 1 && lastClaimed.getDay() !== 1;
      
      // Check if already claimed today
      const isToday = lastClaimed && 
        lastClaimed.getDate() === now.getDate() &&
        lastClaimed.getMonth() === now.getMonth() &&
        lastClaimed.getFullYear() === now.getFullYear();

      let streak = profile.daily_gift_streak || 0;
      
      if (isNewWeek) {
        streak = 0; // Reset on new week
      }

      setCurrentStreak(streak);
      setNextReward(DAILY_GIFT_REWARDS[streak % 7]);
      setCanClaim(!isToday);
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
        toast({
          title: '🎁 Napi ajándék',
          description: `+${result.coins} aranyérme a ${result.streak}. belépésért!`,
        });

        setCanClaim(false);
        setCurrentStreak(result.streak);
        setNextReward(DAILY_GIFT_REWARDS[result.streak % 7]);
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

  useEffect(() => {
    checkDailyGift();
  }, [userId]);

  return {
    canClaim,
    currentStreak,
    nextReward,
    claimDailyGift,
    checkDailyGift
  };
};