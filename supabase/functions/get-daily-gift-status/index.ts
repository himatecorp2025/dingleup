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

    // Fetch user's timezone and last_seen date
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_timezone, daily_gift_last_seen, daily_gift_streak, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }

    // Admin users (DingleUP or DingelUP!) never see Daily Gift
    if (profile?.username === 'DingleUP' || profile?.username === 'DingelUP!') {
      return new Response(
        JSON.stringify({
          canShow: false,
          localDate: null,
          timeZone: profile.user_timezone || 'UTC',
          streak: 0,
          nextReward: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userTimezone = profile.user_timezone || 'UTC';
    
    // Calculate today's date in user's timezone
    const nowUtc = new Date();
    const localDateString = nowUtc.toLocaleDateString('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Check if user has seen the popup today (either claimed or dismissed)
    const lastSeenDate = profile.daily_gift_last_seen;
    const canShow = !lastSeenDate || lastSeenDate !== localDateString;

    // Calculate reward based on streak
    const currentStreak = profile.daily_gift_streak ?? 0;
    const cyclePosition = currentStreak % 7;
    const rewardCoins = [50, 75, 110, 160, 220, 300, 500][cyclePosition];

    console.log('Daily Gift Status:', {
      userId: user.id,
      localDate: localDateString,
      lastSeenDate,
      canShow,
      streak: currentStreak,
      nextReward: rewardCoins,
    });

    return new Response(
      JSON.stringify({
        canShow,
        localDate: localDateString,
        timeZone: userTimezone,
        streak: currentStreak,
        nextReward: rewardCoins,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-daily-gift-status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
