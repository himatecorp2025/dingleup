import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LangCode = 'hu' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl';

// Country to language mapping
const COUNTRY_TO_LANG: Record<string, LangCode> = {
  // Hungarian
  HU: 'hu',

  // German
  DE: 'de',
  AT: 'de',
  CH: 'de',

  // French
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',

  // Spanish
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CL: 'es',
  CO: 'es',
  PE: 'es',

  // Italian
  IT: 'it',

  // Portuguese
  PT: 'pt',
  BR: 'pt',

  // Dutch
  NL: 'nl',

  // Default fallback for all other countries
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get IP address from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    console.log('[detect-language] Detecting language for IP:', ip);

    let countryCode: string | null = null;
    let language: LangCode = 'en'; // Safe fallback

    // Try to get geolocation from ipapi.co (free tier: 1000 requests/day)
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: { 'User-Agent': 'DingleUP-App/1.0' }
      });

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        countryCode = geoData.country_code?.toUpperCase() || null;
        console.log('[detect-language] Detected country:', countryCode);
      } else {
        console.warn('[detect-language] Geolocation API failed:', geoResponse.status);
      }
    } catch (geoError) {
      console.error('[detect-language] Geolocation error:', geoError);
    }

    // Map country to language
    if (countryCode && COUNTRY_TO_LANG[countryCode]) {
      language = COUNTRY_TO_LANG[countryCode];
    } else {
      language = 'en'; // Fallback for unsupported countries
    }

    console.log('[detect-language] Final language:', language);

    // If user is authenticated, update their preferred_language
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (user && !authError) {
          console.log('[detect-language] Updating user preferred_language:', user.id);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ preferred_language: language })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('[detect-language] Failed to update user language:', updateError);
          }
        }
      } catch (authError) {
        console.log('[detect-language] No authenticated user, skipping update');
      }
    }

    return new Response(
      JSON.stringify({ 
        country: countryCode,
        language 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[detect-language] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        country: null,
        language: 'en' // Safe fallback
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
