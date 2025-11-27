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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const { data: todayDrops, error: countError } = await supabase
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

    // Step 2: Check cooldown (20 minutes since last drop)
    const { data: lastDrop } = await supabase
      .from('lootbox_instances')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastDrop) {
      const lastDropTime = new Date(lastDrop.created_at);
      const minutesSinceLast = (now.getTime() - lastDropTime.getTime()) / (1000 * 60);
      
      if (minutesSinceLast < 20) {
        return new Response(
          JSON.stringify({ 
            drop_granted: false, 
            reason: 'COOLDOWN_ACTIVE',
            minutes_remaining: Math.ceil(20 - minutesSinceLast)
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 3: Handle guaranteed first daily drop
    if (activity_type === 'daily_first_login') {
      // Check if user already got daily_first_login drop today
      const { data: existingFirstDrop } = await supabase
        .from('lootbox_instances')
        .select('id')
        .eq('user_id', user.id)
        .eq('source', 'daily_first_login')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .maybeSingle();

      if (existingFirstDrop) {
        return new Response(
          JSON.stringify({ 
            drop_granted: false, 
            reason: 'DAILY_FIRST_LOGIN_ALREADY_GRANTED'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Grant guaranteed first drop
      const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds
      const dailySequence = todayDropCount + 1;

      const { data: newDrop, error: insertError } = await supabase
        .from('lootbox_instances')
        .insert({
          user_id: user.id,
          status: 'active_drop',
          source: 'daily_first_login',
          open_cost_gold: 150,
          expires_at: expiresAt.toISOString(),
          metadata: { 
            activity_type,
            daily_sequence: dailySequence,
            ...metadata 
          }
        })
        .select()
        .single();

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
          reason: 'DAILY_FIRST_LOGIN'
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
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds
    const dailySequence = todayDropCount + 1;

    const { data: newDrop, error: insertError } = await supabase
      .from('lootbox_instances')
      .insert({
        user_id: user.id,
        status: 'active_drop',
        source: 'activity_random',
        open_cost_gold: 150,
        expires_at: expiresAt.toISOString(),
        metadata: { 
          activity_type,
          daily_sequence: dailySequence,
          random_value: randomValue,
          ...metadata 
        }
      })
      .select()
      .single();

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
