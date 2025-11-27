import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ActivityType = 
  | 'daily_first_login'
  | 'quiz_started' 
  | 'quiz_completed'
  | 'answer_streak'
  | 'session_active';

interface ActivityMetadata {
  [key: string]: any;
}

export const useLootboxActivityTracker = () => {
  const trackActivity = useCallback(async (
    activityType: ActivityType,
    metadata?: ActivityMetadata
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[useLootboxActivityTracker] No session, skipping activity tracking');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('register-activity-and-drop', {
        body: {
          activity_type: activityType,
          metadata: metadata || {}
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('[useLootboxActivityTracker] Error tracking activity:', error);
        return null;
      }

      if (data?.drop_granted) {
        console.log('[useLootboxActivityTracker] Drop granted!', data);
      } else {
        console.log('[useLootboxActivityTracker] No drop granted:', data?.reason);
      }

      return data;
    } catch (err) {
      console.error('[useLootboxActivityTracker] Unexpected error:', err);
      return null;
    }
  }, []);

  return { trackActivity };
};
