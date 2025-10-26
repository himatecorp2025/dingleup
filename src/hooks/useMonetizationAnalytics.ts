import { useState, useEffect, useRef } from 'react';
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
  const initialLoadRef = useRef(false);

  const fetchMonetizationAnalytics = async (background = false) => {
    try {
      if (!initialLoadRef.current && !background) setLoading(true);
      if (!initialLoadRef.current) setError(null);

      const { data, error } = await supabase.functions.invoke('admin-monetization-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('[Monetization] fetch error:', err);
      // Csak az első betöltésnél mutassunk hibát a teljes képernyőn
      if (!initialLoadRef.current) setError('Failed to load monetization analytics');
    } finally {
      if (!initialLoadRef.current && !background) setLoading(false);
      if (!initialLoadRef.current) initialLoadRef.current = true;
    }
  };

  useEffect(() => {
    fetchMonetizationAnalytics(false);

    // Realtime subscription for purchases (háttér frissítés)
    const purchasesChannel = supabase
      .channel('admin-monetization-purchases')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases'
      }, () => {
        console.log('[Monetization] Purchases changed, background refresh');
        fetchMonetizationAnalytics(true);
      })
      .subscribe();

    // Auto-refresh every 30 seconds (háttérben)
    const interval = setInterval(() => {
      fetchMonetizationAnalytics(true);
    }, 30000);

    return () => {
      supabase.removeChannel(purchasesChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: () => fetchMonetizationAnalytics(true) };
};
