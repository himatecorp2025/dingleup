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
        .select('username, daily_gift_streak, daily_gift_last_claimed, user_timezone')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      console.log('[DAILY-GIFT] Profile data:', {
        username: profile?.username,
        streak: profile?.daily_gift_streak,
        lastClaimed: profile?.daily_gift_last_claimed,
        timezone: profile?.user_timezone
      });

      // Admin users don't see Daily Gift popup
      if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
        console.log('[DAILY-GIFT] Admin user detected, hiding popup');
        setCanClaim(false);
        setShowPopup(false);
        return;
      }

      // Get today's date in user's timezone (not UTC!)
      const userTimezone = profile?.user_timezone || 'Europe/Budapest';
      const now = new Date();
      
      // Get date components in user's timezone
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      const today = `${year}-${month}-${day}`;
      
      console.log('[DAILY-GIFT] Timezone calculations:', {
        userTimezone,
        nowUTC: now.toISOString(),
        todayInUserTz: today,
      });
      
      // Check session storage for today's dismissal/claim
      const dismissed = sessionStorage.getItem(`${DAILY_GIFT_SESSION_KEY}${today}`);
      console.log('[DAILY-GIFT] Session storage check:', {
        key: `${DAILY_GIFT_SESSION_KEY}${today}`,
        dismissed,
      });
      
      // If already dismissed or claimed today, don't show
      if (dismissed) {
        console.log('[DAILY-GIFT] Already dismissed/claimed today in session');
        setCanClaim(false);
        setShowPopup(false);
        return;
      }

      // Check if already claimed today (compare in user's timezone)
      const lastClaimed = profile?.daily_gift_last_claimed;
      if (lastClaimed) {
        const lastClaimedDate = new Date(lastClaimed);
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: userTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const parts = formatter.formatToParts(lastClaimedDate);
        const year = parts.find(p => p.type === 'year')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const day = parts.find(p => p.type === 'day')?.value;
        const lastClaimedDateStr = `${year}-${month}-${day}`;
        
        console.log('[DAILY-GIFT] Last claimed check:', {
          lastClaimedUTC: lastClaimed,
          lastClaimedDate: lastClaimedDateStr,
          today,
          matches: lastClaimedDateStr === today,
        });
        
        if (lastClaimedDateStr === today) {
          console.log('[DAILY-GIFT] Already claimed today in database');
          setCanClaim(false);
          setShowPopup(false);
          return;
        }
      } else {
        console.log('[DAILY-GIFT] No previous claim found');
      }

      const currentStreak = profile?.daily_gift_streak ?? 0;
      
      // Calculate reward based on cycle position (0-6) - matches edge function logic
      const cyclePosition = currentStreak % 7;
      const rewardCoins = DAILY_GIFT_REWARDS[cyclePosition];
      
      console.log('[DAILY-GIFT] Can claim! Reward:', {
        currentStreak,
        cyclePosition,
        rewardCoins,
      });
      
      setWeeklyEntryCount(currentStreak);
      setNextReward(rewardCoins);
      setCanClaim(true);
      setShowPopup(true);
      trackEvent('popup_impression', 'daily');
    } catch (error) {
      console.error('[DAILY-GIFT] Error in checkDailyGift:', error);
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
      // Call RPC function
      const { data, error } = await supabase.rpc('claim_daily_gift');
      
      if (error) {
        const errorMsg = error.message || t('daily.claim_error');
        toast({
          title: t('errors.error_title'),
          description: errorMsg,
          variant: 'destructive',
          duration: 4000,
        });
        return false;
      }
      
      const result = data as { success: boolean; grantedCoins: number; walletBalance: number; streak: number; error?: string };
      
      if (result.success) {
        // Track claim BEFORE showing success message
        trackEvent('daily_gift_claimed', 'daily', result.grantedCoins.toString());
        
        setCanClaim(false);
        setShowPopup(false);
        
        // Get user timezone for accurate date
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_timezone')
          .eq('id', userId)
          .single();
        
        const userTimezone = profile?.user_timezone || 'Europe/Budapest';
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: userTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const parts = formatter.formatToParts(now);
        const year = parts.find(p => p.type === 'year')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const day = parts.find(p => p.type === 'day')?.value;
        const today = `${year}-${month}-${day}`;
        
        // Mark as dismissed in session storage
        sessionStorage.setItem(`${DAILY_GIFT_SESSION_KEY}${today}`, 'true');
        
        // Show success toast with actual amounts
        toast({
          title: t('daily.claimed_title'),
          description: `+${result.grantedCoins} ${t('daily.gold')}`,
          duration: 3000,
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
          variant: 'destructive',
          duration: 4000,
        });
        return false;
      }
    } catch (error: any) {
      const errorMsg = error?.message || t('daily.claim_error');
      toast({
        title: t('errors.error_title'),
        description: errorMsg,
        variant: 'destructive',
        duration: 4000,
      });
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const handleLater = async () => {
    if (!userId) return;
    
    try {
      // Get user timezone for accurate date
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_timezone')
        .eq('id', userId)
        .single();
      
      const userTimezone = profile?.user_timezone || 'Europe/Budapest';
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      const today = `${year}-${month}-${day}`;
      
      // Mark as dismissed for today
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
