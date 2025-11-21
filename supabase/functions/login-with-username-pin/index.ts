import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { compare, hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó felhasználónév vagy PIN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedUsername = username.trim();

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen PIN formátum' }),
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

    // Check rate limiting
    const { data: rateLimitData } = await supabaseAdmin
      .from('login_attempts_pin')
      .select('*')
      .eq('username', normalizedUsername.toLowerCase())
      .maybeSingle();

    if (rateLimitData) {
      const now = new Date();
      const lockedUntil = rateLimitData.locked_until ? new Date(rateLimitData.locked_until) : null;
      
      if (lockedUntil && lockedUntil > now) {
        const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return new Response(
          JSON.stringify({ 
            error: `Túl sok sikertelen próbálkozás. Próbáld újra ${minutesRemaining} perc múlva.` 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Find user by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, pin_hash')
      .ilike('username', normalizedUsername)
      .maybeSingle();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a bejelentkezés során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      // Record failed attempt
      await recordFailedAttempt(supabaseAdmin, normalizedUsername);
      
      return new Response(
        JSON.stringify({ error: 'Helytelen felhasználónév vagy PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify PIN
    const isValidPin = await compare(pin, profile.pin_hash);

    if (!isValidPin) {
      // Record failed attempt
      await recordFailedAttempt(supabaseAdmin, normalizedUsername);
      
      return new Response(
        JSON.stringify({ error: 'Helytelen felhasználónév vagy PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear failed attempts on successful login
    await supabaseAdmin
      .from('login_attempts_pin')
      .delete()
      .eq('username', normalizedUsername.toLowerCase());

    // Get user's auth email for session creation
    const { data: { user: authUser }, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (authUserError || !authUser) {
      console.error('Auth user lookup error:', authUserError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a bejelentkezés során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return user data for frontend to create session
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: profile.id,
          username: profile.username,
          email: authUser.email,
        },
        // Frontend will use this to sign in with Supabase
        authPassword: pin + profile.username,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function recordFailedAttempt(supabaseAdmin: any, username: string) {
  const normalizedUsername = username.toLowerCase();
  const now = new Date();
  
  const { data: existing } = await supabaseAdmin
    .from('login_attempts_pin')
    .select('*')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (existing) {
    const newAttempts = existing.failed_attempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;
    
    await supabaseAdmin
      .from('login_attempts_pin')
      .update({
        failed_attempts: newAttempts,
        last_attempt_at: now.toISOString(),
        locked_until: shouldLock 
          ? new Date(now.getTime() + LOCKOUT_MINUTES * 60000).toISOString()
          : null,
      })
      .eq('username', normalizedUsername);
  } else {
    await supabaseAdmin
      .from('login_attempts_pin')
      .insert({
        username: normalizedUsername,
        failed_attempts: 1,
        last_attempt_at: now.toISOString(),
      });
  }
}
