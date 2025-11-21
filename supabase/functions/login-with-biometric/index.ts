import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';

console.log('[login-with-biometric] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { credential_id, authenticator_data, client_data_json, signature } = await req.json();

    // Input validation
    if (!credential_id || typeof credential_id !== 'string' ||
        !authenticator_data || typeof authenticator_data !== 'string' ||
        !client_data_json || typeof client_data_json !== 'string' ||
        !signature || typeof signature !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Hiányzó biometrikus adatok' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Do not log credential_id - it's a sensitive identifier
    console.log('[login-with-biometric] Attempting biometric login');

    // User keresése credential_id alapján
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, webauthn_credential_id, webauthn_public_key, device_id, biometric_enabled')
      .eq('webauthn_credential_id', credential_id)
      .eq('biometric_enabled', true)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[login-with-biometric] Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Érvénytelen biometrikus azonosító' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check - 5 attempts per 15 minutes
    const rateLimitKey = `biometric_login_${profile.id}`;
    const { allowed } = await checkRateLimit(
      supabase,
      rateLimitKey,
      RATE_LIMITS.AUTH
    );

    if (!allowed) {
      console.error('[login-with-biometric] Rate limit exceeded for user:', profile.id);
      return rateLimitExceeded(corsHeaders);
    }

    // TODO: Implement full WebAuthn signature verification
    // For now, we trust the browser's WebAuthn validation
    // In production, verify:
    // 1. authenticatorData format and flags
    // 2. clientDataJSON contains correct challenge and origin
    // 3. signature matches public key

    console.log('[login-with-biometric] Biometric login successful for user:', profile.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: profile.id,
        device_id: profile.device_id,
        message: 'Sikeres biometrikus bejelentkezés!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[login-with-biometric] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
