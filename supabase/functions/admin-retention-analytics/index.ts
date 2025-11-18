import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
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

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [{ data: dauData }, { data: wauData }, { data: mauData }, { data: profiles }] = await Promise.all([
      service.from('app_session_events').select('user_id').gte('created_at', oneDayAgo.toISOString()).eq('event_type', 'app_opened'),
      service.from('app_session_events').select('user_id').gte('created_at', sevenDaysAgo.toISOString()).eq('event_type', 'app_opened'),
      service.from('app_session_events').select('user_id').gte('created_at', thirtyDaysAgo.toISOString()).eq('event_type', 'app_opened'),
      service.from('profiles').select('id, username, created_at'),
    ]);

    const dau = new Set((dauData || []).map((d: any) => d.user_id)).size;
    const wau = new Set((wauData || []).map((d: any) => d.user_id)).size;
    const mau = new Set((mauData || []).map((d: any) => d.user_id)).size;

    // Cohorts
    const cohorts = new Map<string, any[]>();
    (profiles || []).forEach((p: any) => {
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      if (!cohorts.has(month)) cohorts.set(month, []);
      cohorts.get(month)!.push(p);
    });

    const cohortData: Array<{ cohort: string; size: number; day1: number; day7: number; day30: number; }> = [];
    const retentionTotals = { day1: 0, day7: 0, day30: 0 };

    for (const [cohortMonth, cohortUsers] of cohorts.entries()) {
      const { data: sessionData } = await service
        .from('app_session_events')
        .select('user_id, created_at')
        .in('user_id', cohortUsers.map(u => u.id))
        .eq('event_type', 'app_opened');

      const cohortSize = cohortUsers.length;
      let day1 = 0, day7 = 0, day30 = 0;
      cohortUsers.forEach(u => {
        const userSessions = (sessionData || []).filter(s => s.user_id === u.id);
        const joinDate = new Date(u.created_at);
        const hasDay1 = userSessions.some(s => { const sd = new Date(s.created_at); const diff = Math.floor((sd.getTime() - joinDate.getTime()) / 86400000); return diff >= 1 && diff <= 2; });
        const hasDay7 = userSessions.some(s => { const sd = new Date(s.created_at); const diff = Math.floor((sd.getTime() - joinDate.getTime()) / 86400000); return diff >= 7 && diff <= 8; });
        const hasDay30 = userSessions.some(s => { const sd = new Date(s.created_at); const diff = Math.floor((sd.getTime() - joinDate.getTime()) / 86400000); return diff >= 30 && diff <= 31; });
        if (hasDay1) day1++; if (hasDay7) day7++; if (hasDay30) day30++;
      });

      cohortData.push({
        cohort: cohortMonth,
        size: cohortSize,
        day1: cohortSize > 0 ? (day1 / cohortSize) * 100 : 0,
        day7: cohortSize > 0 ? (day7 / cohortSize) * 100 : 0,
        day30: cohortSize > 0 ? (day30 / cohortSize) * 100 : 0,
      });
      retentionTotals.day1 += day1; retentionTotals.day7 += day7; retentionTotals.day30 += day30;
    }

    const totalUsers = (profiles || []).length;
    const retentionRates = {
      day1: totalUsers > 0 ? (retentionTotals.day1 / totalUsers) * 100 : 0,
      day7: totalUsers > 0 ? (retentionTotals.day7 / totalUsers) * 100 : 0,
      day30: totalUsers > 0 ? (retentionTotals.day30 / totalUsers) * 100 : 0,
    };

    // Churning users
    const { data: recentSessions } = await service
      .from('app_session_events')
      .select('user_id, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('event_type', 'app_opened');
    const activeUserIds = new Set((recentSessions || []).map((s: any) => s.user_id));
    const churningUsers = (profiles || [])
      .filter((p: any) => !activeUserIds.has(p.id))
      .map((p: any) => {
        const lastActive = new Date(p.created_at);
        const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / 86400000);
        return { user_id: p.id, username: p.username, last_active: lastActive.toISOString(), days_inactive: daysInactive };
      })
      .sort((a: any, b: any) => b.days_inactive - a.days_inactive)
      .slice(0, 20);

    return new Response(JSON.stringify({
      dailyActiveUsers: dau,
      weeklyActiveUsers: wau,
      monthlyActiveUsers: mau,
      retentionRates,
      cohortData: cohortData.sort((a, b) => b.cohort.localeCompare(a.cohort)),
      churningUsers,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});