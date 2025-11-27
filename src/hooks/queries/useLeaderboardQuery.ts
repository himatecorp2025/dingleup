import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_correct_answers: number;
  country_code: string;
}

interface RankReward {
  rank: number;
  gold: number;
  life: number;
}

export interface DailyRewardsData {
  day: string;
  type: 'NORMAL' | 'JACKPOT';
  rewards: RankReward[];
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  dailyRewards: DailyRewardsData;
}

const LEADERBOARD_QUERY_KEY = (countryCode: string) => ['leaderboard', 'v2', countryCode];

async function fetchLeaderboard(countryCode: string): Promise<LeaderboardResponse> {
  const response = await supabase.functions.invoke('get-daily-leaderboard-by-country', {
    body: { countryCode }
  });

  if (response.error) throw response.error;
  if (!response.data?.success) throw new Error('Failed to fetch leaderboard');

  return {
    leaderboard: response.data.leaderboard || [],
    dailyRewards: response.data.dailyRewards,
  };
}

export function useLeaderboardQuery(countryCode: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LEADERBOARD_QUERY_KEY(countryCode || ''),
    queryFn: () => fetchLeaderboard(countryCode!),
    enabled: !!countryCode,
    staleTime: 1000 * 30, // 30 seconds - optimized cache duration
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false, // Disable polling, rely on real-time subscriptions
  });

  // Real-time subscription for leaderboard updates (optimized)
  useEffect(() => {
    if (!countryCode) return;

    const channel = supabase
      .channel(`leaderboard-${countryCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leaderboard_cache',
          filter: `country_code=eq.${countryCode}`,
        },
        () => {
          // Invalidate cache only when leaderboard_cache updates for this country
          queryClient.invalidateQueries({ 
            queryKey: LEADERBOARD_QUERY_KEY(countryCode) 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [countryCode, queryClient]);

  return {
    leaderboard: query.data?.leaderboard || [],
    dailyRewards: query.data?.dailyRewards || null,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

// Prefetch leaderboard before navigation
export function prefetchLeaderboard(countryCode: string, queryClient: any) {
  return queryClient.prefetchQuery({
    queryKey: LEADERBOARD_QUERY_KEY(countryCode),
    queryFn: () => fetchLeaderboard(countryCode),
    staleTime: 1000 * 60,
  });
}
