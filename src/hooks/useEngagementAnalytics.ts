import { useState, useEffect } from 'react';
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

  const fetchEngagementAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('admin-engagement-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('Error fetching engagement analytics:', err);
      setError('Failed to load engagement analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagementAnalytics();

    // Realtime subscriptions
    const sessionChannel = supabase
      .channel('admin-engagement-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_session_events'
      }, () => {
        console.log('[Engagement] Sessions changed, refreshing...');
        fetchEngagementAnalytics();
      })
      .subscribe();

    const featureChannel = supabase
      .channel('admin-engagement-features')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feature_usage_events'
      }, () => {
        console.log('[Engagement] Features changed, refreshing...');
        fetchEngagementAnalytics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchEngagementAnalytics();
    }, 30000);

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(featureChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: fetchEngagementAnalytics };
};
