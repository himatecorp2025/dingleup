import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage daily winners popup visibility
 * Shows popup automatically once per day on first dashboard visit
 * Uses timezone-aware edge function (matching Daily Gift behavior)
 * 
 * TESTING MODE: When forceAlwaysShow=true, popup appears on every refresh (for admin testing)
 */
export const useDailyWinnersPopup = (userId: string | undefined, username: string | undefined, forceAlwaysShow = false) => {
  const [showPopup, setShowPopup] = useState(false);
  const [canShowToday, setCanShowToday] = useState(false);

  // Check if popup can be shown today (timezone-aware)
  useEffect(() => {
    if (!userId) {
      setCanShowToday(false);
      return;
    }

    const checkIfCanShowToday = async () => {
      try {
        // TESTING BYPASS: If forceAlwaysShow=true, always show popup
        if (forceAlwaysShow) {
          setCanShowToday(true);
          console.log('[DAILY-WINNERS-POPUP] TESTING MODE: forceAlwaysShow=true, showing popup');
          return;
        }

        // CRITICAL: Check if user was in YESTERDAY'S TOP 10 (Mon-Sat) or TOP 25 (Sunday)
        // Calculate yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        const yesterdayDayOfWeek = yesterday.getDay();
        const wasYesterdaySunday = yesterdayDayOfWeek === 0;
        
        // Sunday: TOP 25, Other days: TOP 10
        const rankThreshold = wasYesterdaySunday ? 25 : 10;

        const { data: yesterdaySnapshot, error: snapshotError } = await supabase
          .from('daily_leaderboard_snapshot')
          .select('rank')
          .eq('user_id', userId)
          .eq('snapshot_date', yesterdayDate)
          .maybeSingle();

        if (snapshotError) {
          console.error('[DAILY-WINNERS-POPUP] Error checking yesterday snapshot:', snapshotError);
        }

        if (yesterdaySnapshot && yesterdaySnapshot.rank <= rankThreshold) {
          setCanShowToday(false);
          console.log('[DAILY-WINNERS-POPUP] User was in YESTERDAY TOP', rankThreshold, '(rank:', yesterdaySnapshot.rank, '), skipping popup');
          return;
        }

        // Call timezone-aware backend edge function (matching Daily Gift pattern)
        const { data, error } = await supabase.functions.invoke('get-daily-winners-status');

        if (error) {
          console.error('[DAILY-WINNERS-POPUP] Error checking status:', error);
          setCanShowToday(false);
          return;
        }

        if (data.canShow) {
          setCanShowToday(true);
          console.log('[DAILY-WINNERS-POPUP] Can show popup today (local date:', data.localDate, 'timezone:', data.timeZone, ')');
        } else {
          setCanShowToday(false);
          console.log('[DAILY-WINNERS-POPUP] Already shown today (local date:', data.localDate, ')');
        }
      } catch (error) {
        console.error('[DAILY-WINNERS-POPUP] Error in checkIfCanShowToday:', error);
        setCanShowToday(false);
      }
    };

    checkIfCanShowToday();
  }, [userId, forceAlwaysShow]);

  // Auto-trigger popup when canShowToday becomes true
  useEffect(() => {
    if (canShowToday && !showPopup) {
      setShowPopup(true);
    }
  }, [canShowToday, showPopup]);

  const closePopup = async () => {
    if (!userId) return;

    try {
      // TESTING BYPASS: If forceAlwaysShow=true, don't mark as shown (allow re-appearing)
      if (forceAlwaysShow) {
        console.log('[DAILY-WINNERS-POPUP] TESTING MODE: Skipping database update, popup will reappear on next refresh');
        setShowPopup(false);
        setCanShowToday(false);
        return;
      }

      // Get current local date from backend (timezone-aware)
      const { data: statusData } = await supabase.functions.invoke('get-daily-winners-status');
      const localDate = statusData?.localDate || new Date().toISOString().split('T')[0];

      // Upsert the popup view record using local date
      const { error } = await supabase
        .from('daily_winners_popup_views')
        .upsert(
          {
            user_id: userId,
            last_shown_day: localDate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('[DAILY-WINNERS-POPUP] Error marking popup as shown:', error);
      }

      console.log('[DAILY-WINNERS-POPUP] Marked as shown for local date:', localDate);
      setShowPopup(false);
      setCanShowToday(false);
    } catch (error) {
      console.error('[DAILY-WINNERS-POPUP] Error in closePopup:', error);
    }
  };

  return {
    showPopup,
    canShowToday,
    closePopup,
  };
};
