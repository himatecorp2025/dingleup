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
      // TEMP: Force always show for admin testing - minden frissítésnél megjelenik
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_gift_streak, daily_gift_last_claimed')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

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
      // Call RPC function (same pattern as Welcome Bonus)
      const { data, error } = await supabase.rpc('claim_daily_gift');
      
      if (error) {
        const errorMsg = error.message || 'Hiba történt az ajándék felvételekor';
        toast({
          title: 'Hiba',
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
          title: '🎁 Napi ajándék átvéve!',
          description: `+${result.grantedCoins} aranyérme`,
        });
        
        // Refetch wallet to update UI immediately
        if (refetchWallet) await refetchWallet();
        
        return true;
      } else {
        toast({
          title: 'Hiba',
          description: result.error || 'Hiba történt az ajándék felvételekor',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Hiba történt az ajándék felvételekor';
      toast({
        title: 'Hiba',
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
