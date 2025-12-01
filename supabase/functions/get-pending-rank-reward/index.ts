import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Get yesterday's date in user's timezone (timezone-aware)
 */
function getYesterdayDateInTimezone(timezone: string): string {
  try {
    const nowUtc = new Date();
    const localTimeString = nowUtc.toLocaleString('en-US', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const localNow = new Date(localTimeString);
    const yesterday = new Date(localNow);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('[YESTERDAY-DATE] Error:', error);
    // Fallback: UTC yesterday
    const utcYesterday = new Date();
    utcYesterday.setUTCDate(utcYesterday.getUTCDate() - 1);
    utcYesterday.setUTCHours(0, 0, 0, 0);
    return utcYesterday.toISOString().split('T')[0];
  }
}

/**
 * Get pending rank reward for authenticated user
 * Returns pending reward details if user has unclaimed daily ranking reward
 */
serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Extract bearer token and use it explicitly for auth.getUser
    const token = authHeader.replace('Bearer ', '').trim();

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's country and timezone from profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('country_code, user_timezone, username')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[GET-PENDING-REWARD] Profile error, treating as no pending reward:', profileError);
      return new Response(
        JSON.stringify({ 
          hasPendingReward: false,
          reward: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no profile or missing critical fields, no pending reward
    if (!userProfile || !userProfile.country_code) {
      console.log('[GET-PENDING-REWARD] Profile incomplete, no reward check');
      return new Response(
        JSON.stringify({ 
          hasPendingReward: false,
          reward: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate yesterday's date using timezone-aware logic
    const userTimezone = userProfile.user_timezone || 'Europe/Budapest';
    const yesterdayDate = getYesterdayDateInTimezone(userTimezone);

    console.log(`[GET-PENDING-REWARD] Checking user ${user.id}, country: ${userProfile.country_code}, timezone: ${userTimezone}, yesterday: ${yesterdayDate}`);

    // Check for pending reward from yesterday FOR THIS USER
    // CRITICAL: Filter by user_id, country_code, day_date, status='pending'
    const { data: pendingReward, error: rewardError } = await supabaseClient
      .from('daily_winner_awarded')
      .select('*')
      .eq('user_id', user.id)
      .eq('country_code', userProfile.country_code)
      .eq('day_date', yesterdayDate)
      .eq('status', 'pending')
      .single();

    if (rewardError && rewardError.code !== 'PGRST116') {
      console.error('[GET-PENDING-REWARD] Error fetching pending reward:', rewardError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending reward' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingReward) {
      return new Response(
        JSON.stringify({ 
          hasPendingReward: false,
          reward: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        hasPendingReward: true,
        reward: {
          rank: pendingReward.rank,
          gold: pendingReward.gold_awarded,
          lives: pendingReward.lives_awarded,
          isSundayJackpot: pendingReward.is_sunday_jackpot || false,
          dayDate: pendingReward.day_date,
          username: userProfile.username || 'Player',
          rewardPayload: pendingReward.reward_payload
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GET-PENDING-REWARD] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
