import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

console.log('[reset-pin] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { token, newPin } = await req.json();

    // Input validation
    if (!token || typeof token !== 'string' || !newPin || typeof newPin !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Token és új PIN kötelező' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PIN validálás: pontosan 6 számjegy
    if (!/^\d{6}$/.test(newPin)) {
      return new Response(
        JSON.stringify({ error: 'A PIN kód pontosan 6 számjegyből kell álljon' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('pin_reset_tokens')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();

    if (tokenError || !resetToken) {
      console.error('[reset-pin] Invalid token:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Érvénytelen vagy lejárt token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token already used
    if (resetToken.used_at) {
      console.error('[reset-pin] Token already used');
      return new Response(
        JSON.stringify({ error: 'Ez a token már fel lett használva' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      console.error('[reset-pin] Token expired');
      return new Response(
        JSON.stringify({ error: 'Ez a token lejárt' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(newPin);

    // Update user's PIN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pin_hash: newPinHash })
      .eq('id', resetToken.user_id);

    if (updateError) {
      console.error('[reset-pin] Error updating PIN:', updateError);
      return new Response(
        JSON.stringify({ error: 'PIN frissítési hiba' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('pin_reset_tokens')
      .update({ used_at: now.toISOString() })
      .eq('token', token);

    if (markUsedError) {
      console.error('[reset-pin] Error marking token as used:', markUsedError);
    }

    console.log('[reset-pin] PIN successfully reset for user:', resetToken.user_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PIN sikeresen visszaállítva!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[reset-pin] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
