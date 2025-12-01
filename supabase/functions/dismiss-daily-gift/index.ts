// dismiss-daily-gift: Updates daily_gift_last_seen to mark gift popup as seen
// This does NOT claim rewards, only dismisses the UI popup
//
// TODO FUTURE FEATURE (NOT IMPLEMENTED YET):
// - Daily Gift streak reset behavior: Currently streak increases indefinitely
//   without any reset mechanism. Documentation marks this as "NINCS IMPLEMENTÁLVA"
// - Future implementation should reset streak to 0 if user misses a day
// - Requires comparing daily_gift_last_seen with today's date and resetting if gap > 1 day
// - Risk: must handle timezone edge cases carefully to avoid accidental resets
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

    // OPTIMIZED: Fetch timezone AND last_seen to avoid unnecessary writes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_timezone, daily_gift_last_seen')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // OPTIMIZATION: Only update if last_seen is different (reduces redundant writes under high load)
    if (profile.daily_gift_last_seen !== localDateString) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ daily_gift_last_seen: localDateString })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Update failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[dismiss-daily-gift] Success:', {
      userId: user.id,
      localDate: localDateString,
      timezone: userTimezone,
    });

    return new Response(
      JSON.stringify({ success: true, localDate: localDateString }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[dismiss-daily-gift] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: message,
        error_code: 'DISMISS_GIFT_ERROR'
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
