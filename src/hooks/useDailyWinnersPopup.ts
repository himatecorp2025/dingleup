import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to manage daily winners popup visibility
 * Shows popup automatically once per day on first dashboard visit
 */
export const useDailyWinnersPopup = (userId: string | undefined, forceAlwaysShow = false) => {
  const [showPopup, setShowPopup] = useState(false);
  const [canShowToday, setCanShowToday] = useState(false);

  // Get current day in user's timezone (not UTC!)
  const getCurrentDayInUserTimezone = async (userId: string): Promise<string> => {
    try {
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
      return `${year}-${month}-${day}`;
    } catch (error) {
      // Fallback to UTC if timezone fetch fails
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      return `${year}-${month}-${day}`;
    }
  };

  // Check if popup can be shown today
  useEffect(() => {
    if (!userId) {
      setCanShowToday(false);
      return;
    }

    const checkIfCanShowToday = async () => {
      try {
        if (forceAlwaysShow) {
          console.log('[DAILY-WINNERS] Force always show enabled');
          setCanShowToday(true);
          return;
        }

        const currentDay = await getCurrentDayInUserTimezone(userId);
        console.log('[DAILY-WINNERS] Current day in user timezone:', currentDay);

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

        console.log('[DAILY-WINNERS] Database check:', {
          lastShownDay: data?.last_shown_day,
          currentDay,
          canShow: !data || data.last_shown_day !== currentDay,
        });

        // Can show if not seen today
        setCanShowToday(!data || data.last_shown_day !== currentDay);
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
      const currentDay = await getCurrentDayInUserTimezone(userId);

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
