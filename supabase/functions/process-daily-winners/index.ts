import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Gets the current local time for a given timezone
 */
function getLocalTime(timezone: string): Date {
  const utcDate = new Date();
  const localString = utcDate.toLocaleString('en-US', { timeZone: timezone });
  return new Date(localString);
}

/**
 * Checks if it's time to process daily winners for a timezone (23:55-23:59)
 */
function shouldProcessTimezone(timezone: string): boolean {
  const localTime = getLocalTime(timezone);
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  
  // Process between 23:55 and 23:59
  return hour === 23 && minute >= 55;
}

/**
 * Gets yesterday's date in local timezone
 */
function getYesterdayDate(timezone: string): string {
  const localTime = getLocalTime(timezone);
  const yesterday = new Date(localTime);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Checks if yesterday was Sunday (for jackpot determination)
 */
function wasYesterdaySunday(timezone: string): boolean {
  const localTime = getLocalTime(timezone);
  const yesterday = new Date(localTime);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.getDay() === 0;
}

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
    console.log('[DAILY-WINNERS] Starting timezone-based daily winners processing...');

    // Get all distinct user timezones
    const { data: timezones, error: timezonesError } = await supabaseClient
      .from('profiles')
      .select('user_timezone')
      .not('user_timezone', 'is', null);

    if (timezonesError) throw timezonesError;

    const uniqueTimezones = [...new Set(timezones?.map(t => t.user_timezone).filter(Boolean))];
    console.log(`[DAILY-WINNERS] Found ${uniqueTimezones.length} unique timezones to check`);

    const processedTimezones: string[] = [];
    const skippedTimezones: string[] = [];
    let totalProcessedWinners = 0;

    // Process each timezone separately
    for (const timezone of uniqueTimezones) {
      // Check if it's time to process this timezone (23:55-23:59 local time)
      if (!shouldProcessTimezone(timezone)) {
        const localTime = getLocalTime(timezone);
        console.log(`[DAILY-WINNERS] Not time yet for ${timezone} (local time: ${localTime.toLocaleTimeString()})`);
        skippedTimezones.push(timezone);
        continue;
      }

      const yesterdayDate = getYesterdayDate(timezone);
      const localTime = getLocalTime(timezone);
      console.log(`[DAILY-WINNERS] Processing ${timezone} - Local time: ${localTime.toLocaleString()}, Yesterday: ${yesterdayDate}`);

      // Check if already processed for this date
      const { data: logCheck } = await supabaseClient
        .from('daily_winner_processing_log')
        .select('last_processed_date')
        .eq('timezone', timezone)
        .single();

      if (logCheck?.last_processed_date === yesterdayDate) {
        console.log(`[DAILY-WINNERS] ${timezone} already processed for ${yesterdayDate}`);
        skippedTimezones.push(timezone);
        continue;
      }

      // Get all users in this timezone
      const { data: timezoneProfiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, username, avatar_url, country_code, user_timezone')
        .eq('user_timezone', timezone);

      if (profilesError || !timezoneProfiles || timezoneProfiles.length === 0) {
        console.log(`[DAILY-WINNERS] No users in timezone ${timezone}`);
        continue;
      }

      console.log(`[DAILY-WINNERS] Found ${timezoneProfiles.length} users in ${timezone}`);

      // Determine if yesterday was Sunday for jackpot
      const isSundayJackpot = wasYesterdaySunday(timezone);
      const topLimit = isSundayJackpot ? 25 : 10;

      // Group users by country (for country-specific leaderboards)
      const countriesByUsers = new Map<string, typeof timezoneProfiles>();
      timezoneProfiles.forEach(profile => {
        const countryCode = profile.country_code || 'UNKNOWN';
        if (!countriesByUsers.has(countryCode)) {
          countriesByUsers.set(countryCode, []);
        }
        countriesByUsers.get(countryCode)!.push(profile);
      });

      console.log(`[DAILY-WINNERS] ${timezone}: Processing ${countriesByUsers.size} countries (${isSundayJackpot ? 'Sunday Jackpot TOP25' : 'Daily TOP10'})`);

      // Process each country separately within this timezone
      for (const [countryCode, countryProfiles] of countriesByUsers) {
        const countryUserIds = countryProfiles.map(p => p.id);

        // Get top N rankings for this country for yesterday
        const { data: countryRankings, error: rankError } = await supabaseClient
          .from('daily_rankings')
          .select('user_id, total_correct_answers, average_response_time, rank')
          .eq('day_date', yesterdayDate)
          .eq('category', 'mixed')
          .in('user_id', countryUserIds)
          .order('total_correct_answers', { ascending: false })
          .order('average_response_time', { ascending: true })
          .limit(topLimit);

        if (rankError) {
          console.error(`[DAILY-WINNERS] Rank error for ${countryCode} in ${timezone}:`, rankError);
          continue;
        }

        if (!countryRankings || countryRankings.length === 0) {
          console.log(`[DAILY-WINNERS] No rankings for ${countryCode} in ${timezone}`);
          continue;
        }

        console.log(`[DAILY-WINNERS] Found ${countryRankings.length} winners in ${countryCode} (${timezone})`);

        // Create snapshot for this country's winners
        for (let idx = 0; idx < countryRankings.length; idx++) {
          const ranking = countryRankings[idx];
          const actualRank = idx + 1;
          const userProfile = countryProfiles.find(p => p.id === ranking.user_id);

          await supabaseClient
            .from('daily_leaderboard_snapshot')
            .upsert({
              snapshot_date: yesterdayDate,
              rank: actualRank,
              user_id: ranking.user_id,
              total_correct_answers: ranking.total_correct_answers,
              username: userProfile?.username || '',
              avatar_url: userProfile?.avatar_url || null,
              country_code: countryCode
            }, {
              onConflict: 'snapshot_date,user_id'
            });
        }

        // Process each winner in this country
        for (let idx = 0; idx < countryRankings.length; idx++) {
          const ranking = countryRankings[idx];
          const { user_id } = ranking;
          const actualRank = idx + 1;

          // Check if already awarded
          const { data: existing } = await supabaseClient
            .from('daily_winner_awarded')
            .select('*')
            .eq('user_id', user_id)
            .eq('day_date', yesterdayDate)
            .eq('country_code', countryCode)
            .single();

          if (existing) {
            console.log(`[DAILY-WINNERS] User ${user_id} already awarded in ${countryCode}`);
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
              day_date: yesterdayDate,
              rank: actualRank,
              gold_awarded: gold,
              lives_awarded: lives,
              status: 'pending',
              is_sunday_jackpot: isSundayJackpot,
              country_code: countryCode,
              user_timezone: timezone,
              reward_payload: {
                gold,
                lives,
                rank: actualRank,
                country_code: countryCode,
                timezone: timezone,
                day_type: isSundayJackpot ? 'sunday_jackpot' : 'normal'
              }
            });

          if (awardError) {
            console.error(`[DAILY-WINNERS] Award record error for ${user_id}:`, awardError);
            continue;
          }

          console.log(`[DAILY-WINNERS] ${countryCode} (${timezone}): Created pending reward rank ${actualRank} for user ${user_id}: ${gold} gold, ${lives} lives`);
          totalProcessedWinners++;
        }
      }

      // Update processing log for this timezone
      await supabaseClient
        .from('daily_winner_processing_log')
        .upsert({
          timezone: timezone,
          last_processed_date: yesterdayDate,
          last_processed_at: new Date().toISOString()
        }, {
          onConflict: 'timezone'
        });

      processedTimezones.push(timezone);
    }

    console.log(`[DAILY-WINNERS] Completed. Processed: ${processedTimezones.length}, Skipped: ${skippedTimezones.length}, Winners: ${totalProcessedWinners}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processedTimezones,
        skippedTimezones,
        totalTimezones: uniqueTimezones.length,
        winnersProcessed: totalProcessedWinners
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
