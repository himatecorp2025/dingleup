import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface ProductRevenue {
  product: string;
  revenue: number;
  count: number;
}

export interface MonetizationAnalytics {
  totalRevenue: number;
  arpu: number;
  arppu: number;
  conversionRate: number;
  totalUsers: number;
  payingUsers: number;
  revenueOverTime: RevenueDataPoint[];
  revenueByProduct: ProductRevenue[];
}

const MONETIZATION_ANALYTICS_KEY = 'monetization-analytics';

async function fetchMonetizationAnalytics(): Promise<MonetizationAnalytics> {
  const response = await supabase.functions.invoke('admin-monetization-analytics');

  if (response.error) throw response.error;
  return response.data;
}

export function useMonetizationAnalyticsQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [MONETIZATION_ANALYTICS_KEY],
    queryFn: fetchMonetizationAnalytics,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('monetization-analytics-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booster_purchases',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [MONETIZATION_ANALYTICS_KEY] });
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
          queryClient.invalidateQueries({ queryKey: [MONETIZATION_ANALYTICS_KEY] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    analytics: query.data,
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
