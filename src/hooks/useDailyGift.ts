import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DAILY_GIFT_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DAILY_GIFT_SESSION_KEY = 'daily_gift_dismissed_';

export const useDailyGift = (userId: string | undefined, isPremium: boolean = false) => {
  const [canClaim, setCanClaim] = useState(false);
  const [weeklyEntryCount, setWeeklyEntryCount] = useState(0);
  const [nextReward, setNextReward] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const checkDailyGift = async () => {
    if (!userId) return;

    try {
      // Check if user dismissed today's popup
      const today = new Date().toDateString();
      const dismissedDate = sessionStorage.getItem(DAILY_GIFT_SESSION_KEY + userId);
      if (dismissedDate === today) {
        setCanClaim(false);
        setShowPopup(false);
        return;
      }

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
      
      // Show popup if can claim and not dismissed today
      if (canClaimNow && baseReward > 0 && dismissedDate !== today) {
        setShowPopup(true);
      }

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
      trackEvent('daily_gift_popup_shown', 'daily');
      console.log('[DailyGift] Manually showing popup for day', weeklyEntryCount + 1, 'reward:', nextReward);
    }
  };

  const claimDailyGift = async (refetchWallet?: () => Promise<void>): Promise<boolean> => {
    if (!userId || !canClaim || claiming) return false;

    setClaiming(true);
    try {
      // Call weekly-login-reward edge function
      const { data, error } = await supabase.functions.invoke('weekly-login-reward', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data.success && !data.throttled) {
        toast({
          title: '🎁 Napi bejelentkezési jutalom',
          description: `${data.login_index}. nap: +${data.gold_awarded} arany${data.lives_awarded > 0 ? ` és +${data.lives_awarded} élet` : ''}`,
        });

        setCanClaim(false);
        setShowPopup(false);
        setWeeklyEntryCount(data.login_index);
        
        // Mark as dismissed for today
        const today = new Date().toDateString();
        sessionStorage.setItem(DAILY_GIFT_SESSION_KEY + userId, today);
        
        // Refetch wallet to update balance
        if (refetchWallet) {
          await refetchWallet();
        }

        // Track claim success
        trackEvent('daily_gift_claim_succeeded', 'daily');
        
        setClaiming(false);
        return true;
      } else if (data.throttled) {
        toast({
          title: 'Már igényelted',
          description: data.message || 'Ma már igényelted a belépési jutalmat',
        });
        setShowPopup(false);
        trackEvent('daily_gift_claim_failed', 'daily');
        setClaiming(false);
        return false;
      } else {
        toast({
          title: 'Hiba',
          description: data.error || 'Nem sikerült az ajándék átvétele',
          variant: 'destructive'
        });
        setClaiming(false);
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error claiming daily gift:', error);
      }
      toast({
        title: 'Hiba',
        description: 'Nincs hálózati kapcsolat. Próbáld újra később.',
        variant: 'destructive'
      });
      trackEvent('daily_gift_claim_failed', 'daily');
      setClaiming(false);
      return false;
    }
  };

  const handleLater = () => {
    if (!userId) return;
    
    // Mark as dismissed for today
    const today = new Date().toDateString();
    sessionStorage.setItem(DAILY_GIFT_SESSION_KEY + userId, today);
    
    // Close popup
    setShowPopup(false);
    
    // Track later action
    trackEvent('daily_gift_popup_shown', 'daily', 'later_dismiss');
  };

  useEffect(() => {
    checkDailyGift();
  }, [userId, isPremium]);

  return {
    canClaim,
    showPopup,
    weeklyEntryCount,
    nextReward,
    claiming,
    claimDailyGift,
    checkDailyGift,
    handleLater,
    showDailyGiftPopup,
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