import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonetizationAnalytics {
  totalRevenue: number;
  averageRevenuePerUser: number;
  payingUsers: number;
  conversionRate: number;
  revenueByProduct: Array<{
    product_type: string;
    revenue: number;
    count: number;
  }>;
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  topSpenders: Array<{
    user_id: string;
    username: string;
    total_spent: number;
    purchase_count: number;
  }>;
  lifetimeValue: Array<{
    cohort: string;
    ltv: number;
  }>;
}

export const useMonetizationAnalytics = () => {
  const [analytics, setAnalytics] = useState<MonetizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonetizationAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('admin-monetization-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('Error fetching monetization analytics:', err);
      setError('Failed to load monetization analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonetizationAnalytics();

    // Realtime subscription for purchases
    const purchasesChannel = supabase
      .channel('admin-monetization-purchases')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases'
      }, () => {
        console.log('[Monetization] Purchases changed, refreshing...');
        fetchMonetizationAnalytics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMonetizationAnalytics();
    }, 30000);

    return () => {
      supabase.removeChannel(purchasesChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: fetchMonetizationAnalytics };
};
