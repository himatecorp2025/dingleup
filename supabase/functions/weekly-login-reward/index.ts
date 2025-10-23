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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('User not authenticated');

    console.log(`[WEEKLY-LOGIN] Processing for user: ${user.id}`);

    // Get current week start (Europe/Budapest timezone)
    const { data: weekData, error: weekError } = await supabaseClient
      .rpc('get_current_week_start');
    
    if (weekError) throw weekError;
    const weekStart = weekData as string;

    console.log(`[WEEKLY-LOGIN] Week start: ${weekStart}`);

    // Get or create weekly login state
    const { data: loginState, error: stateError } = await supabaseClient
      .from('weekly_login_state')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single();

    let currentIndex = 0;
    if (loginState) {
      currentIndex = loginState.awarded_login_index || 0;
      
      // Check throttle: max 1 reward per day
      if (loginState.last_counted_at) {
        const lastCounted = new Date(loginState.last_counted_at);
        const now = new Date();
        const hoursSince = (now.getTime() - lastCounted.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          console.log(`[WEEKLY-LOGIN] Throttled - last counted ${hoursSince.toFixed(1)}h ago`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              throttled: true,
              message: 'Már igényelted a mai belépési jutalmat'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Increment index
    const newIndex = currentIndex + 1;

    // Get reward configuration
    const { data: rewardConfig, error: rewardError } = await supabaseClient
      .from('weekly_login_rewards')
      .select('*')
      .eq('reward_index', newIndex)
      .single();

    if (rewardError || !rewardConfig) {
      console.log(`[WEEKLY-LOGIN] No reward config for index ${newIndex}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nincs több heti jutalom' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const goldAmount = rewardConfig.gold_amount;
    const livesBonus = rewardConfig.lives_bonus || 0;

    console.log(`[WEEKLY-LOGIN] Awarding index ${newIndex}: ${goldAmount} gold, ${livesBonus} lives`);

    // Credit wallet (coins) idempotently
    const correlationId = `weekly-login:${user.id}:${weekStart}:${newIndex}`;
    const { data: creditResult, error: creditError } = await supabaseClient
      .rpc('credit_wallet', {
        p_user_id: user.id,
        p_delta_coins: goldAmount,
        p_delta_lives: 0,
        p_source: 'WEEKLY_LOGIN_REWARD',
        p_idempotency_key: correlationId,
        p_metadata: {
          week_start: weekStart,
          login_index: newIndex,
          gold_amount: goldAmount
        }
      });

    if (creditError) throw creditError;

    // Credit lives if bonus exists
    if (livesBonus > 0) {
      const livesCorrelationId = `weekly-login-lives:${user.id}:${weekStart}:${newIndex}`;
      const { error: livesError } = await supabaseClient
        .rpc('credit_lives', {
          p_user_id: user.id,
          p_delta_lives: livesBonus,
          p_source: 'WEEKLY_LOGIN_REWARD',
          p_idempotency_key: livesCorrelationId,
          p_metadata: {
            week_start: weekStart,
            login_index: newIndex,
            lives_bonus: livesBonus
          }
        });

      if (livesError) throw livesError;
    }

    // Update weekly login state
    const { error: updateError } = await supabaseClient
      .from('weekly_login_state')
      .upsert({
        user_id: user.id,
        week_start: weekStart,
        awarded_login_index: newIndex,
        last_counted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    console.log(`[WEEKLY-LOGIN] Success - awarded ${goldAmount} gold to user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        login_index: newIndex,
        gold_awarded: goldAmount,
        lives_awarded: livesBonus,
        week_start: weekStart
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WEEKLY-LOGIN] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});