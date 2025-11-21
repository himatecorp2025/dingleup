import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

console.log('[auto-register-device] Function loaded');

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    const { device_id } = body;

    // SECURITY: Comprehensive input validation
    if (!device_id || typeof device_id !== 'string') {
      console.error('[auto-register-device] Missing or invalid device_id');
      return new Response(
        JSON.stringify({ error: 'device_id must be a valid string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate device_id format (alphanumeric, hyphens, underscores only)
    const deviceIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!deviceIdPattern.test(device_id)) {
      console.error('[auto-register-device] Invalid device_id format');
      return new Response(
        JSON.stringify({ error: 'device_id contains invalid characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate length (16-128 characters)
    if (device_id.length < 16 || device_id.length > 128) {
      console.error('[auto-register-device] Invalid device_id length');
      return new Response(
        JSON.stringify({ error: 'device_id must be between 16-128 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[auto-register-device] Processing device_id:', device_id.substring(0, 8) + '...');

    // Check if device_id already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, username')
      .eq('device_id', device_id)
      .maybeSingle();

    if (checkError) {
      console.error('[auto-register-device] Error checking existing profile:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If profile exists with this device_id, return existing user
    if (existingProfile) {
      console.log('[auto-register-device] Existing profile found:', existingProfile.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          user_id: existingProfile.id,
          email: existingProfile.email,
          existing: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user with device_id
    const tempEmail = `device_${device_id.substring(0, 16)}@dingleup.auto`;
    const tempPassword = device_id; // Use device_id as password so frontend can sign in
    const username = `user_${device_id.substring(0, 8)}`;

    console.log('[auto-register-device] Creating new user:', username);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        username: username,
        birthDate: '1991-05-05', // Default placeholder
        device_id: device_id,
      },
    });

    if (authError) {
      console.error('[auto-register-device] Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: authError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with device_id (handle_new_user trigger creates profile)
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for trigger

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ device_id: device_id })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('[auto-register-device] Profile update error:', updateError);
      // Not critical, continue
    }

    console.log('[auto-register-device] New user created successfully:', authData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        email: tempEmail,
        existing: false 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[auto-register-device] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
