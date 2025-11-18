import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nincs bejelentkezve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    );

    console.log('[DAILY-GIFT] Attempting to get user from token');
    // Use the JWT token directly with auth.getUser()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('[DAILY-GIFT] User error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen felhasználó', details: userError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    if (!user) {
      console.error('[DAILY-GIFT] No user returned from auth.getUser()');
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen felhasználó' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('[DAILY-GIFT] User authenticated:', user.id);

    // Idempotency: check if already claimed today (UTC date)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC
    const idempotencyKey = `daily-gift:${user.id}:${today}`;

    // Check wallet_ledger for existing claim
    const { data: existingClaim, error: checkError } = await supabaseClient
      .from('wallet_ledger')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (checkError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Hiba történt az ellenőrzés során' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingClaim) {
      return new Response(
        JSON.stringify({ success: false, error: 'Már átvettél ma ajándékot' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('daily_gift_streak, daily_gift_last_claimed, coins')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profil nem található' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Calculate streak (7-day cycle)
    const currentStreak = profile.daily_gift_streak ?? 0;
    const newStreak = currentStreak + 1;

    // Calculate reward based on cycle position (0-6)
    const cyclePosition = currentStreak % 7;
    const rewardCoins = [50, 75, 110, 160, 220, 300, 500][cyclePosition];

    // Credit coins via wallet_ledger with idempotency key
    const { error: creditError } = await supabaseClient
      .from('wallet_ledger')
      .insert({
        user_id: user.id,
        delta_coins: rewardCoins,
        delta_lives: 0,
        source: 'daily',
        idempotency_key: idempotencyKey,
        metadata: {
          streak: newStreak,
          cycle_position: cyclePosition,
          date: today
        }
      });

    if (creditError) {
      console.error('[DAILY-GIFT] Credit error:', creditError);
      return new Response(
        JSON.stringify({ success: false, error: 'Nem sikerült a jutalom jóváírása', details: creditError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        coins: profile.coins + rewardCoins,
        daily_gift_streak: newStreak,
        daily_gift_last_claimed: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profil frissítése sikertelen' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        grantedCoins: rewardCoins,
        walletBalance: profile.coins + rewardCoins,
        streak: newStreak
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Szerver hiba történt' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
