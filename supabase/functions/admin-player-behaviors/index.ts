import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

// Categories we support in the dashboard
const CATEGORIES = ['health', 'history', 'culture', 'finance'] as const;

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
      // game_results aggregation with service role (bypasses RLS)
      let resultsQuery = service.from('game_results')
        .select('user_id, completed, correct_answers, average_response_time, created_at')
        .eq('category', cat);

      if (startISO) resultsQuery = resultsQuery.gte('created_at', startISO);
      if (endISO) resultsQuery = resultsQuery.lte('created_at', endISO);

      const { data: results, error: resultsError } = await resultsQuery;
      
      if (resultsError) {
        console.error(`[admin-player-behaviors] Error fetching ${cat} results:`, resultsError);
      }
      
      console.log(`[admin-player-behaviors] ${cat}: fetched ${results?.length || 0} game results from DB`);

      // Filter out "instant quit" games (no answer AND no timeout)
      const validGames = (results || []).filter(r => 
        (r.correct_answers != null && r.correct_answers > 0) || 
        (r.average_response_time != null && r.average_response_time > 0)
      );
      
      console.log(`[admin-player-behaviors] ${cat}: ${validGames.length} valid games (filtered out instant quits)`);

      const totalGames = validGames.length;
      const completedGames = validGames.filter(r => r.completed === true).length;
      const uniquePlayers = new Set(validGames.map(r => r.user_id)).size;

      // Average correct answers across ALL valid games (not just completed)
      const avgCorrectAnswers = totalGames > 0
        ? (validGames.reduce((s, r) => s + (r.correct_answers || 0), 0) / totalGames)
        : 0;

      // Average response time across ALL valid games that have response time
      const gamesWithTime = validGames.filter(r => r.average_response_time != null && r.average_response_time > 0);
      const avgResponseTime = gamesWithTime.length > 0
        ? (gamesWithTime.reduce((s, r) => s + Number(r.average_response_time), 0) / gamesWithTime.length)
        : 0;

      // help usage aggregation with service role (bypasses RLS)
      let helpQuery = service.from('game_help_usage')
        .select('help_type')
        .eq('category', cat);
      if (startISO) helpQuery = helpQuery.gte('used_at', startISO);
      if (endISO) helpQuery = helpQuery.lte('used_at', endISO);
      
      const { data: helps, error: helpsError } = await helpQuery;
      
      if (helpsError) {
        console.error(`[admin-player-behaviors] Error fetching ${cat} help usage:`, helpsError);
      }
      
      console.log(`[admin-player-behaviors] ${cat}: fetched ${helps?.length || 0} help usage records from DB`);

      const helpUsage = {
        third: (helps || []).filter(h => h.help_type === 'third').length,
        skip: (helps || []).filter(h => h.help_type === 'skip').length,
        audience: (helps || []).filter(h => h.help_type === 'audience').length,
        '2x_answer': (helps || []).filter(h => h.help_type === '2x_answer').length,
      } as const;

      const categoryStats = {
        category: cat,
        uniquePlayers,
        totalGames,
        completedGames,
        abandonedGames: totalGames - completedGames,
        completionRate: totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0,
        avgCorrectAnswers: Math.round(avgCorrectAnswers * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        helpUsage,
      };
      
      console.log(`[admin-player-behaviors] ${cat} stats:`, categoryStats);
      stats.push(categoryStats);
    }
    
    console.log('[admin-player-behaviors] Returning all stats:', stats);

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
