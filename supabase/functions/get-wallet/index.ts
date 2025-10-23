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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Client for auth verification (with user's token)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError) {
      console.error('[GetWallet] Auth error:', authError);
      throw new Error('Unauthorized');
    }
    if (!user) {
      console.error('[GetWallet] No user found');
      throw new Error('Unauthorized');
    }

    // Client for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[GetWallet] Fetching wallet for user:', user.id);

    // Get current balances with subscriber status and booster info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, lives, max_lives, last_life_regeneration, lives_regeneration_rate, is_subscribed, is_subscriber, speed_booster_active, speed_booster_multiplier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[GetWallet] Error fetching profile:', profileError);
      throw profileError;
    }

    // Determine effective max lives and regen rate based on subscription and booster
    let effectiveMaxLives = 15; // Default for non-subscribers
    let effectiveRegenMinutes = 12; // Default for non-subscribers

    const isSubscriberEffective = Boolean(profile.is_subscribed || profile.is_subscriber);
    
    // Genius subscription gives base bonuses
    if (isSubscriberEffective) {
      effectiveMaxLives = 30;
      effectiveRegenMinutes = 6;
    }
    
    // Active speed booster overrides (adds to base max_lives)
    if (profile.speed_booster_active && profile.speed_booster_multiplier) {
      const multiplier = profile.speed_booster_multiplier;
      // Avoid 0 minutes, align with background job logic (min 0.5 min)
      effectiveRegenMinutes = Math.max(0.5, 12 / multiplier);
      
      // Booster adds extra lives on top of base
      const baseMax = isSubscriberEffective ? 30 : 15;
      switch (multiplier) {
        case 2:
          effectiveMaxLives = baseMax + 10;
          break;
        case 4:
          effectiveMaxLives = baseMax + 20;
          break;
        case 12:
          effectiveMaxLives = baseMax + 60;
          break;
        case 24:
          effectiveMaxLives = baseMax + 120;
          break;
        default:
          effectiveMaxLives = baseMax;
      }
    }

    // Calculate next life time
    let nextLifeAt = null;
    if (profile.lives < effectiveMaxLives) {
      const lastRegen = new Date(profile.last_life_regeneration);
      const regenIntervalMs = effectiveRegenMinutes * 60 * 1000;
      nextLifeAt = new Date(lastRegen.getTime() + regenIntervalMs).toISOString();
    }

    // Get subscription renewal date if subscriber
    let subscriberRenewAt = null;
    if (isSubscriberEffective) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (subscription?.current_period_end) {
        subscriberRenewAt = subscription.current_period_end;
      }
    }

    // Get recent ledger entries (last 20)
    const { data: ledger, error: ledgerError } = await supabase
      .from('wallet_ledger')
      .select('id, delta_coins, delta_lives, source, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ledgerError) {
      console.error('[GetWallet] Error fetching ledger:', ledgerError);
      // Non-critical, continue without ledger
    }

    return new Response(
      JSON.stringify({
        isSubscriber: isSubscriberEffective,
        livesCurrent: profile.lives,
        livesMax: effectiveMaxLives,
        coinsCurrent: profile.coins,
        nextLifeAt,
        regenIntervalSec: effectiveRegenMinutes * 60,
        regenMinutes: effectiveRegenMinutes,
        subscriberRenewAt,
        ledger: ledger || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[GetWallet] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
