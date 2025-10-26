import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserJourneyStep {
  step: string;
  users: number;
  dropoffRate: number;
}

export interface UserJourneyAnalytics {
  onboardingFunnel: UserJourneyStep[];
  purchaseFunnel: UserJourneyStep[];
  gameFunnel: UserJourneyStep[];
  commonPaths: Array<{
    path: string;
    count: number;
  }>;
  exitPoints: Array<{
    page: string;
    exits: number;
  }>;
}

export const useUserJourneyAnalytics = () => {
  const [analytics, setAnalytics] = useState<UserJourneyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserJourneyAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('admin-journey-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('Error fetching user journey analytics:', err);
      setError('Failed to load user journey analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserJourneyAnalytics();

    // Realtime subscriptions
    const navChannel = supabase
      .channel('admin-journey-nav')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'navigation_events'
      }, () => {
        console.log('[UserJourney] Navigation changed, refreshing...');
        fetchUserJourneyAnalytics();
      })
      .subscribe();

    const conversionChannel = supabase
      .channel('admin-journey-conversion')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversion_events'
      }, () => {
        console.log('[UserJourney] Conversion changed, refreshing...');
        fetchUserJourneyAnalytics();
      })
      .subscribe();

    const exitChannel = supabase
      .channel('admin-journey-exit')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_exit_events'
      }, () => {
        console.log('[UserJourney] Game exits changed, refreshing...');
        fetchUserJourneyAnalytics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUserJourneyAnalytics();
    }, 30000);

    return () => {
      supabase.removeChannel(navChannel);
      supabase.removeChannel(conversionChannel);
      supabase.removeChannel(exitChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: fetchUserJourneyAnalytics };
};
