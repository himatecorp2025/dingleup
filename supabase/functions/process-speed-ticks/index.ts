import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Verify cron authentication
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;
    
    if (authHeader !== expectedAuth) {
      console.error('[Security] Unauthorized cron access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[ProcessSpeedTicks] Starting speed tick processing...');

    // Get all users with active speed boosters
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, speed_booster_active, speed_booster_expires_at, speed_booster_multiplier, speed_tick_last_processed_at, speed_coins_per_tick, speed_lives_per_tick, speed_tick_interval_seconds')
      .eq('speed_booster_active', true)
      .not('speed_booster_expires_at', 'is', null);

    if (usersError) {
      console.error('[ProcessSpeedTicks] Error fetching users:', usersError);
      throw usersError;
    }

    console.log('[ProcessSpeedTicks] Found active users:', activeUsers?.length || 0);

    let processedCount = 0;
    let expiredCount = 0;

    for (const user of activeUsers || []) {
      const now = new Date();
      const expiresAt = new Date(user.speed_booster_expires_at);

      // Check if expired
      if (now >= expiresAt) {
        console.log('[ProcessSpeedTicks] Speed expired for user:', user.id);
        
        // Deactivate speed booster
        await supabase
          .from('profiles')
          .update({
            speed_booster_active: false,
            speed_booster_expires_at: null,
            speed_booster_multiplier: 1,
            speed_tick_last_processed_at: null,
            speed_coins_per_tick: 0,
            speed_lives_per_tick: 0
          })
          .eq('id', user.id);

        expiredCount++;
        continue;
      }

      // Calculate ticks due
      const lastProcessed = user.speed_tick_last_processed_at ? new Date(user.speed_tick_last_processed_at) : new Date(user.speed_booster_expires_at);
      const tickInterval = user.speed_tick_interval_seconds || 60;
      const secondsSinceLastTick = Math.floor((now.getTime() - lastProcessed.getTime()) / 1000);
      const ticksDue = Math.floor(secondsSinceLastTick / tickInterval);

      if (ticksDue < 1) {
        continue; // No ticks due yet
      }

      console.log('[ProcessSpeedTicks] Processing', ticksDue, 'ticks for user:', user.id);

      // Process each tick with idempotency
      for (let i = 0; i < ticksDue; i++) {
        const tickTimestamp = new Date(lastProcessed.getTime() + (i + 1) * tickInterval * 1000);
        const idempotencyKey = `speed_tick:${user.id}:${tickTimestamp.toISOString()}`;

        try {
          // Credit wallet using idempotent function
          const { error: creditError } = await supabase.rpc('credit_wallet', {
            p_user_id: user.id,
            p_delta_coins: user.speed_coins_per_tick || 0,
            p_delta_lives: user.speed_lives_per_tick || 0,
            p_source: 'speed_tick',
            p_idempotency_key: idempotencyKey,
            p_metadata: {
              multiplier: user.speed_booster_multiplier,
              tick_number: i + 1,
              tick_timestamp: tickTimestamp.toISOString()
            }
          });

          if (creditError) {
            console.error('[ProcessSpeedTicks] Error crediting wallet:', creditError);
            // Continue with other ticks even if one fails
          }
        } catch (err) {
          console.error('[ProcessSpeedTicks] Exception processing tick:', err);
        }
      }

      // Update last processed time
      const newLastProcessed = new Date(lastProcessed.getTime() + ticksDue * tickInterval * 1000);
      await supabase
        .from('profiles')
        .update({ speed_tick_last_processed_at: newLastProcessed.toISOString() })
        .eq('id', user.id);

      processedCount++;
    }

    console.log('[ProcessSpeedTicks] Completed. Processed:', processedCount, 'Expired:', expiredCount);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        expired: expiredCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[INTERNAL] [ProcessSpeedTicks] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
