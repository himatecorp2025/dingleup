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

const LEADERBOARD_QUERY_KEY = (countryCode: string) => ['leaderboard', countryCode];

async function fetchLeaderboard(countryCode: string): Promise<LeaderboardEntry[]> {
  const response = await supabase.functions.invoke('get-daily-leaderboard-by-country', {
    body: { countryCode }
  });

  if (response.error) throw response.error;
  if (!response.data?.success) throw new Error('Failed to fetch leaderboard');

  return response.data.leaderboard || [];
}

export function useLeaderboardQuery(countryCode: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LEADERBOARD_QUERY_KEY(countryCode || ''),
    queryFn: () => fetchLeaderboard(countryCode!),
    enabled: !!countryCode,
    staleTime: 1000 * 60, // 1 minute - leaderboard stays fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    if (!countryCode) return;

    const channel = supabase
      .channel(`leaderboard-${countryCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_rankings',
        },
        () => {
          // Invalidate cache on any ranking change
          queryClient.invalidateQueries({ 
            queryKey: LEADERBOARD_QUERY_KEY(countryCode) 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_cache',
        },
        () => {
          // Invalidate cache when leaderboard cache refreshes
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
    leaderboard: query.data || [],
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
