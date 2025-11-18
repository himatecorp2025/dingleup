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

    // Verify user and admin role using anon key
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

    // Use service role for data fetch (bypass RLS)
    const service = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: sessionEvents }, { data: profiles }, { data: featureEvents }, { data: gameResults }] = await Promise.all([
      service.from('app_session_events').select('*'),
      service.from('profiles').select('id, username'),
      service.from('feature_usage_events').select('feature_name, user_id'),
      service.from('game_results').select('*'),
    ]);

    // Sessions
    const sessionMap = new Map<string, number[]>();
    (sessionEvents || []).forEach((event: any) => {
      if (event.session_duration_seconds) {
        if (!sessionMap.has(event.user_id)) sessionMap.set(event.user_id, []);
        sessionMap.get(event.user_id)!.push(event.session_duration_seconds);
      }
    });

    const totalSessions = Array.from(sessionMap.values()).reduce((sum, arr) => sum + arr.length, 0);
    const totalDuration = Array.from(sessionMap.values()).reduce((sum, arr) => sum + arr.reduce((s, d) => s + d, 0), 0);
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const avgSessionsPerUser = sessionMap.size > 0 ? Math.round(totalSessions / sessionMap.size) : 0;

    // Feature usage
    const featureUsageMap = new Map<string, Set<string>>();
    (featureEvents || []).forEach((e: any) => {
      if (!featureUsageMap.has(e.feature_name)) featureUsageMap.set(e.feature_name, new Set());
      featureUsageMap.get(e.feature_name)!.add(e.user_id);
    });
    const featureUsage = Array.from(featureUsageMap.entries())
      .map(([feature_name, users]) => ({ feature_name, usage_count: users.size, unique_users: users.size }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Engagement by time
    const hourlyEngagement = new Array(24).fill(0);
    (sessionEvents || []).forEach((event: any) => {
      const hour = new Date(event.created_at).getHours();
      hourlyEngagement[hour]++;
    });
    const engagementByTime = hourlyEngagement.map((sessions, hour) => ({ hour, sessions }));

    // Most active users
    const mostActiveUsers = Array.from(sessionMap.entries())
      .map(([user_id, durations]) => {
        const profile = (profiles || []).find((p: any) => p.id === user_id);
        return {
          user_id,
          username: profile?.username || 'Unknown',
          session_count: durations.length,
          total_duration: durations.reduce((s, d) => s + d, 0),
        };
      })
      .sort((a, b) => b.session_count - a.session_count)
      .slice(0, 10);

    // Game engagement
    const gamesPerUser = new Map<string, number>();
    const categoryCount = new Map<string, number>();
    let totalCorrectAnswers = 0;
    (gameResults || []).forEach((g: any) => {
      gamesPerUser.set(g.user_id, (gamesPerUser.get(g.user_id) || 0) + 1);
      categoryCount.set(g.category, (categoryCount.get(g.category) || 0) + 1);
      totalCorrectAnswers += g.correct_answers || 0;
    });
    const avgGamesPerUser = gamesPerUser.size > 0 ? Array.from(gamesPerUser.values()).reduce((s, c) => s + c, 0) / gamesPerUser.size : 0;
    const mostPlayedCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const avgCorrectAnswers = (gameResults && gameResults.length > 0) ? totalCorrectAnswers / gameResults.length : 0;

    return new Response(JSON.stringify({
      avgSessionDuration,
      avgSessionsPerUser,
      totalSessions,
      featureUsage,
      engagementByTime,
      mostActiveUsers,
      gameEngagement: {
        avgGamesPerUser: Math.round(avgGamesPerUser * 10) / 10,
        avgCorrectAnswers: Math.round(avgCorrectAnswers * 10) / 10,
        mostPlayedCategories,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[admin-engagement-analytics] Fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});