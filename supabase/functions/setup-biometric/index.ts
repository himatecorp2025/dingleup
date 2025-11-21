import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

console.log('[setup-biometric] Function loaded');

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

    const { credential_id, public_key } = await req.json();

    if (!credential_id || !public_key) {
      return new Response(
        JSON.stringify({ error: 'Credential ID és public key kötelező' }),
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

    // Profil frissítése biometrikus adatokkal
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        webauthn_credential_id: credential_id,
        webauthn_public_key: public_key,
        biometric_enabled: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[setup-biometric] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Biometrikus adatok mentési hiba' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[setup-biometric] Biometric setup successful for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Biometrikus bejelentkezés aktiválva!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[setup-biometric] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
