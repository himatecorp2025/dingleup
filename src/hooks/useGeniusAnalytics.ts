import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GeniusAnalytics {
  totalGenius: number;
  totalRevenue: number;
  averagePurchase: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  members: GeniusMember[];
}

export interface GeniusMember {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  subscription_tier: string | null;
  created_at: string;
  subscriber_since: string | null;
  subscriber_renew_at: string | null;
  is_subscribed: boolean;
  
  // Game stats
  total_games: number;
  total_correct_answers: number;
  win_rate: number;
  avg_response_time: number;
  
  // Purchase stats
  total_purchases: number;
  total_spent: number;
  
  // Invitation stats
  invitations_sent: number;
  invitations_accepted: number;
  
  // Activity stats
  last_login: string | null;
  total_sessions: number;
  avg_session_duration: number;
  
  // Chat stats
  friends_count: number;
  messages_sent: number;
}

export const useGeniusAnalytics = () => {
  const [analytics, setAnalytics] = useState<GeniusAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime updates
  useEffect(() => {
    fetchGeniusAnalytics();

    // Realtime subscriptions for instant updates
    const profilesChannel = supabase
      .channel('genius-profiles-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: 'is_subscribed=eq.true'
      }, () => {
        console.log('[GeniusAnalytics] Profile changed - realtime refresh');
        fetchGeniusAnalytics();
      })
      .subscribe();

    const purchasesChannel = supabase
      .channel('genius-purchases-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases'
      }, () => {
        console.log('[GeniusAnalytics] Purchase changed - realtime refresh');
        fetchGeniusAnalytics();
      })
      .subscribe();

    const gameResultsChannel = supabase
      .channel('genius-game-results-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_results'
      }, () => {
        console.log('[GeniusAnalytics] Game result changed - realtime refresh');
        fetchGeniusAnalytics();
      })
      .subscribe();

    const sessionsChannel = supabase
      .channel('genius-sessions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_session_events'
      }, () => {
        console.log('[GeniusAnalytics] Session changed - realtime refresh');
        fetchGeniusAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(gameResultsChannel);
      supabase.removeChannel(sessionsChannel);
    };
  }, []);

  const fetchGeniusAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-genius-analytics');
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
      console.error('Error fetching Genius analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, error, refetch: fetchGeniusAnalytics };
};
