import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

console.log('[setup-email-pin] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó authentikáció' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, pin } = await req.json();

    // Validálás
    if (!email || !pin) {
      return new Response(
        JSON.stringify({ error: 'E-mail és PIN kötelező' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PIN validálás: pontosan 6 számjegy
    if (!/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'A PIN kód pontosan 6 számjegyből kell álljon' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email validálás
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Érvényes e-mail címet adj meg' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Aktuális user lekérése
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Rate limiting check (5 attempts per 15 minutes)
    const rateLimitResult = await checkRateLimit(supabase, 'setup-email-pin', RATE_LIMITS.AUTH);
    if (!rateLimitResult.allowed) {
      console.log('[setup-email-pin] Rate limit exceeded for user:', user.id);
      return rateLimitExceeded(corsHeaders);
    }

    // Ellenőrizd, hogy az email még nem foglalt
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .neq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('[setup-email-pin] Error checking email:', checkError);
      return new Response(
        JSON.stringify({ error: 'Adatbázis hiba' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Ez az e-mail cím már használatban van' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PIN hashelése bcrypt-tel
    const pinHash = await bcrypt.hash(pin);

    // Profil frissítése
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email: email.toLowerCase(),
        pin_hash: pinHash,
        email_verified: true, // TESZT stádiumban azonnal true
        email_pin_setup_completed: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[setup-email-pin] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Profil frissítési hiba' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[setup-email-pin] Email+PIN setup successful for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Fiók sikeresen beállítva!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[setup-email-pin] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
