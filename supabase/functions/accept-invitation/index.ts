import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for authentication
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Create service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { inviterId, invitationCode } = await req.json();
    
    // Validate inputs
    if (!inviterId || !UUID_REGEX.test(inviterId)) {
      throw new Error('Invalid inviter ID format');
    }
    
    if (!invitationCode || typeof invitationCode !== 'string' || invitationCode.length < 8) {
      throw new Error('Invalid invitation code format');
    }
    
    if (!user.email || !EMAIL_REGEX.test(user.email)) {
      throw new Error('Invalid email address');
    }

    // Use authenticated user's ID and email
    const invitedUserId = user.id;
    const invitedEmail = user.email;

    console.log('Processing invitation acceptance for user:', invitedUserId);

    // Verify inviter exists and has this invitation code
    const { data: inviterProfile, error: inviterError } = await supabaseClient
      .from('profiles')
      .select('id, coins, invitation_code')
      .eq('id', inviterId)
      .single();

    if (inviterError || !inviterProfile) {
      throw new Error('Inviter not found');
    }

    if (inviterProfile.invitation_code !== invitationCode) {
      throw new Error('Invitation code mismatch');
    }

    // Check if invitation record exists
    const { data: existingInvitation } = await supabaseClient
      .from('invitations')
      .select('id, accepted')
      .eq('inviter_id', inviterId)
      .eq('invited_email', invitedEmail.toLowerCase())
      .maybeSingle();

    if (existingInvitation?.accepted) {
      console.log('Invitation already accepted');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ez a meghívó már fel lett használva' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingInvitation) {
      // Update existing invitation
      const { error: updateError } = await supabaseClient
        .from('invitations')
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
          invited_user_id: invitedUserId,
        })
        .eq('id', existingInvitation.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        throw updateError;
      }
    } else {
      // Create new invitation record
      const { error: insertError } = await supabaseClient
        .from('invitations')
        .insert({
          inviter_id: inviterId,
          invited_email: invitedEmail.toLowerCase(),
          invited_user_id: invitedUserId,
          invitation_code: invitationCode,
          accepted: true,
          accepted_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting invitation:', insertError);
        throw insertError;
      }
    }

    // Award 100 coins to inviter using RPC
    const inviterClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    );

    // Directly update coins (bypassing RLS with service role)
    const { error: coinsError } = await supabaseClient
      .from('profiles')
      .update({
        coins: inviterProfile.coins + 100,
      })
      .eq('id', inviterId);

    if (coinsError) {
      console.error('Error awarding coins to inviter:', coinsError);
      // Don't fail the whole operation if coin award fails
    } else {
      console.log('Awarded 100 coins to inviter:', inviterId);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Meghívó sikeresen elfogadva!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Hiba történt a meghívó feldolgozása során';
    console.error('Error in accept-invitation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});