import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

console.log('[login-with-email-pin] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return new Response(
        JSON.stringify({ error: 'E-mail és PIN kötelező' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PIN validálás: pontosan 6 számjegy
    if (!/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'Hibás e-mail vagy PIN kód' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[login-with-email-pin] Attempting login for:', email);

    // User keresése email alapján
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, pin_hash, device_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profileError || !profile) {
      console.error('[login-with-email-pin] Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Hibás e-mail vagy PIN kód' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.pin_hash) {
      console.error('[login-with-email-pin] No PIN hash found for user');
      return new Response(
        JSON.stringify({ error: 'Hibás e-mail vagy PIN kód' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PIN ellenőrzése bcrypt-tel
    const pinValid = await bcrypt.compare(pin, profile.pin_hash);

    if (!pinValid) {
      console.error('[login-with-email-pin] Invalid PIN');
      return new Response(
        JSON.stringify({ error: 'Hibás e-mail vagy PIN kód' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sikeres PIN validálás - visszaadjuk a device_id-t a frontendnek
    console.log('[login-with-email-pin] Login successful for user:', profile.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: profile.id,
        device_id: profile.device_id,
        message: 'Sikeres bejelentkezés!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[login-with-email-pin] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
