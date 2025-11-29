import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { generateLootboxRewards } from '../_shared/lootboxRewards.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight();
  }

  const corsHeaders = getCorsHeaders();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user context for auth and reads
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Pure service role client for inserts (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { activity_type, metadata } = await req.json();

    if (!activity_type) {
      return new Response(
        JSON.stringify({ error: 'activity_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Check daily limit (20 drops/day)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayDrops, error: countError } = await supabaseAdmin
      .from('lootbox_instances')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (countError) {
      console.error('[register-activity-and-drop] Count error:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to check daily limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const todayDropCount = todayDrops?.length || 0;

    if (todayDropCount >= 20) {
      return new Response(
        JSON.stringify({ 
          drop_granted: false, 
          reason: 'DAILY_LIMIT_REACHED',
          today_count: todayDropCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check cooldown (5 minutes since last drop)
    const { data: lastDrop } = await supabaseAdmin
      .from('lootbox_instances')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastDrop) {
      const lastDropTime = new Date(lastDrop.created_at);
      const minutesSinceLast = (now.getTime() - lastDropTime.getTime()) / (1000 * 60);
      
      if (minutesSinceLast < 5) {
        return new Response(
          JSON.stringify({ 
            drop_granted: false, 
            reason: 'COOLDOWN_ACTIVE',
            minutes_remaining: Math.ceil(5 - minutesSinceLast)
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 3: Handle guaranteed drops for first 3 logins of the day
    if (activity_type === 'daily_first_login') {
      // Count how many session_start events happened today (including current one)
      const { data: sessionEvents, error: sessionError } = await supabaseAdmin
        .from('app_session_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'session_start')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (sessionError) {
        console.error('[register-activity-and-drop] Session count error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to check session count' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const todaySessionCount = sessionEvents?.length || 0;

      // Only grant guaranteed drop for first 3 logins of the day
      if (todaySessionCount > 3) {
        return new Response(
          JSON.stringify({ 
            drop_granted: false, 
            reason: 'EXCEEDED_3_DAILY_LOGINS',
            today_session_count: todaySessionCount
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if this login number already got its guaranteed drop
      const { data: existingLoginDrop } = await supabaseAdmin
        .from('lootbox_instances')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', 'daily_first_login')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .eq('metadata->>login_number', todaySessionCount.toString())
        .maybeSingle();

      if (existingLoginDrop) {
        return new Response(
          JSON.stringify({ 
            drop_granted: false, 
            reason: 'LOGIN_DROP_ALREADY_GRANTED',
            login_number: todaySessionCount
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Grant guaranteed drop for this login (1st, 2nd, or 3rd)
      // Note: expires_at set to NULL - frontend handles countdown after animation
      const dailySequence = todayDropCount + 1;

      const { data: newDrop, error: insertError } = await supabaseAdmin
        .rpc('create_lootbox_drop', {
          p_user_id: user.id,
          p_source: 'daily_first_login',
          p_open_cost_gold: 150,
          p_expires_at: null,
          p_metadata: {
            activity_type,
            daily_sequence: dailySequence,
            login_number: todaySessionCount,
            ...metadata
          }
        });

      if (insertError) {
        console.error('[register-activity-and-drop] Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create drop' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          drop_granted: true, 
          lootbox: newDrop,
          reason: 'GUARANTEED_LOGIN_DROP',
          login_number: todaySessionCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Random drop for other activities (30% chance)
    const randomValue = Math.floor(Math.random() * 100);
    
    if (randomValue >= 30) {
      return new Response(
        JSON.stringify({ 
          drop_granted: false, 
          reason: 'RANDOM_NOT_TRIGGERED'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant random activity drop
    // Note: expires_at set to NULL - frontend handles countdown after animation
    const dailySequence = todayDropCount + 1;

    const { data: newDrop, error: insertError } = await supabaseAdmin
      .rpc('create_lootbox_drop', {
        p_user_id: user.id,
        p_source: 'activity_random',
        p_open_cost_gold: 150,
        p_expires_at: null,
        p_metadata: {
          activity_type,
          daily_sequence: dailySequence,
          random_value: randomValue,
          ...metadata
        }
      });

    if (insertError) {
      console.error('[register-activity-and-drop] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create drop' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        drop_granted: true, 
        lootbox: newDrop,
        reason: 'ACTIVITY_RANDOM'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[register-activity-and-drop] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
