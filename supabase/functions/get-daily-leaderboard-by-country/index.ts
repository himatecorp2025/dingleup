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
      console.error('[get-daily-leaderboard-by-country] No authorization header');
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
      console.error('[get-daily-leaderboard-by-country] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-daily-leaderboard-by-country] User authenticated:', user.id);

    // Get user's country code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('country_code')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[get-daily-leaderboard-by-country] Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profil nem található' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userCountryCode = profile?.country_code || 'HU';
    console.log('[get-daily-leaderboard-by-country] User country:', userCountryCode);

    // Calculate current day (YYYY-MM-DD UTC)
    const now = new Date();
    const currentDay = now.toISOString().split('T')[0];

    console.log('[get-daily-leaderboard-by-country] Current day:', currentDay);

    // Get ALL profiles from same country (this is the complete user base for this country)
    const { data: allCountryProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, country_code')
      .eq('country_code', userCountryCode)
      .order('created_at', { ascending: true });

    if (profilesError || !allCountryProfiles || allCountryProfiles.length === 0) {
      console.error('[get-daily-leaderboard-by-country] Error fetching profiles:', profilesError);
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

    console.log('[get-daily-leaderboard-by-country] Found profiles:', allCountryProfiles.length);

    // Get daily rankings for current day (mixed category only)
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('daily_rankings')
      .select('user_id, total_correct_answers')
      .eq('day_date', currentDay)
      .eq('category', 'mixed');

    if (rankingsError) {
      console.error('[get-daily-leaderboard-by-country] Error fetching rankings:', rankingsError);
      return new Response(
        JSON.stringify({ error: 'Hiba a ranglista lekérésekor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-daily-leaderboard-by-country] Rankings data:', rankingsData?.length || 0);

    // Create a map of user_id -> total_correct_answers
    const answersMap = new Map<string, number>();
    (rankingsData || []).forEach(r => {
      answersMap.set(r.user_id, r.total_correct_answers || 0);
    });

    // Build complete leaderboard: every user from this country with their answers (0 if no ranking entry)
    const leaderboardWithAnswers = allCountryProfiles.map(p => ({
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      total_correct_answers: answersMap.get(p.id) || 0,
      country_code: p.country_code
    }));

    // Sort by total_correct_answers DESC, then by username ASC for stable ranking
    leaderboardWithAnswers.sort((a, b) => {
      if (b.total_correct_answers !== a.total_correct_answers) {
        return b.total_correct_answers - a.total_correct_answers;
      }
      return a.username.localeCompare(b.username);
    });

    // Assign ranks
    const leaderboard: LeaderboardEntry[] = leaderboardWithAnswers.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.username,
      avatar_url: entry.avatar_url,
      total_correct_answers: entry.total_correct_answers,
      rank: index + 1
    }));

    // Find user's rank
    const userEntry = leaderboard.find(e => e.user_id === user.id);
    const userRank = userEntry?.rank || null;

    console.log('[get-daily-leaderboard-by-country] User rank:', userRank, 'Total players:', leaderboard.length);

    return new Response(
      JSON.stringify({
        leaderboard: leaderboard.slice(0, 100), // TOP 100
        userRank,
        totalPlayers: leaderboard.length,
        countryCode: userCountryCode,
        currentDay
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-daily-leaderboard-by-country] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
