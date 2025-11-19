import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  // Verify cron secret OR admin authentication OR test mode in development
  const cronSecret = req.headers.get('x-supabase-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  const hasValidCronSecret = cronSecret && cronSecret === expectedSecret;
  let isAdmin = false;
  
  // Parse URL for test mode
  const url = new URL(req.url);
  const testMode = url.searchParams.get('test_mode') === 'true';
  const isDevelopment = (Deno.env.get('SUPABASE_URL') || '').includes('wdpxmwsxhckazwxufttk');

  if (!hasValidCronSecret) {
    // Check if request has valid JWT and user is admin
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { 
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false }
        }
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        // Check if user has admin role
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        isAdmin = !!roleData;
      }
    }
  }

  // Allow test mode only in development
  const isAuthorized = hasValidCronSecret || isAdmin || (testMode && isDevelopment);

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }), 
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    // Get week_start from query parameter or calculate last completed week
    const url = new URL(req.url);
    const weekStartParam = url.searchParams.get('week_start');
    
    let weekStart: string;
    
    if (weekStartParam) {
      // Use provided week_start (for manual testing)
      weekStart = weekStartParam;
      console.log('[WEEKLY-WINNERS] Using provided week_start:', weekStart);
    } else {
      // Calculate last week's start date (previous Monday)
      // This runs on Sunday night, so we need the Monday that started 6 days ago
      const now = new Date();
      const dayOfWeek = now.getUTCDay(); // 0=Sunday, 1=Monday, etc.
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek + 6; // Last Monday
      const lastWeekStart = new Date(now);
      lastWeekStart.setUTCDate(now.getUTCDate() - daysToSubtract);
      lastWeekStart.setUTCHours(0, 0, 0, 0);
      weekStart = lastWeekStart.toISOString().split('T')[0];
      console.log('[WEEKLY-WINNERS] Calculated last week start:', weekStart);
    }

    console.log('[WEEKLY-WINNERS] Processing week:', weekStart);

    // Get all distinct countries from profiles
    const { data: countries, error: countriesError } = await supabaseClient
      .from('profiles')
      .select('country_code')
      .not('country_code', 'is', null);

    if (countriesError) throw countriesError;

    const uniqueCountries = [...new Set(countries?.map(c => c.country_code) || [])];
    console.log('[WEEKLY-WINNERS] Processing countries:', uniqueCountries.length);

    let totalProcessedWinners = 0;

    // Process each country separately
    for (const countryCode of uniqueCountries) {
      console.log(`[WEEKLY-WINNERS] Processing country: ${countryCode}`);

      // Get all users from this country
      const { data: countryProfiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('country_code', countryCode);

      if (profilesError || !countryProfiles || countryProfiles.length === 0) {
        console.log(`[WEEKLY-WINNERS] No profiles for country ${countryCode}`);
        continue;
      }

      const countryUserIds = countryProfiles.map(p => p.id);

      // Get top 10 rankings for this country for the last week
      const { data: countryRankings, error: rankError } = await supabaseClient
        .from('weekly_rankings')
        .select('user_id, total_correct_answers, average_response_time, rank')
        .eq('week_start', weekStart)
        .eq('category', 'mixed')
        .in('user_id', countryUserIds)
        .order('total_correct_answers', { ascending: false })
        .order('average_response_time', { ascending: true })
        .limit(10);

      if (rankError) {
        console.error(`[WEEKLY-WINNERS] Rank error for ${countryCode}:`, rankError);
        continue;
      }

      if (!countryRankings || countryRankings.length === 0) {
        console.log(`[WEEKLY-WINNERS] No rankings for country ${countryCode}`);
        continue;
      }

      console.log(`[WEEKLY-WINNERS] Found ${countryRankings.length} winners in ${countryCode}`);

      // Create snapshot for this country's winners
      for (let idx = 0; idx < countryRankings.length; idx++) {
        const ranking = countryRankings[idx];
        const actualRank = idx + 1; // Rank 1-10 based on position

        await supabaseClient
          .from('weekly_leaderboard_snapshot')
          .upsert({
            week_start: weekStart,
            rank: actualRank,
            user_id: ranking.user_id,
            score: ranking.total_correct_answers,
            snapshot_at: new Date().toISOString()
          }, {
            onConflict: 'week_start,user_id'
          });
      }

      // Process each winner in this country
      for (let idx = 0; idx < countryRankings.length; idx++) {
        const ranking = countryRankings[idx];
        const { user_id } = ranking;
        const actualRank = idx + 1; // Rank 1-10

        // Check if already awarded
        const { data: existing } = await supabaseClient
          .from('weekly_winner_awarded')
          .select('*')
          .eq('user_id', user_id)
          .eq('week_start', weekStart)
          .single();

        if (existing) {
          console.log(`[WEEKLY-WINNERS] User ${user_id} already awarded`);
          continue;
        }

        // Get prize configuration
        const { data: prize, error: prizeError } = await supabaseClient
          .from('weekly_prize_table')
          .select('*')
          .eq('rank', actualRank)
          .single();

        if (prizeError || !prize) {
          console.error(`[WEEKLY-WINNERS] Prize config missing for rank ${actualRank}:`, prizeError);
          continue;
        }

        const { gold, lives } = prize;

        // Credit wallet (coins)
        const correlationId = `weekly-top10:${user_id}:${weekStart}:${actualRank}:${countryCode}`;
        const { error: coinError } = await supabaseClient
          .rpc('credit_wallet', {
            p_user_id: user_id,
            p_delta_coins: gold,
            p_delta_lives: 0,
            p_source: 'weekly_reward',
            p_idempotency_key: correlationId,
            p_metadata: {
              week_start: weekStart,
              rank: actualRank,
              country_code: countryCode,
              gold
            }
          });

        if (coinError) {
          console.error(`[WEEKLY-WINNERS] Error crediting coins for user ${user_id}:`, coinError);
          continue;
        }

        // Credit lives
        const livesCorrelationId = `weekly-top10-lives:${user_id}:${weekStart}:${actualRank}:${countryCode}`;
        const { error: livesError } = await supabaseClient
          .rpc('credit_lives', {
            p_user_id: user_id,
            p_delta_lives: lives,
            p_source: 'weekly_reward',
            p_idempotency_key: livesCorrelationId,
            p_metadata: {
              week_start: weekStart,
              rank: actualRank,
              country_code: countryCode,
              lives
            }
          });

        if (livesError) {
          console.error(`[WEEKLY-WINNERS] Error crediting lives for user ${user_id}:`, livesError);
          continue;
        }

        // Mark as awarded
        const { error: awardError } = await supabaseClient
          .from('weekly_winner_awarded')
          .insert({
            user_id,
            week_start: weekStart,
            rank: actualRank,
            awarded_at: new Date().toISOString()
          });

        if (awardError) {
          console.error(`[WEEKLY-WINNERS] Error marking as awarded for user ${user_id}:`, awardError);
          continue;
        }

        totalProcessedWinners++;
        console.log(`[WEEKLY-WINNERS] Awarded user ${user_id} rank ${actualRank} in ${countryCode}: ${gold} gold + ${lives} lives`);
      }
    }

    console.log(`[WEEKLY-WINNERS] Total winners processed: ${totalProcessedWinners} across ${uniqueCountries.length} countries`);

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStart,
        countries_processed: uniqueCountries.length,
        winners_processed: totalProcessedWinners
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WEEKLY-WINNERS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});