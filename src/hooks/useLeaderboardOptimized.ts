import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_url: string | null;
  total_correct_answers: number;
}

/**
 * Optimized leaderboard hook with React Query caching
 * Real-time updates via subscriptions instead of polling
 */
export const useLeaderboardOptimized = (countryCode: string | null, limit: number = 100) => {
  const queryClient = useQueryClient();

  // Fetch leaderboard with cache
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', countryCode, limit],
    queryFn: async () => {
      if (!countryCode) return [];

      const { data, error } = await supabase
        .from('daily_rankings')
        .select('rank, user_id, total_correct_answers')
        .eq('day_date', new Date().toISOString().split('T')[0])
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Fetch user profiles for leaderboard entries
      const userIds = data?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, country_code')
        .in('id', userIds)
        .eq('country_code', countryCode);

      if (profilesError) throw profilesError;

      // Merge rankings with profiles
      const merged = data?.map(ranking => {
        const profile = profiles?.find(p => p.id === ranking.user_id);
        return {
          rank: ranking.rank || 0,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          total_correct_answers: ranking.total_correct_answers || 0,
        };
      }) || [];

      return merged as LeaderboardEntry[];
    },
    enabled: !!countryCode,
    staleTime: 2 * 60 * 1000, // 2 minutes (leaderboard changes less frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time subscription to daily_rankings
  useEffect(() => {
    if (!countryCode) return;

    const today = new Date().toISOString().split('T')[0];

    const channel = supabase
      .channel(`leaderboard-${countryCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_rankings',
          filter: `day_date=eq.${today}`
        },
        () => {
          console.log('[useLeaderboardOptimized] Ranking updated, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['leaderboard', countryCode, limit] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [countryCode, limit, queryClient]);

  return {
    leaderboard,
    loading: isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['leaderboard', countryCode, limit] }),
  };
};
