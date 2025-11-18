import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  // Verify cron secret for security
  const cronSecret = req.headers.get('x-supabase-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!cronSecret || cronSecret !== expectedSecret) {
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
    // Calculate last week's start date (previous Monday)
    const now = new Date();
    const budapestTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Budapest' }));
    const dayOfWeek = budapestTime.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 13 : dayOfWeek + 6; // Last Monday
    const lastWeekStart = new Date(budapestTime);
    lastWeekStart.setDate(budapestTime.getDate() - daysToSubtract);
    lastWeekStart.setHours(0, 0, 0, 0);
    const weekStart = lastWeekStart.toISOString().split('T')[0];

    // Get top 10 from last week's rankings
    const { data: topRankings, error: rankError } = await supabaseClient
      .from('weekly_rankings')
      .select('*')
      .eq('week_start', weekStart)
      .lte('rank', 10)
      .order('rank', { ascending: true });

    if (rankError) throw rankError;

    if (!topRankings || topRankings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No rankings to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        continue;
      }

      // Get prize configuration
      const { data: prize, error: prizeError } = await supabaseClient
        .from('weekly_prize_table')
        .select('*')
        .eq('rank', rank)
        .single();

      if (prizeError || !prize) {
        continue;
      }

      const { gold, lives } = prize;

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