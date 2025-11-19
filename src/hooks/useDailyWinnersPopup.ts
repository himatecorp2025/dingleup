import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage daily winners popup visibility
 * Shows popup 3 seconds after daily gift claim/dismiss, once per day
 */
export const useDailyWinnersPopup = (userId: string | undefined) => {
  const [showPopup, setShowPopup] = useState(false);
  const [canShowToday, setCanShowToday] = useState(false);
  const [triggerActive, setTriggerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentDay = () => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  useEffect(() => {
    if (!userId) {
      setCanShowToday(false);
      return;
    }

    checkIfCanShowToday();
  }, [userId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Trigger effect - show popup after 3 seconds
  useEffect(() => {
    if (!triggerActive || !canShowToday) return;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Show popup after 3 seconds
    timerRef.current = setTimeout(() => {
      setShowPopup(true);
      setTriggerActive(false);
      timerRef.current = null;
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [triggerActive, canShowToday]);

  const checkIfCanShowToday = async () => {
    try {
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

  const triggerPopup = useCallback(() => {
    if (!canShowToday) return;
    setTriggerActive(true);
  }, [canShowToday]);

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
    triggerPopup,
    closePopup,
  };
};
