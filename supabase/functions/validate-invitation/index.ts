import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for profile access
    );

    const { invitationCode, invitedEmail } = await req.json();

    // Validate invitation code format
    if (!invitationCode || typeof invitationCode !== 'string' || invitationCode.length < 8) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid invitation code format' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(invitedEmail)) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid email address' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check if invitation code exists using public_profiles view
    // (only username needed, NOT email or financial data!)
    const { data: inviterProfile, error: profileError } = await supabaseClient
      .from('public_profiles')
      .select('id, username')
      .eq('invitation_code', invitationCode)
      .single();

    if (profileError || !inviterProfile) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid invitation code' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this email was already invited with this code
    const { data: existingInvitation } = await supabaseClient
      .from('invitations')
      .select('id, accepted')
      .eq('inviter_id', inviterProfile.id)
      .eq('invited_email', invitedEmail.toLowerCase())
      .single();

    if (existingInvitation) {
      if (existingInvitation.accepted) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'You have already registered with this email using this invitation' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // If invitation exists but not accepted yet, allow registration
    }

    // Rate limiting: Check how many invitations were accepted in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseClient
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_id', inviterProfile.id)
      .eq('accepted', true)
      .gte('accepted_at', oneHourAgo);

    if (count && count > 10) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Too many invitations accepted recently. Try again later.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Only return minimal info pre-registration
    // Full inviter details shown after successful registration
    return new Response(
      JSON.stringify({ 
        valid: true,
        // Removed inviterId and inviterUsername to prevent enumeration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INTERNAL] Error in validate-invitation:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'An error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});