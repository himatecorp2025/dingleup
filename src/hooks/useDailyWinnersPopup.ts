import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage daily winners popup visibility
 * Shows popup automatically once per day on first dashboard visit
 * Uses timezone-aware edge function (matching Daily Gift behavior)
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
