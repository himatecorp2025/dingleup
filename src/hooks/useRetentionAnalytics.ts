import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RetentionAnalytics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRates: {
    day1: number;
    day7: number;
    day30: number;
  };
  cohortData: Array<{
    cohort: string;
    size: number;
    day1: number;
    day7: number;
    day30: number;
  }>;
  churningUsers: Array<{
    user_id: string;
    username: string;
    last_active: string;
    days_inactive: number;
  }>;
}

export const useRetentionAnalytics = () => {
  const [analytics, setAnalytics] = useState<RetentionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadRef = useRef(false);

  const fetchRetentionAnalytics = async (background = false) => {
    try {
      if (!initialLoadRef.current && !background) setLoading(true);
      if (!initialLoadRef.current) setError(null);

      const { data, error } = await supabase.functions.invoke('admin-retention-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('[Retention] fetch error:', err);
      if (!initialLoadRef.current) setError('Failed to load retention analytics');
    } finally {
      if (!initialLoadRef.current && !background) setLoading(false);
      if (!initialLoadRef.current) initialLoadRef.current = true;
    }
  };

  useEffect(() => {
    fetchRetentionAnalytics(false);

    // Realtime subscriptions (háttér frissítés)
    const sessionChannel = supabase
      .channel('admin-retention-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_session_events'
      }, () => {
        console.log('[Retention] Sessions changed, background refresh');
        fetchRetentionAnalytics(true);
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-retention-profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        console.log('[Retention] Profiles changed, background refresh');
        fetchRetentionAnalytics(true);
      })
      .subscribe();

    // Auto-refresh every 30 seconds (háttérben)
    const interval = setInterval(() => {
      fetchRetentionAnalytics(true);
    }, 30000);

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: () => fetchRetentionAnalytics(true) };
};
