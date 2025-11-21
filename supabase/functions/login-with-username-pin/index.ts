import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Hiányzó SUPABASE_URL vagy SUPABASE_ANON_KEY env var');
      return new Response(
        JSON.stringify({ error: 'Szerver konfigurációs hiba' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check rate limiting
    const { data: rateLimitData } = await supabase
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
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
      await recordFailedAttempt(supabase, normalizedUsername);
      
      return new Response(
        JSON.stringify({ error: 'Helytelen felhasználónév vagy PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to sign in with Supabase Auth
    const autoEmail = `${normalizedUsername.toLowerCase()}@dingleup.auto`;
    const password = pin + profile.username;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: autoEmail,
      password,
    });

    if (signInError || !signInData.user) {
      // Record failed attempt
      await recordFailedAttempt(supabase, normalizedUsername);
      
      return new Response(
        JSON.stringify({ error: 'Helytelen felhasználónév vagy PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear failed attempts on successful login
    await supabase
      .from('login_attempts_pin')
      .delete()
      .eq('username', normalizedUsername.toLowerCase());

    // Return user data with session
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: signInData.user.id,
          username: profile.username,
          email: signInData.user.email,
        },
        session: signInData.session,
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

async function recordFailedAttempt(supabase: any, username: string) {
  const normalizedUsername = username.toLowerCase();
  const now = new Date();
  
  const { data: existing } = await supabase
    .from('login_attempts_pin')
    .select('*')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (existing) {
    const newAttempts = existing.failed_attempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;
    
    await supabase
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
    await supabase
      .from('login_attempts_pin')
      .insert({
        username: normalizedUsername,
        failed_attempts: 1,
        last_attempt_at: now.toISOString(),
      });
  }
}
