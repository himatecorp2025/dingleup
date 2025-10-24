import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Categories we support in the dashboard
const CATEGORIES = ['health', 'history', 'culture', 'finance'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { startDate, endDate } = await req.json().catch(() => ({ startDate: null, endDate: null }));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user and role with anon key
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

    // Service role client to bypass RLS
    const service = createClient(supabaseUrl, supabaseServiceKey);

    // Build date filter fragments
    const hasRange = !!startDate || !!endDate;
    const startISO = startDate ? new Date(startDate).toISOString() : null;
    const endISO = endDate ? new Date(endDate).toISOString() : null;

    const stats: any[] = [];

    for (const cat of CATEGORIES) {
      // game_results aggregation
      let resultsQuery = service.from('game_results')
        .select('user_id, completed, correct_answers, average_response_time, created_at')
        .eq('category', cat);

      if (startISO) resultsQuery = resultsQuery.gte('created_at', startISO);
      if (endISO) resultsQuery = resultsQuery.lte('created_at', endISO);

      const { data: results, error: resultsError } = await resultsQuery;
      if (resultsError) console.error('[admin-player-behaviors] resultsError', resultsError);

      const totalGames = results?.length || 0;
      const completedGames = results?.filter(r => r.completed === true).length || 0;
      const uniquePlayers = new Set((results || []).map(r => r.user_id)).size;

      const avgCorrectAnswers = completedGames > 0
        ? ((results || []).filter(r => r.completed).reduce((s, r) => s + (r.correct_answers || 0), 0) / completedGames)
        : 0;

      const avgResponseTime = completedGames > 0
        ? ((results || []).filter(r => r.completed && r.average_response_time != null).reduce((s, r) => s + Number(r.average_response_time), 0) / completedGames)
        : 0;

      // help usage aggregation
      let helpQuery = service.from('game_help_usage')
        .select('help_type')
        .eq('category', cat);
      if (startISO) helpQuery = helpQuery.gte('used_at', startISO);
      if (endISO) helpQuery = helpQuery.lte('used_at', endISO);
      const { data: helps, error: helpsError } = await helpQuery;
      if (helpsError) console.error('[admin-player-behaviors] helpsError', helpsError);

      const helpUsage = {
        third: (helps || []).filter(h => h.help_type === 'third').length,
        skip: (helps || []).filter(h => h.help_type === 'skip').length,
        audience: (helps || []).filter(h => h.help_type === 'audience').length,
        '2x_answer': (helps || []).filter(h => h.help_type === '2x_answer').length,
      } as const;

      stats.push({
        category: cat,
        uniquePlayers,
        totalGames,
        completedGames,
        abandonedGames: totalGames - completedGames,
        completionRate: totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0,
        avgCorrectAnswers: Math.round(avgCorrectAnswers * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        helpUsage,
      });
    }

    return new Response(JSON.stringify({ stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[admin-player-behaviors] Fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
