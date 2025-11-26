import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

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
      .single();

    if (profileError || !userProfile) {
      console.error('[GET-PENDING-REWARD] Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate yesterday's date (use UTC for now, but rewards are timezone-specific)
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    console.log(`[GET-PENDING-REWARD] Checking user ${user.id} in country ${userProfile.country_code} (timezone: ${userProfile.user_timezone})`);

    // Check for pending reward from yesterday FOR THIS USER (country + timezone specific)
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
