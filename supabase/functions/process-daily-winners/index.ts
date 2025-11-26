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
    // Get day_date from query parameter or calculate yesterday
    const dayDateParam = url.searchParams.get('day_date');
    
    let dayDate: string;
    
    if (dayDateParam) {
      // Use provided day_date (for manual testing)
      dayDate = dayDateParam;
      console.log('[DAILY-WINNERS] Using provided day_date:', dayDate);
    } else {
      // Calculate yesterday's date (the day that just ended)
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);
      dayDate = yesterday.toISOString().split('T')[0];
      console.log('[DAILY-WINNERS] Calculated yesterday:', dayDate);
    }

    console.log('[DAILY-WINNERS] Processing day:', dayDate);

    // Get all distinct countries from profiles
    const { data: countries, error: countriesError } = await supabaseClient
      .from('profiles')
      .select('country_code')
      .not('country_code', 'is', null);

    if (countriesError) throw countriesError;

    const uniqueCountries = [...new Set(countries?.map(c => c.country_code) || [])];
    console.log('[DAILY-WINNERS] Processing countries:', uniqueCountries.length);

    let totalProcessedWinners = 0;

    // Process each country separately
    for (const countryCode of uniqueCountries) {
      console.log(`[DAILY-WINNERS] Processing country: ${countryCode}`);

      // Get all users from this country
      const { data: countryProfiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('country_code', countryCode);

      if (profilesError || !countryProfiles || countryProfiles.length === 0) {
        console.log(`[DAILY-WINNERS] No profiles for country ${countryCode}`);
        continue;
      }

      const countryUserIds = countryProfiles.map(p => p.id);

      // Determine if today is Sunday (day 0) for TOP25 jackpot
      const dateObj = new Date(dayDate + 'T00:00:00Z');
      const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday
      const isSundayJackpot = dayOfWeek === 0;
      const topLimit = isSundayJackpot ? 25 : 10;

      // Get top N rankings for this country for yesterday (N = 10 or 25 depending on day)
      const { data: countryRankings, error: rankError } = await supabaseClient
        .from('daily_rankings')
        .select('user_id, total_correct_answers, average_response_time, rank')
        .eq('day_date', dayDate)
        .eq('category', 'mixed')
        .in('user_id', countryUserIds)
        .order('total_correct_answers', { ascending: false })
        .order('average_response_time', { ascending: true })
        .limit(topLimit);

      if (rankError) {
        console.error(`[DAILY-WINNERS] Rank error for ${countryCode}:`, rankError);
        continue;
      }

      if (!countryRankings || countryRankings.length === 0) {
        console.log(`[DAILY-WINNERS] No rankings for country ${countryCode}`);
        continue;
      }

      console.log(`[DAILY-WINNERS] Found ${countryRankings.length} winners in ${countryCode} (${isSundayJackpot ? 'Sunday TOP25' : 'TOP10'})`);

      // Create snapshot for this country's winners
      for (let idx = 0; idx < countryRankings.length; idx++) {
        const ranking = countryRankings[idx];
        const actualRank = idx + 1; // Rank 1-10 based on position

        await supabaseClient
          .from('daily_leaderboard_snapshot')
          .upsert({
            snapshot_date: dayDate,
            rank: actualRank,
            user_id: ranking.user_id,
            total_correct_answers: ranking.total_correct_answers,
            username: '', // Will be filled by trigger or can fetch from profiles
            country_code: countryCode
          }, {
            onConflict: 'snapshot_date,user_id'
          });
      }

      // Process each winner in this country
      for (let idx = 0; idx < countryRankings.length; idx++) {
        const ranking = countryRankings[idx];
        const { user_id } = ranking;
        const actualRank = idx + 1; // Rank 1-10

        // Check if already awarded
        const { data: existing } = await supabaseClient
          .from('daily_winner_awarded')
          .select('*')
          .eq('user_id', user_id)
          .eq('day_date', dayDate)
          .single();

        if (existing) {
          console.log(`[DAILY-WINNERS] User ${user_id} already awarded`);
          continue;
        }

        // Get prize configuration
        const { data: prize, error: prizeError } = await supabaseClient
          .from('daily_prize_table')
          .select('*')
          .eq('rank', actualRank)
          .single();

        if (prizeError || !prize) {
          console.error(`[DAILY-WINNERS] Prize config missing for rank ${actualRank}:`, prizeError);
          continue;
        }

        const { gold, lives } = prize;

        // Create pending reward record (NO automatic credit)
        const { error: awardError } = await supabaseClient
          .from('daily_winner_awarded')
          .insert({
            user_id,
            day_date: dayDate,
            rank: actualRank,
            gold_awarded: gold,
            lives_awarded: lives,
            status: 'pending',
            is_sunday_jackpot: isSundayJackpot,
            reward_payload: {
              gold,
              lives,
              rank: actualRank,
              country_code: countryCode,
              day_type: isSundayJackpot ? 'sunday_jackpot' : 'normal'
            }
          });

        if (awardError) {
          console.error(`[DAILY-WINNERS] Award record error for ${user_id}:`, awardError);
          continue;
        }

        console.log(`[DAILY-WINNERS] Created pending reward rank ${actualRank} for user ${user_id}: ${gold} gold, ${lives} lives (status: pending)`);
        totalProcessedWinners++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        day_date: dayDate,
        winners_processed: totalProcessedWinners,
        countries_processed: uniqueCountries.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[DAILY-WINNERS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
