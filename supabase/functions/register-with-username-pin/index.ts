import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple SHA-256 hash using Web Crypto API
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

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
    if (username.length < 3 || username.length > 30) {
      return new Response(
        JSON.stringify({ error: 'A felhasználónév 3-30 karakter hosszú legyen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (/\s/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'A felhasználónév nem tartalmazhat szóközt' }),
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if username already exists (optimized query)
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A felhasználónév már foglalt' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash PIN with SHA-256
    const pinHash = await hashPin(pin);

    // Create auth user with admin API - IMMEDIATELY CONFIRMED
    const autoEmail = `${username.toLowerCase()}@dingleup.auto`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: autoEmail,
      password: pin + username,
      email_confirm: true,
      user_metadata: { username }
    });

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a fiók létrehozása során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save username and pin_hash to profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: authData.user.id,
        username,
        pin_hash: pinHash,
        email: null,
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile update error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a profil létrehozása során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authData.user.id,
          username,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
