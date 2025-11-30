import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's timezone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_timezone, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[get-daily-winners-status] Profile fetch error:', profileError);
      throw profileError;
    }

    // TESTING: Temporarily allow DingleUP to see Daily Winners popup for testing
    // Admin users normally never see Daily Winners popup
    // if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
    //   return new Response(
    //     JSON.stringify({
    //       canShow: false,
    //       localDate: null,
    //       timeZone: profile.user_timezone || 'UTC',
    //     }),
    //     { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }

    const userTimezone = profile.user_timezone || 'UTC';
    
    // Calculate today's date in user's timezone
    const nowUtc = new Date();
    const localDateString = nowUtc.toLocaleDateString('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Check if user has already seen the Daily Winners popup today
    const { data: popupView, error: viewError } = await supabase
      .from('daily_winners_popup_views')
      .select('last_shown_day')
      .eq('user_id', user.id)
      .single();

    if (viewError && viewError.code !== 'PGRST116') {
      console.error('[get-daily-winners-status] Error checking popup view:', viewError);
    }

    // Can show if not seen today (in user's local timezone)
    const canShow = !popupView || popupView.last_shown_day !== localDateString;

    console.log('[get-daily-winners-status] Status check:', {
      userId: user.id,
      localDate: localDateString,
      lastShownDay: popupView?.last_shown_day,
      canShow,
      timezone: userTimezone,
    });

    return new Response(
      JSON.stringify({
        canShow,
        localDate: localDateString,
        timeZone: userTimezone,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-daily-winners-status] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
