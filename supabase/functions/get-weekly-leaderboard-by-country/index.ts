import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_correct_answers: number;
  rank: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[get-weekly-leaderboard-by-country] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[get-weekly-leaderboard-by-country] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-weekly-leaderboard-by-country] User authenticated:', user.id);

    // Get user's country code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('country_code')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[get-weekly-leaderboard-by-country] Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profil nem található' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userCountryCode = profile?.country_code || 'HU';
    console.log('[get-weekly-leaderboard-by-country] User country:', userCountryCode);

    // Calculate current week start (Monday 00:00:00 UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysToMonday);
    monday.setUTCHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    console.log('[get-weekly-leaderboard-by-country] Week start:', weekStart);

    // Get ALL profiles from same country (this is the complete user base for this country)
    const { data: allCountryProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, country_code')
      .eq('country_code', userCountryCode)
      .order('created_at', { ascending: true });

    if (profilesError || !allCountryProfiles || allCountryProfiles.length === 0) {
      console.error('[get-weekly-leaderboard-by-country] Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ 
          leaderboard: [],
          userRank: null,
          totalPlayers: 0,
          message: 'Még nincsenek játékosok ebben az országban'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-weekly-leaderboard-by-country] Found profiles:', allCountryProfiles.length);

    // Get weekly rankings for current week (mixed category only)
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('weekly_rankings')
      .select('user_id, total_correct_answers')
      .eq('week_start', weekStart)
      .eq('category', 'mixed');

    if (rankingsError) {
      console.error('[get-weekly-leaderboard-by-country] Rankings error:', rankingsError);
    }

    console.log('[get-weekly-leaderboard-by-country] Rankings data:', rankingsData?.length || 0);

    // Create rankings map (defaults to 0 if no ranking data)
    const rankingsMap = new Map<string, number>();
    if (rankingsData) {
      rankingsData.forEach(row => {
        rankingsMap.set(row.user_id, row.total_correct_answers || 0);
      });
    }

    // Build leaderboard with ALL users from this country (including 0 scores)
    const leaderboard: LeaderboardEntry[] = allCountryProfiles.map(p => ({
      user_id: p.id,
      username: p.username || 'Player',
      avatar_url: p.avatar_url || null,
      total_correct_answers: rankingsMap.get(p.id) || 0,
      rank: 0
    }));

    // Sort by total_correct_answers descending
    leaderboard.sort((a, b) => b.total_correct_answers - a.total_correct_answers);

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Get TOP 100 (or less if country has fewer players)
    const top100 = leaderboard.slice(0, 100);

    // Find user's rank (even if not in TOP 100)
    const userEntry = leaderboard.find(entry => entry.user_id === user.id);
    const userRank = userEntry?.rank || null;

    console.log('[get-weekly-leaderboard-by-country] Returning top:', top100.length, 'User rank:', userRank);

    return new Response(
      JSON.stringify({
        leaderboard: top100,
        userRank,
        totalPlayers: leaderboard.length,
        countryCode: userCountryCode
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-weekly-leaderboard-by-country] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Szerver hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
