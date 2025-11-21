import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitExceeded, RATE_LIMITS } from '../_shared/rateLimit.ts';

console.log('[request-pin-reset] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { email } = await req.json();

    // Input validation
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'E-mail cím kötelező' }),
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // User keresése email alapján
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    // Mindig sikeres választ adunk, függetlenül attól, hogy létezik-e a user
    // Ez biztonsági best practice: ne fedezzük fel, hogy mely emailek vannak regisztrálva
    if (profileError || !profile) {
      console.log('[request-pin-reset] Email not found, but returning success for security');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Ha az e-mail cím regisztrálva van, egy PIN visszaállítási linket küldtünk rá.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check - 3 attempts per 15 minutes per user
    const rateLimitKey = `pin_reset_${profile.id}`;
    const { allowed } = await checkRateLimit(
      supabase,
      rateLimitKey,
      { maxRequests: 3, windowMinutes: 15 }
    );

    if (!allowed) {
      console.error('[request-pin-reset] Rate limit exceeded for user:', profile.id);
      return rateLimitExceeded(corsHeaders);
    }

    // Generate one-time reset token (valid for 1 hour)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    const { error: insertError } = await supabase
      .from('pin_reset_tokens')
      .insert({
        user_id: profile.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[request-pin-reset] Error storing reset token:', insertError);
      return new Response(
        JSON.stringify({ error: 'Token generálási hiba' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Send reset email via Resend integration
    // SECURITY: Never log reset tokens - they are sensitive credentials
    console.log('[request-pin-reset] Reset token generated for user:', profile.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PIN visszaállítási link elküldve az e-mail címre.',
        // TEMPORARY: Return token for testing (remove in production)
        debug_token: resetToken
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[request-pin-reset] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
