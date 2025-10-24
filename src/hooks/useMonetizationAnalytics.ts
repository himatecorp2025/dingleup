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

      // Fetch all purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('*');

      if (purchasesError) throw purchasesError;

      // Fetch all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, created_at');

      const totalUsers = profiles?.length || 0;
      const totalRevenue = purchases?.reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0) || 0;
      const payingUserIds = new Set(purchases?.map(p => p.user_id) || []);
      const payingUsers = payingUserIds.size;
      const conversionRate = totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;
      const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      // Revenue by product
      const revenueByProductMap = new Map<string, { revenue: number; count: number }>();
      purchases?.forEach(p => {
        const productType = p.product_type || 'unknown';
        const current = revenueByProductMap.get(productType) || { revenue: 0, count: 0 };
        current.revenue += Number(p.amount_usd) || 0;
        current.count += 1;
        revenueByProductMap.set(productType, current);
      });

      const revenueByProduct = Array.from(revenueByProductMap.entries()).map(([product_type, data]) => ({
        product_type,
        revenue: data.revenue,
        count: data.count,
      }));

      // Revenue over time (last 30 days)
      const revenueOverTimeMap = new Map<string, { revenue: number; transactions: number }>();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      purchases?.forEach(p => {
        const purchaseDate = new Date(p.created_at);
        if (purchaseDate >= thirtyDaysAgo) {
          const dateKey = purchaseDate.toISOString().split('T')[0];
          const current = revenueOverTimeMap.get(dateKey) || { revenue: 0, transactions: 0 };
          current.revenue += Number(p.amount_usd) || 0;
          current.transactions += 1;
          revenueOverTimeMap.set(dateKey, current);
        }
      });

      const revenueOverTime = Array.from(revenueOverTimeMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          transactions: data.transactions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top spenders
      const userSpendingMap = new Map<string, { total: number; count: number; username: string }>();
      purchases?.forEach(p => {
        const current = userSpendingMap.get(p.user_id) || { total: 0, count: 0, username: '' };
        current.total += Number(p.amount_usd) || 0;
        current.count += 1;
        userSpendingMap.set(p.user_id, current);
      });

      const topSpendersList = Array.from(userSpendingMap.entries())
        .map(([user_id, data]) => {
          const profile = profiles?.find(p => p.id === user_id);
          return {
            user_id,
            username: profile?.username || 'Unknown',
            total_spent: data.total,
            purchase_count: data.count,
          };
        })
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10);

      // LTV by cohort
      const cohortLtvMap = new Map<string, { revenue: number; users: Set<string> }>();
      purchases?.forEach(p => {
        const profile = profiles?.find(prof => prof.id === p.user_id);
        if (profile?.created_at) {
          const cohort = new Date(profile.created_at).toISOString().slice(0, 7);
          const current = cohortLtvMap.get(cohort) || { revenue: 0, users: new Set() };
          current.revenue += Number(p.amount_usd) || 0;
          current.users.add(p.user_id);
          cohortLtvMap.set(cohort, current);
        }
      });

      const lifetimeValue = Array.from(cohortLtvMap.entries())
        .map(([cohort, data]) => ({
          cohort,
          ltv: data.users.size > 0 ? data.revenue / data.users.size : 0,
        }))
        .sort((a, b) => b.cohort.localeCompare(a.cohort));

      setAnalytics({
        totalRevenue,
        averageRevenuePerUser: arpu,
        payingUsers,
        conversionRate,
        revenueByProduct,
        revenueOverTime,
        topSpenders: topSpendersList,
        lifetimeValue,
      });
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
