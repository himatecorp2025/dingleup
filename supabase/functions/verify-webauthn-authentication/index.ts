import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64URL decode helper
function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { username, credential_id, authenticator_data, client_data_json, signature } = await req.json();

    if (!username || !credential_id || !authenticator_data || !client_data_json || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, webauthn_credential_id, webauthn_public_key, webauthn_challenge, challenge_expires_at')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify credential ID matches
    if (profile.webauthn_credential_id !== credential_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid credential' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify challenge hasn't expired
    if (!profile.webauthn_challenge || !profile.challenge_expires_at) {
      return new Response(
        JSON.stringify({ error: 'No active challenge' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const challengeExpiry = new Date(profile.challenge_expires_at);
    if (challengeExpiry < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Challenge expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature using Web Crypto API
    const publicKeyBytes = base64urlDecode(profile.webauthn_public_key);
    const signatureBytes = base64urlDecode(signature);
    const authenticatorDataBytes = base64urlDecode(authenticator_data);
    const clientDataBytes = base64urlDecode(client_data_json);

    // Import public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBytes.buffer as ArrayBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // Create signed data: authenticatorData + SHA256(clientDataJSON)
    const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataBytes.buffer as ArrayBuffer);
    const signedData = new Uint8Array(authenticatorDataBytes.length + clientDataHash.byteLength);
    signedData.set(authenticatorDataBytes, 0);
    signedData.set(new Uint8Array(clientDataHash), authenticatorDataBytes.length);

    // Verify signature
    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureBytes.buffer as ArrayBuffer,
      signedData.buffer as ArrayBuffer
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear challenge after successful verification
    await supabaseAdmin
      .from('profiles')
      .update({
        webauthn_challenge: null,
        challenge_expires_at: null,
      })
      .eq('id', profile.id);

    // Create auth session
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: profile.id,
        message: 'Biometric authentication successful'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-webauthn-authentication:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
