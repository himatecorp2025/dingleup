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
        JSON.stringify({ success: false, error: 'Missing authorization' }),
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
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gameSessionId } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Fetch current tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from('user_like_prompt_tracking')
      .select('prompt_count, shown_sessions')
      .eq('user_id', user.id)
      .eq('day_date', today)
      .single();

    if (trackingError && trackingError.code !== 'PGRST116') {
      console.error('Error fetching tracking:', trackingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newCount = (tracking?.prompt_count ?? 0) + 1;
    const shownSessions = (tracking?.shown_sessions as string[]) || [];
    
    // Add gameSessionId to shown_sessions array if provided
    if (gameSessionId && !shownSessions.includes(gameSessionId)) {
      shownSessions.push(gameSessionId);
    }

    const { error: upsertError } = await supabase
      .from('user_like_prompt_tracking')
      .upsert({
        user_id: user.id,
        day_date: today,
        prompt_count: newCount,
        shown_sessions: shownSessions,
      }, {
        onConflict: 'user_id,day_date'
      });

    if (upsertError) {
      console.error('Error upserting tracking:', upsertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to record view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, newCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in record-like-prompt-view:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
