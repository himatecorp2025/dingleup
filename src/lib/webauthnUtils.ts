// WebAuthn utility functions for biometric authentication

// Base64URL encode helper
export function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Base64URL decode helper
export function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create &&
    navigator.credentials.get
  );
}

// Generate random challenge
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Create WebAuthn credential for registration
export async function createCredential(
  username: string,
  userId: string,
  challenge: Uint8Array
): Promise<{
  credentialId: string;
  publicKey: string;
  authenticatorData: string;
  clientDataJSON: string;
}> {
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rp: {
      name: 'DingleUP!',
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId).buffer as ArrayBuffer,
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to create credential');
  }

  const response = credential.response as AuthenticatorAttestationResponse;

  // Extract public key from attestation object
  const attestationObject = new Uint8Array(response.attestationObject);
  
  return {
    credentialId: base64urlEncode(credential.rawId),
    publicKey: base64urlEncode(response.getPublicKey()!),
    authenticatorData: base64urlEncode(response.getAuthenticatorData()),
    clientDataJSON: base64urlEncode(response.clientDataJSON),
  };
}

// Get WebAuthn credential for authentication
export async function getCredential(
  credentialId: string,
  challenge: Uint8Array
): Promise<{
  credentialId: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
}> {
  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    allowCredentials: [
      {
        id: base64urlDecode(credentialId).buffer as ArrayBuffer,
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    userVerification: 'required',
    timeout: 60000,
  };

  const credential = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  }) as PublicKeyCredential;

  if (!credential) {
    throw new Error('Failed to get credential');
  }

  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    credentialId: base64urlEncode(credential.rawId),
    authenticatorData: base64urlEncode(response.authenticatorData),
    clientDataJSON: base64urlEncode(response.clientDataJSON),
    signature: base64urlEncode(response.signature),
  };
}
