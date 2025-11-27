import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req.headers.get('origin'));
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: roleCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    // Fetch comprehensive lootbox analytics
    const [
      dropsData,
      decisionsData,
      rewardsData,
      dailyData,
      topUsersData
    ] = await Promise.all([
      // Total drops by source
      supabaseAdmin
        .from('lootbox_instances')
        .select('source, status, created_at')
        .then(({ data }) => data || []),
      
      // Decision breakdown (open_now vs store)
      supabaseAdmin
        .from('lootbox_instances')
        .select('status, opened_at, activated_at')
        .in('status', ['opened', 'stored'])
        .then(({ data }) => data || []),
      
      // Reward tier distribution
      supabaseAdmin
        .from('lootbox_instances')
        .select('rewards_gold, rewards_life, metadata')
        .eq('status', 'opened')
        .then(({ data }) => data || []),
      
      // Daily drop frequency (last 30 days)
      supabaseAdmin
        .from('lootbox_instances')
        .select('created_at, user_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .then(({ data }) => data || []),
      
      // Top users by lootbox activity
      supabaseAdmin
        .from('lootbox_instances')
        .select('user_id, status, rewards_gold, rewards_life')
        .then(({ data }) => data || [])
    ]);

    // Process data
    const totalDrops = dropsData.length;
    const dropsBySource = dropsData.reduce((acc, drop) => {
      acc[drop.source] = (acc[drop.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = dropsData.reduce((acc, drop) => {
      acc[drop.status] = (acc[drop.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const openedNow = decisionsData.filter(d => d.status === 'opened').length;
    const stored = decisionsData.filter(d => d.status === 'stored').length;

    // Calculate reward tier distribution
    const tierCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    rewardsData.forEach(reward => {
      const metadata = reward.metadata as { tier?: string } | null;
      if (metadata?.tier && metadata.tier in tierCounts) {
        tierCounts[metadata.tier as keyof typeof tierCounts]++;
      }
    });

    const avgGold = rewardsData.length > 0 
      ? rewardsData.reduce((sum, r) => sum + (r.rewards_gold || 0), 0) / rewardsData.length 
      : 0;
    const avgLife = rewardsData.length > 0 
      ? rewardsData.reduce((sum, r) => sum + (r.rewards_life || 0), 0) / rewardsData.length 
      : 0;

    // Daily frequency chart data
    const dailyFrequency = dailyData.reduce((acc, drop) => {
      const date = drop.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top users by drops
    const userStats = topUsersData.reduce((acc, drop) => {
      if (!acc[drop.user_id]) {
        acc[drop.user_id] = {
          totalDrops: 0,
          opened: 0,
          stored: 0,
          totalGold: 0,
          totalLife: 0
        };
      }
      acc[drop.user_id].totalDrops++;
      if (drop.status === 'opened') {
        acc[drop.user_id].opened++;
        acc[drop.user_id].totalGold += drop.rewards_gold || 0;
        acc[drop.user_id].totalLife += drop.rewards_life || 0;
      } else if (drop.status === 'stored') {
        acc[drop.user_id].stored++;
      }
      return acc;
    }, {} as Record<string, any>);

    const topUsers = Object.entries(userStats)
      .sort(([, a], [, b]) => b.totalDrops - a.totalDrops)
      .slice(0, 10)
      .map(([userId, stats]) => ({ userId, ...stats }));

    return new Response(
      JSON.stringify({
        overview: {
          totalDrops,
          openedNow,
          stored,
          expired: statusBreakdown.expired || 0,
          activeDrop: statusBreakdown.active_drop || 0
        },
        dropsBySource,
        tierDistribution: tierCounts,
        averageRewards: {
          gold: Math.round(avgGold),
          life: Math.round(avgLife)
        },
        dailyFrequency: Object.entries(dailyFrequency)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        topUsers,
        decisionRate: {
          openNowPercentage: totalDrops > 0 ? Math.round((openedNow / totalDrops) * 100) : 0,
          storePercentage: totalDrops > 0 ? Math.round((stored / totalDrops) * 100) : 0
        }
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-lootbox-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    );
  }
});
