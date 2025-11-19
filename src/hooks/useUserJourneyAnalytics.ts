import { useState, useEffect, useRef } from 'react';
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
  const initialLoadRef = useRef(false);

  const fetchUserJourneyAnalytics = async (background = false) => {
    try {
      if (!initialLoadRef.current && !background) setLoading(true);
      if (!initialLoadRef.current) setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No session');
        if (!initialLoadRef.current) setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('admin-journey-analytics', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      if (!initialLoadRef.current) setError('Failed to load user journey analytics');
    } finally {
      if (!initialLoadRef.current && !background) setLoading(false);
      if (!initialLoadRef.current) initialLoadRef.current = true;
    }
  };

  useEffect(() => {
    fetchUserJourneyAnalytics(false);

    // Realtime subscriptions (háttér frissítés)
    const navChannel = supabase
      .channel('admin-journey-nav')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'navigation_events'
      }, () => {
        fetchUserJourneyAnalytics(true);
      })
      .subscribe();

    const conversionChannel = supabase
      .channel('admin-journey-conversion')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversion_events'
      }, () => {
        fetchUserJourneyAnalytics(true);
      })
      .subscribe();

    const exitChannel = supabase
      .channel('admin-journey-exit')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_exit_events'
      }, () => {
        fetchUserJourneyAnalytics(true);
      })
      .subscribe();

    // Auto-refresh every 30 seconds (háttérben)
    const interval = setInterval(() => {
      fetchUserJourneyAnalytics(true);
    }, 30000);

    return () => {
      supabase.removeChannel(navChannel);
      supabase.removeChannel(conversionChannel);
      supabase.removeChannel(exitChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: () => fetchUserJourneyAnalytics(true) };
};
