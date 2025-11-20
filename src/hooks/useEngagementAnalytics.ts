import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EngagementAnalytics {
  avgSessionDuration: number;
  avgSessionsPerUser: number;
  totalSessions: number;
  featureUsage: Array<{
    feature_name: string;
    usage_count: number;
    unique_users: number;
  }>;
  engagementByTime: Array<{
    hour: number;
    sessions: number;
  }>;
  mostActiveUsers: Array<{
    user_id: string;
    username: string;
    session_count: number;
    total_duration: number;
  }>;
  gameEngagement: {
    avgGamesPerUser: number;
    avgCorrectAnswers: number;
    mostPlayedCategories: Array<{
      category: string;
      count: number;
    }>;
  };
}

export const useEngagementAnalytics = () => {
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadRef = useRef(false);

  const fetchEngagementAnalytics = async (background = false) => {
    try {
      if (!initialLoadRef.current && !background) setLoading(true);
      if (!initialLoadRef.current) setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No session');
        if (!initialLoadRef.current) setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('admin-engagement-analytics', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      if (!initialLoadRef.current) setError('Failed to load engagement analytics');
    } finally {
      if (!initialLoadRef.current && !background) setLoading(false);
      if (!initialLoadRef.current) initialLoadRef.current = true;
    }
  };

  useEffect(() => {
    fetchEngagementAnalytics(false);

    // Realtime subscriptions (instant, 0 seconds delay)
    const sessionChannel = supabase
      .channel('admin-engagement-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_session_events'
      }, () => {
        fetchEngagementAnalytics(true);
      })
      .subscribe();

    const featureChannel = supabase
      .channel('admin-engagement-features')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feature_usage_events'
      }, () => {
        fetchEngagementAnalytics(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(featureChannel);
    };
  }, []);

  return { analytics, loading, error, refetch: () => fetchEngagementAnalytics(true) };
};
