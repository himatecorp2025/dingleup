import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash recovery code using SHA-256
async function hashRecoveryCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Hash PIN using SHA-256
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate new secure random recovery code (format: XXXX-XXXX-XXXX)
function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      segment += chars[randomIndex];
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, recovery_code, new_pin, new_pin_confirm } = await req.json();

    // Validation: all fields required
    if (!username || !recovery_code || !new_pin || !new_pin_confirm) {
      return new Response(
        JSON.stringify({ error: 'Minden mező kitöltése kötelező' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate new PIN format (exactly 6 digits)
    if (!/^\d{6}$/.test(new_pin)) {
      return new Response(
        JSON.stringify({ error: 'Az új PIN kódnak pontosan 6 számjegyből kell állnia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PIN confirmation match
    if (new_pin !== new_pin_confirm) {
      return new Response(
        JSON.stringify({ error: 'Az új PIN kódok nem egyeznek' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Look up user by username (case-insensitive)
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, recovery_code_hash, pin_reset_attempts, pin_reset_last_attempt_at')
      .ilike('username', username)
      .maybeSingle();

    // Generic error message for privacy (don't reveal if username exists)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen felhasználónév vagy helyreállítási kód' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check: max 5 failed attempts per hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const lastAttempt = user.pin_reset_last_attempt_at ? new Date(user.pin_reset_last_attempt_at) : null;
    const attempts = user.pin_reset_attempts || 0;

    // Reset counter if last attempt was more than 1 hour ago
    if (lastAttempt && lastAttempt < oneHourAgo) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          pin_reset_attempts: 0,
          pin_reset_last_attempt_at: null,
        })
        .eq('id', user.id);
    } else if (attempts >= 5) {
      // Rate limit exceeded
      return new Response(
        JSON.stringify({ 
          error: 'Túl sok sikertelen próbálkozás. Kérlek próbáld újra 1 óra múlva.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the provided recovery code and verify
    const recoveryCodeHash = await hashRecoveryCode(recovery_code.trim().toUpperCase());
    
    if (recoveryCodeHash !== user.recovery_code_hash) {
      // Incorrect recovery code - increment failed attempts
      await supabaseAdmin
        .from('profiles')
        .update({ 
          pin_reset_attempts: attempts + 1,
          pin_reset_last_attempt_at: now.toISOString(),
        })
        .eq('id', user.id);

      // Security: don't log recovery code attempts to prevent log-based attacks
      console.log(`[PIN Reset] Failed attempt for user ${user.id} (attempt ${attempts + 1}/5)`);

      return new Response(
        JSON.stringify({ error: 'A megadott helyreállítási kód érvénytelen' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recovery code is valid - reset PIN
    const newPinHash = await hashPin(new_pin);
    
    // Generate new recovery code (recommended for security)
    const newRecoveryCode = generateRecoveryCode();
    const newRecoveryCodeHash = await hashRecoveryCode(newRecoveryCode);

    // Update user profile: new PIN hash, new recovery code, reset attempt counters
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        pin_hash: newPinHash,
        recovery_code_hash: newRecoveryCodeHash,
        recovery_code_set_at: now.toISOString(),
        pin_reset_attempts: 0,
        pin_reset_last_attempt_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[PIN Reset] Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'PIN frissítési hiba történt. Kérlek próbáld újra később.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also update auth.users password (username+PIN pattern for consistency)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_pin + user.username }
    );

    if (authUpdateError) {
      console.error('[PIN Reset] Auth password update error:', authUpdateError);
      // Continue even if auth update fails - profile is primary source of truth
    }

    // Success log (no sensitive data)
    console.log(`[PIN Reset] Successful PIN reset for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'A PIN kódod sikeresen frissült.',
        new_recovery_code: newRecoveryCode,
        // IMPORTANT: Frontend must display this new recovery code to the user
        // Message: "Az új helyreállítási kódod: [code]. Írd fel / mentsd el biztonságosan!"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PIN Reset] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});