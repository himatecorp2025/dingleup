import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeniusAnalytics, GeniusMember } from './useGeniusAnalytics';

export const useNormalUsersAnalytics = () => {
  const [analytics, setAnalytics] = useState<GeniusAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime updates
  useEffect(() => {
    fetchNormalUsersAnalytics();

    // Realtime subscriptions for instant updates
    const profilesChannel = supabase
      .channel('normal-profiles-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'is_subscribed=eq.false'
      }, () => {
        console.log('[NormalUsersAnalytics] Profile changed - realtime refresh');
        fetchNormalUsersAnalytics();
      })
      .subscribe();

    const purchasesChannel = supabase
      .channel('normal-purchases-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases'
      }, () => {
        console.log('[NormalUsersAnalytics] Purchase changed - realtime refresh');
        fetchNormalUsersAnalytics();
      })
      .subscribe();

    const gameResultsChannel = supabase
      .channel('normal-game-results-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_results'
      }, () => {
        console.log('[NormalUsersAnalytics] Game result changed - realtime refresh');
        fetchNormalUsersAnalytics();
      })
      .subscribe();

    const sessionsChannel = supabase
      .channel('normal-sessions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_session_events'
      }, () => {
        console.log('[NormalUsersAnalytics] Session changed - realtime refresh');
        fetchNormalUsersAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(gameResultsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  const fetchNormalUsersAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-normal-analytics');
      if (error) throw error;

      if (!data) {
        setAnalytics({
          totalGenius: 0,
          totalRevenue: 0,
          averagePurchase: 0,
          activeSubscriptions: 0,
          cancelledSubscriptions: 0,
          members: []
        });
        setError(null);
        return;
      }

      setAnalytics({
        totalGenius: Number(data.totalGenius || 0),
        totalRevenue: Number(data.totalRevenue || 0),
        averagePurchase: Number(data.averagePurchase || 0),
        activeSubscriptions: Number(data.activeSubscriptions || 0),
        cancelledSubscriptions: Number(data.cancelledSubscriptions || 0),
        members: data.members || []
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching Normal Users analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, error, refetch: fetchNormalUsersAnalytics };
};
