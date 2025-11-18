import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

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
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen meghívó' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!invitationCode || typeof invitationCode !== 'string' || invitationCode.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'Érvénytelen meghívókód' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use authenticated user's ID
    const invitedUserId = user.id;

    // Verify inviter exists and has this invitation code
    const { data: inviterProfile, error: inviterError } = await supabaseClient
      .from('profiles')
      .select('id, coins, invitation_code')
      .eq('id', inviterId)
      .single();

    if (inviterError || !inviterProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meghívó nem található' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (inviterProfile.invitation_code !== invitationCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meghívókód nem egyezik' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invitation record exists (by inviterId and invitedUserId OR invited_email)
    const { data: existingInvitation } = await supabaseClient
      .from('invitations')
      .select('id, accepted')
      .eq('inviter_id', inviterId)
      .or(`invited_user_id.eq.${invitedUserId}${user.email ? `,invited_email.eq.${user.email.toLowerCase()}` : ''}`)
      .maybeSingle();

    if (existingInvitation?.accepted) {
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
          invited_email: user.email?.toLowerCase() || null,
        })
        .eq('id', existingInvitation.id);

      if (updateError) {
        console.error('[INTERNAL] Error updating invitation:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Hiba történt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new invitation record (register with code but no pre-invite)
      const { error: insertError } = await supabaseClient
        .from('invitations')
        .insert({
          inviter_id: inviterId,
          invited_email: user.email?.toLowerCase() || null,
          invited_user_id: invitedUserId,
          invitation_code: invitationCode,
          accepted: true,
          accepted_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[INTERNAL] Error inserting invitation:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Hiba történt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Award 100 coins to inviter using idempotent wallet credit
    const idempotencyKey = `invitation:${inviterId}:${invitedUserId}`;
    const { error: creditError } = await supabaseClient.rpc('credit_wallet', {
      p_user_id: inviterId,
      p_delta_coins: 100,
      p_delta_lives: 0,
      p_source: 'invitation',
      p_idempotency_key: idempotencyKey,
      p_metadata: {
        invited_user_id: invitedUserId,
        invited_email: user.email || 'no-email'
      }
    });

    if (creditError) {
      console.error('[INTERNAL] Error awarding coins:', creditError);
      // Don't fail the whole operation if coin award fails
    }

    // Create friendship automatically
    console.log('[AcceptInvitation] Creating automatic friendship:', inviterId, '<->', invitedUserId);
    const { data: friendshipData, error: friendshipError } = await supabaseClient
      .rpc('create_friendship_from_invitation', {
        p_inviter_id: inviterId,
        p_invitee_id: invitedUserId
      });

    if (friendshipError) {
      console.error('[AcceptInvitation] Error creating friendship:', friendshipError);
      // Don't fail the whole operation if friendship creation fails
    } else {
      console.log('[AcceptInvitation] Friendship created successfully:', friendshipData);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Meghívó sikeresen elfogadva!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INTERNAL] Error in accept-invitation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Hiba történt'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});