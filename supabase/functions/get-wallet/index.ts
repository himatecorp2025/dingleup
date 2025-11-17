import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Client for auth verification with proper header passing
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    // Verify user authentication using the JWT directly to avoid session lookup
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
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

    // Lives regeneration via DB RPC removed (non-existent RPC). We calculate below based on profile fields.


    // Get current balances with subscriber status and booster info (after regeneration)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, lives, max_lives, last_life_regeneration, lives_regeneration_rate')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[GetWallet] Error fetching profile:', profileError);
      throw profileError;
    }

    // Determine effective max lives and regen rate from profile fields
    let effectiveMaxLives = Number(profile.max_lives ?? 15);
    let effectiveRegenMinutes = Number(profile.lives_regeneration_rate ?? 12);

    if (!Number.isFinite(effectiveMaxLives) || effectiveMaxLives <= 0) {
      effectiveMaxLives = 15;
    }
    if (!Number.isFinite(effectiveRegenMinutes) || effectiveRegenMinutes <= 0) {
      effectiveRegenMinutes = 12;
    }

    // Calculate next life time with proper regeneration tracking + future timestamp guard
    let currentLives = Number(profile.lives ?? 0);
    let nextLifeAt = null;
    
    if (currentLives < effectiveMaxLives) {
      const nowMs = Date.now();
      let lastRegenMs = new Date(profile.last_life_regeneration).getTime();
      const regenIntervalMs = effectiveRegenMinutes * 60 * 1000;

      // Guard: if last_life_regeneration is in the future, normalize it to now (no tolerance)
      if (lastRegenMs > nowMs) {
        console.log('[GetWallet] Future timestamp detected, normalizing to now:', {
          lastRegenMs: new Date(lastRegenMs).toISOString(),
          nowMs: new Date(nowMs).toISOString()
        });
        lastRegenMs = nowMs;
        await supabase
          .from('profiles')
          .update({ last_life_regeneration: new Date(lastRegenMs).toISOString() })
          .eq('id', user.id);
      }

      // Ensure timeSinceLastRegen is never negative
      const timeSinceLastRegen = Math.max(0, nowMs - lastRegenMs);

      // Calculate how many lives should have been regenerated
      const livesShouldBeAdded = Math.floor(timeSinceLastRegen / regenIntervalMs);

      if (livesShouldBeAdded > 0) {
        const newLastRegen = lastRegenMs + (livesShouldBeAdded * regenIntervalMs);
        const newLives = Math.min(currentLives + livesShouldBeAdded, effectiveMaxLives);

        // Update profile with new values
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            lives: newLives,
            last_life_regeneration: new Date(newLastRegen).toISOString()
          })
          .eq('id', user.id);

        if (updateErr) {
          console.error('[GetWallet] Error updating regenerated lives:', updateErr);
        } else {
          currentLives = newLives;
        }

        if (newLives < effectiveMaxLives) {
          nextLifeAt = new Date(newLastRegen + regenIntervalMs).toISOString();
        }
      } else {
        // No lives added yet, calculate when next life will come
        nextLifeAt = new Date(lastRegenMs + regenIntervalMs).toISOString();
      }
    }

    // Subscription system removed
    const subscriberRenewAt = null;

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
        isSubscriber: false,
        livesCurrent: currentLives,
        livesMax: effectiveMaxLives,
        coinsCurrent: Number(profile.coins ?? 0),
        nextLifeAt,
        regenIntervalSec: effectiveRegenMinutes * 60,
        regenMinutes: effectiveRegenMinutes,
        subscriberRenewAt: null,
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
