import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

function getUserIdFromAuthHeader(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const normalized = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + (4 - (normalized.length % 4)) % 4,
      '='
    );

    const json = atob(padded);
    const payload = JSON.parse(json);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch (error) {
    console.error('[Admin Lootbox Analytics] Failed to decode JWT:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req.headers.get('origin'));
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[Admin Lootbox Analytics] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    // Use service role client for all operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userId = getUserIdFromAuthHeader(req);
    console.log('[Admin Lootbox Analytics] Decoded user id:', userId);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    console.log('[Admin Lootbox Analytics] Checking admin role for user:', userId);
    const { data: roleCheck, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    console.log('[Admin Lootbox Analytics] Role check result:', { 
      hasRole: !!roleCheck,
      error: roleError?.message 
    });

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[Admin Lootbox Analytics] Admin verified, fetching analytics...');

    // Fetch comprehensive lootbox analytics
    const [
      dropsData,
      decisionsData,
      rewardsData,
      dailyData,
      topUsersData,
      dailyPlansData
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
      
      // Reward tier distribution - include ALL lootboxes that have tier data, not just opened
      supabaseAdmin
        .from('lootbox_instances')
        .select('rewards_gold, rewards_life, metadata, status')
        .not('metadata->tier', 'is', null)
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
        .then(({ data }) => data || []),
      
      // Daily plans with activity windows
      supabaseAdmin
        .from('lootbox_daily_plan')
        .select('*')
        .gte('plan_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
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

    // Calculate reward tier distribution from all lootboxes with tier information
    const tierCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    rewardsData.forEach(reward => {
      const metadata = reward.metadata as { tier?: string } | null;
      if (metadata?.tier && metadata.tier in tierCounts) {
        tierCounts[metadata.tier as keyof typeof tierCounts]++;
      }
    });

    // Calculate average rewards only from opened lootboxes
    const openedRewards = rewardsData.filter(r => r.status === 'opened');

    const avgGold = openedRewards.length > 0 
      ? openedRewards.reduce((sum, r) => sum + (r.rewards_gold || 0), 0) / openedRewards.length 
      : 0;
    const avgLife = openedRewards.length > 0 
      ? openedRewards.reduce((sum, r) => sum + (r.rewards_life || 0), 0) / openedRewards.length 
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

    // Process activity window and hourly distribution from daily plans
    const hourlyDistribution = Array(24).fill(0);
    const activityWindows: Array<{ start: number; end: number }> = [];
    let totalTargetCount = 0;
    let totalDeliveredCount = 0;
    const slotStatusCounts = { pending: 0, delivered: 0 };

    dailyPlansData.forEach(plan => {
      totalTargetCount += plan.target_count;
      totalDeliveredCount += plan.delivered_count;

      // Extract activity window
      if (plan.active_window_start && plan.active_window_end) {
        const startHour = new Date(plan.active_window_start).getUTCHours();
        const endHour = new Date(plan.active_window_end).getUTCHours();
        activityWindows.push({ start: startHour, end: endHour });
      }

      // Process slots for hourly distribution and status
      if (plan.slots && Array.isArray(plan.slots)) {
        plan.slots.forEach((slot: any) => {
          const slotTime = new Date(slot.slot_time);
          const hour = slotTime.getUTCHours();
          hourlyDistribution[hour]++;

          // Count slot statuses
          if (slot.status === 'pending') slotStatusCounts.pending++;
          else if (slot.status === 'delivered') slotStatusCounts.delivered++;
        });
      }
    });

    // Calculate average activity window
    const avgActivityWindow = activityWindows.length > 0
      ? {
          avgStart: Math.round(activityWindows.reduce((sum, w) => sum + w.start, 0) / activityWindows.length),
          avgEnd: Math.round(activityWindows.reduce((sum, w) => sum + w.end, 0) / activityWindows.length)
        }
      : null;

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
        },
        hourlyDistribution: hourlyDistribution.map((count, hour) => ({ hour, count })),
        activityWindow: avgActivityWindow,
        planStatistics: {
          totalPlans: dailyPlansData.length,
          avgTargetCount: dailyPlansData.length > 0 ? Math.round(totalTargetCount / dailyPlansData.length) : 0,
          avgDeliveredCount: dailyPlansData.length > 0 ? Math.round(totalDeliveredCount / dailyPlansData.length) : 0,
          deliveryRate: totalTargetCount > 0 ? Math.round((totalDeliveredCount / totalTargetCount) * 100) : 0
        },
        slotStatus: slotStatusCounts
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
