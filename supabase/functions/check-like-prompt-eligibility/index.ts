import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ eligible: false, error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ eligible: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { questionIndex } = await req.json();

    // Check if question index is eligible (1-15 = any question in the game)
    if (questionIndex < 1 || questionIndex > 15) {
      return new Response(
        JSON.stringify({ eligible: false, reason: 'question_index_not_eligible' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily limit (max 10 prompts per day)
    const today = new Date().toISOString().split('T')[0];
    const { data: tracking, error: trackingError } = await supabase
      .from('user_like_prompt_tracking')
      .select('prompt_count')
      .eq('user_id', user.id)
      .eq('day_date', today)
      .single();

    if (trackingError && trackingError.code !== 'PGRST116') {
      console.error('Error fetching tracking:', trackingError);
      return new Response(
        JSON.stringify({ eligible: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentCount = tracking?.prompt_count ?? 0;
    if (currentCount >= 10) {
      return new Response(
        JSON.stringify({ eligible: false, reason: 'daily_limit_reached' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 40% random chance
    const randomChance = Math.random();
    if (randomChance > 0.4) {
      return new Response(
        JSON.stringify({ eligible: false, reason: 'random_chance_failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All checks passed - eligible
    return new Response(
      JSON.stringify({ eligible: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-like-prompt-eligibility:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ eligible: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
