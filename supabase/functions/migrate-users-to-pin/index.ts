import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

console.log('[migrate-users-to-pin] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[migrate-users-to-pin] Fetching users without PIN');

    // Lekérjük az összes felhasználót ahol nincs PIN hash
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, username')
      .is('pin_hash', null);

    if (fetchError) {
      console.error('[migrate-users-to-pin] Error fetching users:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Nem sikerült lekérni a felhasználókat', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!users || users.length === 0) {
      console.log('[migrate-users-to-pin] No users to migrate');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Nincs migrálásra váró felhasználó',
          updated: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[migrate-users-to-pin] Found ${users.length} users to migrate`);

    // Default PIN: 123456
    const defaultPin = '123456';
    const pinHash = await bcrypt.hash(defaultPin);

    // Frissítjük az összes felhasználót
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        pin_hash: pinHash,
        email_verified: true,
        email_pin_setup_completed: true
      })
      .is('pin_hash', null);

    if (updateError) {
      console.error('[migrate-users-to-pin] Error updating users:', updateError);
      return new Response(
        JSON.stringify({ error: 'Nem sikerült frissíteni a felhasználókat', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[migrate-users-to-pin] Successfully migrated ${users.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${users.length} felhasználó sikeresen migrálva`,
        updated: users.length,
        defaultPin: defaultPin
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[migrate-users-to-pin] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Szerver hiba', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
