import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

interface RequestBody {
  reset_token: string;
  new_password: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { reset_token, new_password } = body;

    // Validate inputs
    if (!reset_token || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing reset_token or new_password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reset token
    const ADMIN_RESET_TOKEN = Deno.env.get('ADMIN_RESET_TOKEN');
    if (!ADMIN_RESET_TOKEN || reset_token !== ADMIN_RESET_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid reset token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Password validation (minimum 8 characters)
    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get admin user ID from profiles
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'himatecorp2025@gmail.com')
      .single();

    if (!adminProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update password using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminProfile.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('[admin-reset-password] Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[admin-reset-password] Password successfully updated for admin user');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin password successfully reset' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-reset-password] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
