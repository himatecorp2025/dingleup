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
      // STEP 1: Check server-side state FIRST (like Welcome Bonus does)
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

      // STEP 2: Now check sessionStorage (AFTER server check, like Welcome Bonus)
      const today = new Date().toISOString().split('T')[0];
      const dismissedToday = sessionStorage.getItem(`daily_gift_dismissed_${today}`);
      
      // STEP 3: User is eligible - show the dialog (even if dismissed in session, let parent component decide)
      if (canClaimNow && baseReward > 0) {
        
        // Only auto-show if NOT dismissed in this session
        if (!dismissedToday) {
          setShowPopup(true);
          trackEvent('popup_impression', 'daily');
        } else {
          setShowPopup(false);
        }
      } else {
        setShowPopup(false);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const showDailyGiftPopup = () => {
    if (canClaim) {
      setShowPopup(true);
      trackEvent('daily_gift_popup_shown', 'daily');
    }
  };

  const claimDailyGift = async (refetchWallet?: () => Promise<void>): Promise<boolean> => {
    if (!userId || !canClaim || claiming) return false;
    
    // Check for offline
    if (!navigator.onLine) {
      toast({
        title: 'Nincs hálózat',
        description: 'Próbáld újra később.',
        variant: 'destructive'
      });
      return false;
    }

    setClaiming(true);
    try {
      // Call new idempotent claim-daily-gift edge function
      const { data, error } = await supabase.functions.invoke('claim-daily-gift', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: `🎁 Napi ajándék átvéve!`,
          description: `${data.grantedCoins} aranyérme a tiéd!`,
        });
        
        setCanClaim(false);
        setShowPopup(false);
        
        // Mark as dismissed in session storage
        const today = new Date().toISOString().split('T')[0];
        sessionStorage.setItem(`daily_gift_dismissed_${today}`, 'true');
        
        // Track successful claim
        trackEvent('daily_gift_claimed', 'daily', data.grantedCoins);
        
        // Refetch wallet to update UI immediately
        if (refetchWallet) await refetchWallet();
        
        return true;
      } else {
        toast({
          title: 'Hiba',
          description: data.error || 'Nem sikerült átvenni az ajándékot.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Hiba',
        description: 'Valami hiba történt. Próbáld újra később.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = () => {
    if (!userId) return;
    
    // Mark as dismissed for today (CONSISTENT KEY)
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem(`daily_gift_dismissed_${today}`, 'dismissed');
    
    // Close popup
    setShowPopup(false);
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'popup_dismissed', {
        event_category: 'daily_gift',
        event_label: 'user_dismissed',
      });
    }
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
};
