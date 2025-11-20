import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const DAILY_GIFT_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DAILY_GIFT_SESSION_KEY = 'daily_gift_dismissed_';

export const useDailyGift = (userId: string | undefined, isPremium: boolean = false) => {
  const { t } = useTranslation();
  const [canClaim, setCanClaim] = useState(false);
  const [weeklyEntryCount, setWeeklyEntryCount] = useState(0);
  const [nextReward, setNextReward] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const checkDailyGift = async () => {
    if (!userId) return;

    try {
      // Check server-side profile data (aligned with claim_daily_gift RPC function)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_gift_streak, daily_gift_last_claimed')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const currentStreak = profile?.daily_gift_streak ?? 0;
      
      // Check if can claim (24h throttle based on daily_gift_last_claimed)
      let canClaimNow = true;
      if (profile?.daily_gift_last_claimed) {
        const lastClaimed = new Date(profile.daily_gift_last_claimed);
        const now = new Date();
        const hoursSince = (now.getTime() - lastClaimed.getTime()) / (1000 * 60 * 60);
        canClaimNow = hoursSince >= 24;
      }

      // Calculate reward based on cycle position (0-6) - matches edge function logic
      const cyclePosition = currentStreak % 7;
      const rewardCoins = DAILY_GIFT_REWARDS[cyclePosition];
      
      setWeeklyEntryCount(currentStreak);
      setNextReward(rewardCoins);
      setCanClaim(canClaimNow);

      // Check sessionStorage (AFTER server check)
      const today = new Date().toISOString().split('T')[0];
      const dismissedToday = sessionStorage.getItem(`${DAILY_GIFT_SESSION_KEY}${today}`);
      
      // User is eligible - show the dialog if not dismissed in session
      if (canClaimNow) {
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
    if (!userId || claiming) return false;
    
    setClaiming(true);
    
    try {
      // Call RPC function (same pattern as Welcome Bonus)
      const { data, error } = await supabase.rpc('claim_daily_gift');
      
      if (error) {
        const errorMsg = error.message || t('rewards.dailyGiftError');
        toast({
          title: t('common.error'),
          description: errorMsg,
          variant: 'destructive'
        });
        return false;
      }
      
      const result = data as { success: boolean; grantedCoins: number; walletBalance: number; streak: number; error?: string };
      
      if (result.success) {
        // Track claim BEFORE showing success message
        trackEvent('daily_gift_claimed', 'daily', result.grantedCoins.toString());
        
        setCanClaim(false);
        setShowPopup(false);
        
        // Mark as dismissed in session storage
        const today = new Date().toISOString().split('T')[0];
        sessionStorage.setItem(`${DAILY_GIFT_SESSION_KEY}${today}`, 'true');
        
        // Show success toast with actual amounts
        toast({
          title: t('rewards.dailyGiftClaimedTitle'),
          description: t('rewards.dailyGiftClaimedDescription', { coins: result.grantedCoins }),
        });
        
        // Refetch wallet to update UI immediately
        if (refetchWallet) await refetchWallet();
        
        return true;
      } else {
        toast({
          title: t('common.error'),
          description: result.error || t('rewards.dailyGiftError'),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error: any) {
      const errorMsg = error?.message || t('rewards.dailyGiftError');
      toast({
        title: t('common.error'),
        description: errorMsg,
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
