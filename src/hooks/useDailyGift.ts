import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';

const DAILY_GIFT_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DAILY_GIFT_SESSION_KEY = 'daily_gift_dismissed_';

export const useDailyGift = (userId: string | undefined, isPremium: boolean = false) => {
  const { t } = useI18n();
  const [canClaim, setCanClaim] = useState(false);
  const [weeklyEntryCount, setWeeklyEntryCount] = useState(0);
  const [nextReward, setNextReward] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const checkDailyGift = async () => {
    if (!userId) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, daily_gift_streak, daily_gift_last_claimed')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // TESTING MODE: Always show for DingleUP admin user (design testing)
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        const currentStreak = profile?.daily_gift_streak ?? 0;
        const cyclePosition = currentStreak % 7;
        const rewardCoins = DAILY_GIFT_REWARDS[cyclePosition];
        
        setWeeklyEntryCount(currentStreak);
        setNextReward(rewardCoins);
        setCanClaim(true);
        setShowPopup(true);
        trackEvent('popup_impression', 'daily');
        return;
      }

      // Check session storage for today's dismissal/claim
      const today = new Date().toISOString().split('T')[0];
      const dismissed = sessionStorage.getItem(`${DAILY_GIFT_SESSION_KEY}${today}`);
      
      // If already dismissed or claimed today, don't show
      if (dismissed) {
        setCanClaim(false);
        setShowPopup(false);
        return;
      }

      // Check if already claimed today
      const lastClaimed = profile?.daily_gift_last_claimed;
      if (lastClaimed) {
        const lastClaimedDate = new Date(lastClaimed).toISOString().split('T')[0];
        if (lastClaimedDate === today) {
          // Already claimed today
          setCanClaim(false);
          setShowPopup(false);
          return;
        }
      }

      const currentStreak = profile?.daily_gift_streak ?? 0;
      
      // Calculate reward based on cycle position (0-6) - matches edge function logic
      const cyclePosition = currentStreak % 7;
      const rewardCoins = DAILY_GIFT_REWARDS[cyclePosition];
      
      setWeeklyEntryCount(currentStreak);
      setNextReward(rewardCoins);
      setCanClaim(true);
      setShowPopup(true);
      trackEvent('popup_impression', 'daily');
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
      // TESTING MODE: Check if this is DingleUP admin user
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, daily_gift_streak')
        .eq('id', userId)
        .single();

      // TESTING MODE: Don't actually claim for DingleUP admin (allow re-testing)
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        const currentStreak = profile?.daily_gift_streak ?? 0;
        const cyclePosition = currentStreak % 7;
        const rewardCoins = DAILY_GIFT_REWARDS[cyclePosition];
        
        trackEvent('daily_gift_claimed', 'daily', rewardCoins.toString());
        setCanClaim(false);
        setShowPopup(false);
        
        toast({
          title: t('daily.claimed_title'),
          description: `+${rewardCoins} ${t('daily.gold')} (TESZT MÓD)`,
        });
        
        return true;
      }

      // Call RPC function (same pattern as Welcome Bonus)
      const { data, error } = await supabase.rpc('claim_daily_gift');
      
      if (error) {
        const errorMsg = error.message || t('daily.claim_error');
        toast({
          title: t('errors.error_title'),
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
          title: t('daily.claimed_title'),
          description: `+${result.grantedCoins} ${t('daily.gold')}`,
        });
        
        // Refetch wallet to update UI immediately
        if (refetchWallet) await refetchWallet();
        
        return true;
      } else {
        // Translate error codes from backend to i18n keys
        let errorKey = 'daily.claim_error';
        if (result.error === 'NOT_LOGGED_IN') {
          errorKey = 'daily.error.not_logged_in';
        } else if (result.error === 'PROFILE_NOT_FOUND') {
          errorKey = 'daily.error.profile_not_found';
        } else if (result.error === 'ALREADY_CLAIMED_TODAY') {
          errorKey = 'daily.error.already_claimed_today';
        } else if (result.error === 'SERVER_ERROR') {
          errorKey = 'daily.error.server_error';
        }
        
        toast({
          title: t('errors.error_title'),
          description: t(errorKey),
          variant: 'destructive'
        });
        return false;
      }
    } catch (error: any) {
      const errorMsg = error?.message || t('daily.claim_error');
      toast({
        title: t('errors.error_title'),
        description: errorMsg,
        variant: 'destructive'
      });
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = async () => {
    if (!userId) return;
    
    try {
      // TESTING MODE: Check if this is DingleUP admin user
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      // TESTING MODE: Don't mark as dismissed for DingleUP admin (allow re-testing)
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        setShowPopup(false);
        
        // Track analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'popup_dismissed', {
            event_category: 'daily_gift',
            event_label: 'user_dismissed',
          });
        }
        return;
      }

      // Mark as dismissed for today (CONSISTENT KEY)
      const today = new Date().toISOString().split('T')[0];
      sessionStorage.setItem(`${DAILY_GIFT_SESSION_KEY}${today}`, 'dismissed');
      
      // Close popup
      setShowPopup(false);
      
      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'popup_dismissed', {
          event_category: 'daily_gift',
          event_label: 'user_dismissed',
        });
      }
    } catch (error) {
      // Even on error, close popup
      setShowPopup(false);
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
