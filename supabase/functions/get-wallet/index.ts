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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('[GetWallet] Fetching wallet for user:', user.id);

    // Get current balances and next life time
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, lives, max_lives, last_life_regeneration, lives_regeneration_rate')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[GetWallet] Error fetching profile:', profileError);
      throw profileError;
    }

    // Calculate next life time
    let nextLifeAt = null;
    if (profile.lives < profile.max_lives) {
      const lastRegen = new Date(profile.last_life_regeneration);
      const regenRateMinutes = profile.lives_regeneration_rate;
      nextLifeAt = new Date(lastRegen.getTime() + regenRateMinutes * 60 * 1000).toISOString();
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
        livesCurrent: profile.lives,
        livesMax: profile.max_lives,
        coinsCurrent: profile.coins,
        nextLifeAt,
        regenIntervalSec: profile.lives_regeneration_rate * 60,
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
