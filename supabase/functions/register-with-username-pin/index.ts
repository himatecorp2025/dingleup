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
    const { username, pin, invitationCode } = await req.json();

    // Validation
    if (!username || !pin) {
      return new Response(
        JSON.stringify({ error: 'Missing username or PIN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      return new Response(
        JSON.stringify({ error: 'Username must be 3-30 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (/\s/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Username cannot contain spaces' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate allowed characters (alphanumeric, underscore, and Hungarian accented characters)
    if (!/^[a-zA-Z0-9_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Username contains invalid characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PIN (exactly 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ error: 'PIN must be exactly 6 digits' }),
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
        JSON.stringify({ error: 'Username is already taken' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate invitation code if provided
    let inviterId: string | null = null;
    if (invitationCode && invitationCode.trim() !== '') {
      const { data: inviterProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('invitation_code', invitationCode.trim().toUpperCase())
        .maybeSingle();
      
      if (!inviterProfile) {
        return new Response(
          JSON.stringify({ error: 'Invalid invitation code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      inviterId = inviterProfile.id;
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
        JSON.stringify({ error: 'Account creation failed' }),
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
        JSON.stringify({ error: 'Profile creation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process invitation if valid invitation code was provided
    if (inviterId) {
      // Create invitation record
      const { error: invitationError } = await supabaseAdmin
        .from('invitations')
        .insert({
          inviter_id: inviterId,
          invited_user_id: authData.user.id,
          invited_email: autoEmail,
          invitation_code: invitationCode.trim().toUpperCase(),
          accepted: true,
          accepted_at: new Date().toISOString(),
        });

      if (invitationError) {
        console.error('Invitation creation error:', invitationError);
        // Continue registration even if invitation fails
      } else {
        // Calculate and credit reward to inviter
        const { data: acceptedInvitations } = await supabaseAdmin
          .from('invitations')
          .select('id')
          .eq('inviter_id', inviterId)
          .eq('accepted', true);

        const acceptedCount = acceptedInvitations?.length || 0;
        
        // Calculate tier reward based on accepted count
        let rewardCoins = 0;
        let rewardLives = 0;
        if (acceptedCount === 1 || acceptedCount === 2) {
          rewardCoins = 200;
          rewardLives = 3;
        } else if (acceptedCount >= 3 && acceptedCount <= 9) {
          rewardCoins = 1000;
          rewardLives = 5;
        } else if (acceptedCount >= 10) {
          rewardCoins = 6000;
          rewardLives = 20;
        }

        // Credit reward using credit_wallet RPC
        if (rewardCoins > 0 || rewardLives > 0) {
          const idempotencyKey = `invitation_reward:${inviterId}:${authData.user.id}:${Date.now()}`;
          const { error: creditError } = await supabaseAdmin.rpc('credit_wallet', {
            p_user_id: inviterId,
            p_delta_coins: rewardCoins,
            p_delta_lives: rewardLives,
            p_source: 'invitation_reward',
            p_idempotency_key: idempotencyKey,
            p_metadata: {
              invited_user_id: authData.user.id,
              invited_username: username,
              accepted_count: acceptedCount,
            }
          });

          if (creditError) {
            console.error('Reward crediting error:', creditError);
            // Continue even if reward fails - will be retryable later
          }
        }
      }
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
      JSON.stringify({ error: 'Unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});