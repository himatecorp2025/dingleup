import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage weekly winners popup visibility
 * Shows popup 3 seconds after daily gift claim/dismiss, once per week
 */
export const useWeeklyWinnersPopup = (userId: string | undefined) => {
  const [showPopup, setShowPopup] = useState(false);
  const [canShowThisWeek, setCanShowThisWeek] = useState(false);
  const [triggerActive, setTriggerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!userId) {
      setCanShowThisWeek(false);
      return;
    }

    checkIfCanShowThisWeek();
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
    if (!triggerActive || !canShowThisWeek) return;

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
  }, [triggerActive, canShowThisWeek]);

  const checkIfCanShowThisWeek = async () => {
    try {
      const currentWeek = getCurrentWeek();

      // Check if user has seen popup this week
      const { data, error } = await supabase
        .from('weekly_winners_popup_views')
        .select('last_shown_week')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[WEEKLY-POPUP] Error checking popup status:', error);
        setCanShowThisWeek(false);
        return;
      }

      // Can show if not seen this week
      setCanShowThisWeek(!data || data.last_shown_week !== currentWeek);
    } catch (error) {
      console.error('[WEEKLY-POPUP] Error in checkIfCanShowThisWeek:', error);
      setCanShowThisWeek(false);
    }
  };

  const triggerPopup = useCallback(() => {
    if (!canShowThisWeek) return;
    setTriggerActive(true);
  }, [canShowThisWeek]);

  const closePopup = async () => {
    if (!userId) return;

    try {
      const currentWeek = getCurrentWeek();

      // Upsert the popup view record
      const { error } = await supabase
        .from('weekly_winners_popup_views')
        .upsert(
          {
            user_id: userId,
            last_shown_week: currentWeek,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.error('[WEEKLY-POPUP] Error marking popup as shown:', error);
      }

      setShowPopup(false);
      setCanShowThisWeek(false);
    } catch (error) {
      console.error('[WEEKLY-POPUP] Error in closePopup:', error);
    }
  };

  return {
    showPopup,
    canShowThisWeek,
    triggerPopup,
    closePopup,
  };
};
