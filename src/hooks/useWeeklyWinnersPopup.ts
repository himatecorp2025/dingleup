import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage weekly winners popup visibility
 * Shows popup once per week on first login
 */
export const useWeeklyWinnersPopup = (userId: string | undefined) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    checkAndShowPopup();
  }, [userId]);

  const getCurrentWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  const checkAndShowPopup = async () => {
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
        setIsLoading(false);
        return;
      }

      // Show popup if not seen this week
      if (!data || data.last_shown_week !== currentWeek) {
        setShowPopup(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[WEEKLY-POPUP] Error in checkAndShowPopup:', error);
      setIsLoading(false);
    }
  };

  const markAsShown = async () => {
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
    } catch (error) {
      console.error('[WEEKLY-POPUP] Error in markAsShown:', error);
    }
  };

  return {
    showPopup,
    isLoading,
    closePopup: markAsShown,
  };
};
