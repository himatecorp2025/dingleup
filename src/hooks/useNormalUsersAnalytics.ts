import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeniusAnalytics, GeniusMember } from './useGeniusAnalytics';

export const useNormalUsersAnalytics = () => {
  const [analytics, setAnalytics] = useState<GeniusAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNormalUsersAnalytics();
  }, []);

  const fetchNormalUsersAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch Normal users (non-subscribers)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_subscribed', false)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setAnalytics({
          totalGenius: 0,
          totalRevenue: 0,
          averagePurchase: 0,
          activeSubscriptions: 0,
          cancelledSubscriptions: 0,
          members: []
        });
        setLoading(false);
        return;
      }

      const userIds = profiles.map(p => p.id);

      // Fetch game stats
      const { data: gameStats } = await supabase
        .from('game_results')
        .select('user_id, completed, correct_answers, average_response_time')
        .in('user_id', userIds);

      // Fetch purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select('user_id, amount_usd, status')
        .in('user_id', userIds)
        .eq('status', 'completed');

      // Fetch invitations
      const { data: invitations } = await supabase
        .from('invitations')
        .select('inviter_id, accepted')
        .in('inviter_id', userIds);

      // Fetch friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id_a, user_id_b')
        .or(`user_id_a.in.(${userIds.join(',')}),user_id_b.in.(${userIds.join(',')})`)
        .eq('status', 'active');

      // Fetch messages
      const { data: messages } = await supabase
        .from('dm_messages')
        .select('sender_id')
        .in('sender_id', userIds);

      // Fetch app sessions
      const { data: sessions } = await supabase
        .from('app_session_events')
        .select('user_id, session_duration_seconds, created_at')
        .in('user_id', userIds);

      // Aggregate data
      const members: GeniusMember[] = profiles.map(profile => {
        const userGameStats = gameStats?.filter(g => g.user_id === profile.id) || [];
        const userPurchases = purchases?.filter(p => p.user_id === profile.id) || [];
        const userInvitations = invitations?.filter(i => i.inviter_id === profile.id) || [];
        const userFriends = friendships?.filter(f => 
          f.user_id_a === profile.id || f.user_id_b === profile.id
        ) || [];
        const userMessages = messages?.filter(m => m.sender_id === profile.id) || [];
        const userSessions = sessions?.filter(s => s.user_id === profile.id) || [];

        const completedGames = userGameStats.filter(g => g.completed);
        const totalGames = userGameStats.length;
        const totalCorrect = userGameStats.reduce((sum, g) => sum + (g.correct_answers || 0), 0);
        const avgResponseTime = userGameStats.length > 0
          ? userGameStats.reduce((sum, g) => sum + (g.average_response_time || 0), 0) / userGameStats.length
          : 0;

        const totalSpent = userPurchases.reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0);

        const invitationsSent = userInvitations.length;
        const invitationsAccepted = userInvitations.filter(i => i.accepted).length;

        const lastSession = userSessions.length > 0 
          ? userSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        const avgSessionDuration = userSessions.length > 0
          ? userSessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) / userSessions.length
          : 0;

        return {
          ...profile,
          total_games: totalGames,
          total_correct_answers: totalCorrect,
          win_rate: totalGames > 0 ? (completedGames.length / totalGames) * 100 : 0,
          avg_response_time: avgResponseTime,
          total_purchases: userPurchases.length,
          total_spent: totalSpent,
          invitations_sent: invitationsSent,
          invitations_accepted: invitationsAccepted,
          last_login: lastSession?.created_at || null,
          total_sessions: userSessions.length,
          avg_session_duration: avgSessionDuration,
          friends_count: userFriends.length,
          messages_sent: userMessages.length
        };
      });

      const totalRevenue = members.reduce((sum, m) => sum + m.total_spent, 0);
      const totalPurchases = members.reduce((sum, m) => sum + m.total_purchases, 0);

      setAnalytics({
        totalGenius: members.length,
        totalRevenue,
        averagePurchase: totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        members
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
