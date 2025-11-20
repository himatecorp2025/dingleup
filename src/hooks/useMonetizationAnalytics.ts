import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface ProductRevenue {
  product: string;
  revenue: number;
  count: number;
}

interface MonetizationAnalytics {
  totalRevenue: number;
  arpu: number;
  arppu: number;
  conversionRate: number;
  totalUsers: number;
  payingUsers: number;
  revenueOverTime: RevenueDataPoint[];
  revenueByProduct: ProductRevenue[];
}

export const useMonetizationAnalytics = () => {
  const [analytics, setAnalytics] = useState<MonetizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonetizationAnalytics = async (background = false) => {
    if (!background) setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('admin-monetization-analytics');

      if (fetchError) throw fetchError;
      if (data) setAnalytics(data);
    } catch (err) {
      console.error('Error fetching monetization analytics:', err);
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt');
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonetizationAnalytics();

    // Real-time subscriptions
    const boosterPurchasesChannel = supabase
      .channel('monetization-booster-purchases')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booster_purchases'
      }, () => {
        fetchMonetizationAnalytics(true);
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMonetizationAnalytics(true);
    }, 30000);

    return () => {
      supabase.removeChannel(boosterPurchasesChannel);
      clearInterval(interval);
    };
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: () => fetchMonetizationAnalytics(false)
  };
};
