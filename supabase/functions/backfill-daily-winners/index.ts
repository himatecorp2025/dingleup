import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * MAINTENANCE FUNCTION: Backfill daily_winner_awarded from historical snapshots
 * 
 * This function finds all (snapshot_date, country_code) pairs from daily_leaderboard_snapshot
 * that do NOT exist in daily_winner_awarded, then creates pending reward records
 * based on the snapshot rankings and prize table rules.
 * 
 * IMPORTANT: Run this once to retroactively fix missing rewards for users
 * who should have received rewards but didn't due to previous bugs.
 */

interface DailyPrize {
  rank: number;
  day_of_week: number;
  gold: number;
  lives: number;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Authenticate admin user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for maintenance operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log('[BACKFILL] Starting historical daily_winner_awarded backfill...');

    // Step 1: Get all distinct (snapshot_date, country_code) from daily_leaderboard_snapshot
    const { data: snapshots, error: snapshotError } = await supabaseService
      .from('daily_leaderboard_snapshot')
      .select('snapshot_date, country_code')
      .order('snapshot_date', { ascending: false });

    if (snapshotError) {
      throw new Error(`Failed to fetch snapshots: ${snapshotError.message}`);
    }

    if (!snapshots || snapshots.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No snapshots found',
          backfilled: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique (snapshot_date, country_code) pairs
    const uniquePairs = Array.from(
      new Set(snapshots.map(s => `${s.snapshot_date}|${s.country_code}`))
    ).map(pair => {
      const [date, country] = pair.split('|');
      return { snapshot_date: date, country_code: country };
    });

    console.log(`[BACKFILL] Found ${uniquePairs.length} unique (date, country) pairs in snapshots`);

    // Step 2: Load daily_prize_table for reward calculation
    const { data: prizeTable, error: prizeError } = await supabaseService
      .from('daily_prize_table')
      .select('rank, day_of_week, gold, lives')
      .order('rank', { ascending: true });

    if (prizeError || !prizeTable) {
      throw new Error(`Failed to load prize table: ${prizeError?.message}`);
    }

    const prizeMap = new Map<string, DailyPrize>();
    prizeTable.forEach(prize => {
      const key = `${prize.rank}-${prize.day_of_week}`;
      prizeMap.set(key, prize as DailyPrize);
    });

    let totalBackfilled = 0;
    const results: any[] = [];

    // Step 3: Process each (date, country) pair
    for (const pair of uniquePairs) {
      const { snapshot_date, country_code } = pair;

      // Check if daily_winner_awarded already has records for this date + country
      const { data: existingRecords, error: existError } = await supabaseService
        .from('daily_winner_awarded')
        .select('id')
        .eq('day_date', snapshot_date)
        .eq('country_code', country_code)
        .limit(1);

      if (existError) {
        console.error(`[BACKFILL] Error checking existing records for ${snapshot_date}, ${country_code}:`, existError);
        continue;
      }

      if (existingRecords && existingRecords.length > 0) {
        console.log(`[BACKFILL] Skipping ${snapshot_date}, ${country_code} - already has awards`);
        continue;
      }

      // Calculate day of week for this date
      const dateObj = new Date(snapshot_date + 'T00:00:00Z');
      const jsDay = dateObj.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const dayOfWeek = jsDay === 0 ? 7 : jsDay; // Convert to 1=Monday, ..., 7=Sunday
      const isSunday = dayOfWeek === 7;
      const topLimit = isSunday ? 25 : 10;

      console.log(`[BACKFILL] Processing ${snapshot_date}, ${country_code} (day ${dayOfWeek}, TOP ${topLimit})`);

      // Fetch TOP N players from snapshot for this date + country
      const { data: topPlayers, error: playersError } = await supabaseService
        .from('daily_leaderboard_snapshot')
        .select('user_id, rank, username, avatar_url, total_correct_answers')
        .eq('snapshot_date', snapshot_date)
        .eq('country_code', country_code)
        .order('rank', { ascending: true })
        .lte('rank', topLimit);

      if (playersError || !topPlayers || topPlayers.length === 0) {
        console.log(`[BACKFILL] No players found for ${snapshot_date}, ${country_code}`);
        continue;
      }

      // Create daily_winner_awarded records
      const rewardsToInsert = topPlayers.map(player => {
        const prizeKey = `${player.rank}-${dayOfWeek}`;
        const prize = prizeMap.get(prizeKey);

        if (!prize) {
          console.warn(`[BACKFILL] No prize found for rank ${player.rank}, day ${dayOfWeek}`);
          return null;
        }

        return {
          user_id: player.user_id,
          rank: player.rank,
          day_date: snapshot_date,
          gold_awarded: prize.gold,
          lives_awarded: prize.lives,
          country_code: country_code,
          username: player.username,
          avatar_url: player.avatar_url,
          total_correct_answers: player.total_correct_answers,
          is_sunday_jackpot: isSunday,
          status: 'pending', // CRITICAL: Set as pending so users can claim
          awarded_at: new Date().toISOString(),
          reward_payload: {
            backfilled: true,
            original_date: snapshot_date,
            rank: player.rank,
            country_code: country_code,
            day_of_week: dayOfWeek
          }
        };
      }).filter(Boolean);

      if (rewardsToInsert.length === 0) {
        continue;
      }

      // Insert rewards
      const { error: insertError } = await supabaseService
        .from('daily_winner_awarded')
        .insert(rewardsToInsert);

      if (insertError) {
        console.error(`[BACKFILL] Insert error for ${snapshot_date}, ${country_code}:`, insertError);
        results.push({
          date: snapshot_date,
          country: country_code,
          status: 'error',
          error: insertError.message
        });
      } else {
        console.log(`[BACKFILL] ✓ Inserted ${rewardsToInsert.length} rewards for ${snapshot_date}, ${country_code}`);
        totalBackfilled += rewardsToInsert.length;
        results.push({
          date: snapshot_date,
          country: country_code,
          status: 'success',
          count: rewardsToInsert.length
        });
      }
    }

    console.log(`[BACKFILL] Complete. Total backfilled: ${totalBackfilled}`);

    return new Response(
      JSON.stringify({ 
        message: 'Backfill complete',
        totalBackfilled,
        processedPairs: results.length,
        results: results.slice(0, 50) // Return first 50 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[BACKFILL] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
