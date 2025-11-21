import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { hash } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, pin } = await req.json();

    // Validation
    if (!username || !pin) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó felhasználónév vagy PIN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Érvénytelen felhasználónév. Használj 3-30 karaktert (betűk, számok, aláhúzás)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PIN (exactly 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'A PIN pontosan 6 számjegyből kell álljon' }),
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

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (checkError) {
      console.error('Database check error:', checkError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a regisztráció során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A felhasználónév már foglalt' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user with auto-generated email
    const autoEmail = `${username.toLowerCase()}@dingleup.auto`;
    const password = pin + username;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: autoEmail,
      password,
      options: {
        data: { username },
      }
    });

    if (signUpError || !signUpData.user) {
      console.error('SignUp error:', signUpError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a fiók létrehozása során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash PIN and save to profiles table
    const pinHash = await hash(pin);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        username,
        pin_hash: pinHash,
        email: null,
      })
      .eq('id', signUpData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a profil létrehozása során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: signUpData.user.id,
          username,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
