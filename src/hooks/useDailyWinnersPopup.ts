import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage daily winners popup visibility
 * Shows popup automatically once per day on first dashboard visit
 */
export const useDailyWinnersPopup = (userId: string | undefined, forceAlwaysShow = false) => {
  const [showPopup, setShowPopup] = useState(false);
  const [canShowToday, setCanShowToday] = useState(false);

  const getCurrentDay = () => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  useEffect(() => {
    if (!userId) {
      setCanShowToday(false);
      return;
    }

    checkIfCanShowToday(forceAlwaysShow);
  }, [userId, forceAlwaysShow]);

  // Auto-trigger popup when canShowToday becomes true
  useEffect(() => {
    if (canShowToday && !showPopup) {
      setShowPopup(true);
    }
  }, [canShowToday, showPopup]);

  const checkIfCanShowToday = async (force = false) => {
    try {
      if (force) {
        // TEMP: force popup to be allowed regardless of last_shown_day
        setCanShowToday(true);
        return;
      }

      const currentDay = getCurrentDay();

      // Check if user has seen popup today
      const { data, error } = await supabase
        .from('daily_winners_popup_views')
        .select('last_shown_day')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[DAILY-WINNERS-POPUP] Error checking popup status:', error);
        setCanShowToday(false);
        return;
      }

      // Can show if not seen today
      setCanShowToday(!data || data.last_shown_day !== currentDay);
    } catch (error) {
      console.error('[DAILY-WINNERS-POPUP] Error in checkIfCanShowToday:', error);
      setCanShowToday(false);
    }
  };

  const closePopup = async () => {
    if (!userId) return;

    try {
      const currentDay = getCurrentDay();

      // Upsert the popup view record
      const { error } = await supabase
        .from('daily_winners_popup_views')
        .upsert(
          {
            user_id: userId,
            last_shown_day: currentDay,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('[DAILY-WINNERS-POPUP] Error marking popup as shown:', error);
      }

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
