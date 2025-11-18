import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Hiányzó felhasználónév vagy jelszó' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find user by username (case-insensitive, trimmed)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .ilike('username', normalizedUsername)
      .maybeSingle();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Hiba történt a bejelentkezés során' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Helytelen felhasználónév vagy jelszó' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user email from auth.users
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: 'Hiba történt a bejelentkezés során' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return email so client can sign in
    return new Response(
      JSON.stringify({ 
        email: user.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
