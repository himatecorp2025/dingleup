import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    console.log('[WEEKLY-WINNERS] Starting weekly winner processing');

    // Calculate last week's start date (previous Monday)
    const now = new Date();
    const budapestTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Budapest' }));
    const dayOfWeek = budapestTime.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 13 : dayOfWeek + 6; // Last Monday
    const lastWeekStart = new Date(budapestTime);
    lastWeekStart.setDate(budapestTime.getDate() - daysToSubtract);
    lastWeekStart.setHours(0, 0, 0, 0);
    const weekStart = lastWeekStart.toISOString().split('T')[0];

    console.log(`[WEEKLY-WINNERS] Processing for week: ${weekStart}`);

    // Get top 10 from last week's rankings
    const { data: topRankings, error: rankError } = await supabaseClient
      .from('weekly_rankings')
      .select('*')
      .eq('week_start', weekStart)
      .lte('rank', 10)
      .order('rank', { ascending: true });

    if (rankError) throw rankError;

    if (!topRankings || topRankings.length === 0) {
      console.log('[WEEKLY-WINNERS] No rankings found for this week');
      return new Response(
        JSON.stringify({ success: true, message: 'No rankings to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WEEKLY-WINNERS] Found ${topRankings.length} winners`);

    // Create snapshot
    for (const ranking of topRankings) {
      await supabaseClient
        .from('weekly_leaderboard_snapshot')
        .upsert({
          week_start: weekStart,
          rank: ranking.rank,
          user_id: ranking.user_id,
          score: ranking.total_correct_answers,
          snapshot_at: new Date().toISOString()
        }, {
          onConflict: 'week_start,user_id'
        });
    }

    // Process each winner
    let processedCount = 0;
    for (const ranking of topRankings) {
      const { user_id, rank } = ranking;

      // Check if already awarded
      const { data: existing } = await supabaseClient
        .from('weekly_winner_awarded')
        .select('*')
        .eq('user_id', user_id)
        .eq('week_start', weekStart)
        .single();

      if (existing) {
        console.log(`[WEEKLY-WINNERS] User ${user_id} already awarded for week ${weekStart}`);
        continue;
      }

      // Get prize configuration
      const { data: prize, error: prizeError } = await supabaseClient
        .from('weekly_prize_table')
        .select('*')
        .eq('rank', rank)
        .single();

      if (prizeError || !prize) {
        console.log(`[WEEKLY-WINNERS] No prize config for rank ${rank}`);
        continue;
      }

      const { gold, lives } = prize;
      console.log(`[WEEKLY-WINNERS] Awarding rank ${rank} to user ${user_id}: ${gold} gold, ${lives} lives`);

      // Credit wallet (coins)
      const correlationId = `weekly-top10:${user_id}:${weekStart}:${rank}`;
      const { error: coinError } = await supabaseClient
        .rpc('credit_wallet', {
          p_user_id: user_id,
          p_delta_coins: gold,
          p_delta_lives: 0,
          p_source: 'weekly_reward',
          p_idempotency_key: correlationId,
          p_metadata: {
            week_start: weekStart,
            rank,
            gold
          }
        });

      if (coinError) {
        console.error(`[WEEKLY-WINNERS] Error crediting coins for user ${user_id}:`, coinError);
        continue;
      }

      // Credit lives
      const livesCorrelationId = `weekly-top10-lives:${user_id}:${weekStart}:${rank}`;
      const { error: livesError } = await supabaseClient
        .rpc('credit_lives', {
          p_user_id: user_id,
          p_delta_lives: lives,
          p_source: 'weekly_reward',
          p_idempotency_key: livesCorrelationId,
          p_metadata: {
            week_start: weekStart,
            rank,
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
          rank,
          awarded_at: new Date().toISOString()
        });

      if (awardError) {
        console.error(`[WEEKLY-WINNERS] Error marking as awarded for user ${user_id}:`, awardError);
        continue;
      }

      processedCount++;
    }

    console.log(`[WEEKLY-WINNERS] Processed ${processedCount} winners successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStart,
        winners_processed: processedCount
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