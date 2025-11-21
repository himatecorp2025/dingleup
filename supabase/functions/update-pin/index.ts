import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentPin, newPin } = await req.json();
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nem vagy bejelentkezve' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Érvénytelen munkamenet' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation
    if (!currentPin || !newPin) {
      return new Response(
        JSON.stringify({ error: 'Minden mezőt ki kell tölteni' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate new PIN format (exactly 6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      return new Response(
        JSON.stringify({ error: 'A PIN kód pontosan 6 számjegyből kell álljon' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's current pin_hash
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('pin_hash, username')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profil nem található' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, profile.pin_hash);
    
    if (!isValidPin) {
      return new Response(
        JSON.stringify({ error: 'Hibás jelenlegi PIN kód' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(newPin);

    // Update pin_hash in profiles table
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ pin_hash: newPinHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('PIN update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Hiba történt a PIN módosítása során' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update auth password as well (PIN + username combination)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPin + profile.username }
    );

    if (authUpdateError) {
      console.error('Auth password update error:', authUpdateError);
      // Don't fail the whole operation, just log
    }

    console.log(`[update-pin] PIN successfully updated for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update PIN error:', error);
    return new Response(
      JSON.stringify({ error: 'Váratlan hiba történt' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
