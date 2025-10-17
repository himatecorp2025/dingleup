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
      console.error('Error checking daily gift:', error);
    }
  };

  const claimDailyGift = async () => {
    if (!userId || !canClaim) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins, daily_gift_streak')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const newStreak = (profile.daily_gift_streak || 0) + 1;
      const reward = DAILY_GIFT_REWARDS[(newStreak - 1) % 7];

      const { error } = await supabase
        .from('profiles')
        .update({
          coins: profile.coins + reward,
          daily_gift_streak: newStreak,
          daily_gift_last_claimed: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '🎁 Napi ajándék',
        description: `+${reward} aranyérme a ${newStreak}. belépésért!`,
      });

      setCanClaim(false);
      setCurrentStreak(newStreak);
      setNextReward(DAILY_GIFT_REWARDS[newStreak % 7]);
    } catch (error) {
      console.error('Error claiming daily gift:', error);
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