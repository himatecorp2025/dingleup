import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Hiányzó Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Érvénytelen token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Nincs admin jogosultság' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch booster purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('booster_purchases')
      .select('*, booster_types(name, code)')
      .order('created_at', { ascending: false });

    if (purchasesError) throw purchasesError;

    // Fetch total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Calculate metrics
    const totalRevenue = purchases?.reduce((sum, p) => sum + (p.usd_cents_spent / 100), 0) || 0;
    const payingUsersSet = new Set(purchases?.map(p => p.user_id) || []);
    const payingUsers = payingUsersSet.size;
    const arpu = totalUsers ? totalRevenue / totalUsers : 0;
    const arppu = payingUsers ? totalRevenue / payingUsers : 0;
    const conversionRate = totalUsers ? (payingUsers / totalUsers) * 100 : 0;

    // Revenue over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDay = purchases
      ?.filter(p => new Date(p.created_at) >= thirtyDaysAgo)
      .reduce((acc, p) => {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date] += p.usd_cents_spent / 100;
        return acc;
      }, {} as Record<string, number>) || {};

    const revenueOverTime = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by product
    const revenueByProductMap = purchases?.reduce((acc, p) => {
      const productName = (p.booster_types as any)?.name || 'Ismeretlen';
      if (!acc[productName]) {
        acc[productName] = { product: productName, revenue: 0, count: 0 };
      }
      acc[productName].revenue += p.usd_cents_spent / 100;
      acc[productName].count += 1;
      return acc;
    }, {} as Record<string, { product: string; revenue: number; count: number }>) || {};

    const revenueByProduct = Object.values(revenueByProductMap)
      .sort((a, b) => (b as any).revenue - (a as any).revenue);

    return new Response(JSON.stringify({
      totalRevenue,
      arpu,
      arppu,
      conversionRate,
      totalUsers: totalUsers || 0,
      payingUsers,
      revenueOverTime,
      revenueByProduct
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-monetization-analytics:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
