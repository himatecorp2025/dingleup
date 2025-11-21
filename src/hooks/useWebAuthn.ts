import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  isWebAuthnSupported, 
  generateChallenge, 
  createCredential, 
  getCredential,
  base64urlEncode
} from '@/lib/webauthnUtils';
import { useToast } from '@/hooks/use-toast';

export function useWebAuthn() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Register new biometric credential
  const registerBiometric = async (username: string, userId?: string) => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported on this device');
    }

    setIsProcessing(true);
    try {
      // Get userId from session if not provided
      let actualUserId = userId;
      if (!actualUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        actualUserId = user.id;
      }

      const challenge = generateChallenge();
      
      // Create credential
      const { credentialId, publicKey } = await createCredential(
        username,
        actualUserId,
        challenge
      );

      // Save credential to backend
      const { error } = await supabase.functions.invoke('register-webauthn-credential', {
        body: {
          credential_id: credentialId,
          public_key: publicKey,
        },
      });

      if (error) {
        throw new Error('Failed to register biometric credential');
      }

      return { success: true };
    } catch (error) {
      console.error('Biometric registration error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Authenticate using biometric
  const authenticateBiometric = async (username: string) => {
    if (!isWebAuthnSupported()) {
      throw new Error('WebAuthn is not supported on this device');
    }

    setIsProcessing(true);
    try {
      // Get user profile to check if biometric is enabled
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webauthn_credential_id, biometric_enabled')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        throw new Error('User not found');
      }

      if (!profile.biometric_enabled || !profile.webauthn_credential_id) {
        throw new Error('Biometric authentication not enabled for this user');
      }

      // Generate and store challenge on server
      const challenge = generateChallenge();
      const challengeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          webauthn_challenge: base64urlEncode(challenge.buffer as ArrayBuffer),
          challenge_expires_at: challengeExpiry.toISOString(),
        })
        .eq('username', username);

      if (updateError) {
        throw new Error('Failed to generate challenge');
      }

      // Get credential from authenticator
      const { authenticatorData, clientDataJSON, signature } = await getCredential(
        profile.webauthn_credential_id,
        challenge
      );

      // Verify with backend
      const { data, error } = await supabase.functions.invoke('verify-webauthn-authentication', {
        body: {
          username,
          credential_id: profile.webauthn_credential_id,
          authenticator_data: authenticatorData,
          client_data_json: clientDataJSON,
          signature,
        },
      });

      if (error || !data?.success) {
        throw new Error('Biometric authentication failed');
      }

      // Sign in with Supabase Auth using service role (requires backend support)
      // For now, we'll rely on the verify function to create the session
      
      return { success: true, userId: data.user_id };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if biometric is available for user
  const checkBiometricAvailable = async (username: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('biometric_enabled, webauthn_credential_id')
        .eq('username', username)
        .single();

      if (error || !profile) {
        return false;
      }

      return profile.biometric_enabled && !!profile.webauthn_credential_id;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  };

  return {
    registerBiometric,
    authenticateBiometric,
    checkBiometricAvailable,
    isProcessing,
    isSupported: isWebAuthnSupported(),
  };
}
