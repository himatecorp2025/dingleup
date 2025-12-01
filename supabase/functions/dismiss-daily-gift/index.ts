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

    // Fetch user's timezone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_timezone')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
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

    // Update last_seen date (no reward, just mark as seen)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ daily_gift_last_seen: localDateString })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Daily Gift dismissed:', {
      userId: user.id,
      localDate: localDateString,
      timezone: userTimezone,
    });

    return new Response(
      JSON.stringify({ success: true, localDate: localDateString }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in dismiss-daily-gift:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
