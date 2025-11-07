import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DAILY_GIFT_REWARDS = [50, 75, 110, 160, 220, 300, 500];

export const useDailyGift = (userId: string | undefined, isPremium: boolean = false) => {
  const [canClaim, setCanClaim] = useState(false);
  const [weeklyEntryCount, setWeeklyEntryCount] = useState(0);
  const [nextReward, setNextReward] = useState(0);
  const [hasSeenToday, setHasSeenToday] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const checkDailyGift = async () => {
    if (!userId) return;

    try {
      // Get current week start
      const { data: weekData, error: weekError } = await supabase
        .rpc('get_current_week_start');
      
      if (weekError) throw weekError;
      const weekStart = weekData as string;

      // Get weekly login state
      const { data: loginState } = await supabase
        .from('weekly_login_state')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single();

      const currentIndex = loginState?.awarded_login_index || 0;
      
      // Check if can claim (24h throttle)
      let canClaimNow = true;
      if (loginState?.last_counted_at) {
        const lastCounted = new Date(loginState.last_counted_at);
        const now = new Date();
        const hoursSince = (now.getTime() - lastCounted.getTime()) / (1000 * 60 * 60);
        canClaimNow = hoursSince >= 24;
      }

      // Get reward configuration for next day
      const { data: rewardConfig } = await supabase
        .from('weekly_login_rewards')
        .select('*')
        .eq('reward_index', currentIndex + 1)
        .single();

      const baseReward = rewardConfig?.gold_amount || 0;
      
      setWeeklyEntryCount(currentIndex);
      setNextReward(baseReward);
      setCanClaim(canClaimNow && baseReward > 0);

      if (import.meta.env.DEV) {
        console.log('[DailyGift] Can claim:', canClaimNow, 'day', currentIndex + 1, 'reward:', baseReward);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking daily gift:', error);
      }
    }
  };

  const showDailyGiftPopup = () => {
    if (canClaim) {
      setShowPopup(true);
      trackEvent('popup_impression', 'daily');
      console.log('[DailyGift] Manually showing popup for day', weeklyEntryCount + 1, 'reward:', nextReward);
    }
  };

  const claimDailyGift = async (refetchWallet?: () => Promise<void>) => {
    if (!userId || !canClaim) return false;

    try {
      // Call weekly-login-reward edge function
      const { data, error } = await supabase.functions.invoke('weekly-login-reward', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: '🎁 Napi bejelentkezési jutalom',
          description: `${data.login_index}. nap: +${data.gold_awarded} arany${data.lives_awarded > 0 ? ` és +${data.lives_awarded} élet` : ''}`,
        });

        setCanClaim(false);
        setWeeklyEntryCount(data.login_index);
        
        // Refetch wallet to update balance
        if (refetchWallet) {
          await refetchWallet();
        }

        // Check daily gift again to update state
        await checkDailyGift();

        // Track claim
        trackEvent('popup_cta_click', 'daily', 'claim');
        
        return true;
      } else if (data.throttled) {
        toast({
          title: 'Már igényelted',
          description: data.message || 'Ma már igényelted a belépési jutalmat',
        });
        return false;
      } else {
        toast({
          title: 'Hiba',
          description: data.error || 'Nem sikerült az ajándék átvétele',
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
    setShowPopup(false);
    
    // Track later action
    trackEvent('popup_cta_click', 'daily', 'later');
  };

  useEffect(() => {
    checkDailyGift();
  }, [userId, isPremium]);

  return {
    canClaim, // Jelzi, hogy claimelhető-e
    showPopup, // Popup láthatósága
    weeklyEntryCount,
    nextReward,
    claimDailyGift,
    checkDailyGift,
    handleLater,
    showDailyGiftPopup, // Manuális megjelenítés
    setShowPopup
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