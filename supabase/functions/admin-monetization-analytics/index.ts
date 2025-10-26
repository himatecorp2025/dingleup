import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await anon.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const service = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: purchases }, { data: profiles }] = await Promise.all([
      service.from('purchases').select('*'),
      service.from('profiles').select('id, username, created_at'),
    ]);

    const totalUsers = profiles?.length || 0;
    const totalRevenue = (purchases || []).reduce((sum: number, p: any) => sum + (Number(p.amount_usd) || 0), 0);
    const payingUserIds = new Set((purchases || []).map((p: any) => p.user_id));
    const payingUsers = payingUserIds.size;
    const conversionRate = totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

    const revenueByProductMap = new Map<string, { revenue: number; count: number }>();
    (purchases || []).forEach((p: any) => {
      const productType = p.product_type || 'unknown';
      const current = revenueByProductMap.get(productType) || { revenue: 0, count: 0 };
      current.revenue += Number(p.amount_usd) || 0;
      current.count += 1;
      revenueByProductMap.set(productType, current);
    });
    const revenueByProduct = Array.from(revenueByProductMap.entries()).map(([product_type, data]) => ({ product_type, revenue: data.revenue, count: data.count }));

    const revenueOverTimeMap = new Map<string, { revenue: number; transactions: number }>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    (purchases || []).forEach((p: any) => {
      const purchaseDate = new Date(p.created_at);
      if (purchaseDate >= thirtyDaysAgo) {
        const dateKey = purchaseDate.toISOString().split('T')[0];
        const current = revenueOverTimeMap.get(dateKey) || { revenue: 0, transactions: 0 };
        current.revenue += Number(p.amount_usd) || 0;
        current.transactions += 1;
        revenueOverTimeMap.set(dateKey, current);
      }
    });
    const revenueOverTime = Array.from(revenueOverTimeMap.entries()).map(([date, data]) => ({ date, revenue: data.revenue, transactions: data.transactions })).sort((a, b) => a.date.localeCompare(b.date));

    const userSpendingMap = new Map<string, { total: number; count: number; username: string }>();
    (purchases || []).forEach((p: any) => {
      const current = userSpendingMap.get(p.user_id) || { total: 0, count: 0, username: '' };
      current.total += Number(p.amount_usd) || 0;
      current.count += 1;
      userSpendingMap.set(p.user_id, current);
    });
    const topSpenders = Array.from(userSpendingMap.entries())
      .map(([user_id, data]) => {
        const profile = (profiles || []).find((p: any) => p.id === user_id);
        return { user_id, username: profile?.username || 'Unknown', total_spent: data.total, purchase_count: data.count };
      })
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);

    const cohortLtvMap = new Map<string, { revenue: number; users: Set<string> }>();
    (purchases || []).forEach((p: any) => {
      const profile = (profiles || []).find((prof: any) => prof.id === p.user_id);
      if (profile?.created_at) {
        const cohort = new Date(profile.created_at).toISOString().slice(0, 7);
        const current = cohortLtvMap.get(cohort) || { revenue: 0, users: new Set<string>() };
        current.revenue += Number(p.amount_usd) || 0;
        current.users.add(p.user_id);
        cohortLtvMap.set(cohort, current);
      }
    });
    const lifetimeValue = Array.from(cohortLtvMap.entries()).map(([cohort, data]) => ({ cohort, ltv: data.users.size > 0 ? data.revenue / data.users.size : 0 })).sort((a, b) => b.cohort.localeCompare(a.cohort));

    return new Response(JSON.stringify({
      totalRevenue,
      averageRevenuePerUser,
      payingUsers,
      conversionRate,
      revenueByProduct,
      revenueOverTime,
      topSpenders,
      lifetimeValue,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[admin-monetization-analytics] Fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});