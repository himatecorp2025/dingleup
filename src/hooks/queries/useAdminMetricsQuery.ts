import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface AdminMetrics {
  totalUsers: number;
  activeUsersToday: number;
  totalGamesPlayed: number;
  totalInvitations: number;
  totalPurchases: number;
  totalReports: number;
  geniusUsers: number;
  totalCoins: number;
  avgSessionDuration: number;
}

const ADMIN_METRICS_KEY = 'admin-metrics';

async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const response = await supabase.functions.invoke('admin-dashboard-data');

  if (response.error) throw response.error;
  if (!response.data?.success) throw new Error('Failed to fetch admin metrics');

  return response.data.data;
}

export function useAdminMetricsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ADMIN_METRICS_KEY],
    queryFn: fetchAdminMetrics,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Real-time subscription for admin metrics updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-metrics-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_METRICS_KEY] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_results',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_METRICS_KEY] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchases',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_METRICS_KEY] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    metrics: query.data,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
