import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { userId, birthDate, email, username } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'x-real-ip' || 
                     'unknown';

    let countryCode = 'HU'; // Default fallback

    // Only attempt geolocation if we have a real IP
    if (clientIp !== 'unknown' && !clientIp.includes('127.0.0.1') && !clientIp.includes('localhost')) {
      try {
        // Use ip-api.com for free IP geolocation (45 requests/minute limit)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,countryCode`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success' && geoData.countryCode) {
            countryCode = geoData.countryCode;
          }
        }
      } catch (geoError) {
        // Continue with default country code
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const profilePayload: Record<string, unknown> = {
      id: userId,
      country_code: countryCode,
      birth_date: birthDate || '1991-05-05',
    };

    if (email) {
      profilePayload.email = email;
    }
    if (username) {
      profilePayload.username = username;
    }

    // Ensure defaults for new users so NOT NULL constraints are satisfied
    profilePayload.coins = 0;
    profilePayload.lives = 15;
    profilePayload.max_lives = 15;
    profilePayload.lives_regeneration_rate = 12;
    profilePayload.last_life_regeneration = new Date().toISOString();
    profilePayload.help_third_active = true;
    profilePayload.help_2x_answer_active = true;
    profilePayload.help_audience_active = true;
    profilePayload.daily_gift_streak = 0;
    profilePayload.welcome_bonus_claimed = false;
    profilePayload.question_swaps_available = 0;
    profilePayload.total_correct_answers = 0;

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(profilePayload, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update country code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        countryCode,
        message: 'Country code set successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
