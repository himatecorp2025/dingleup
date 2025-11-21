import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Fingerprint, X } from 'lucide-react';

interface BiometricSetupDialogProps {
  onSuccess: () => void;
  onSkip: () => void;
}

export const BiometricSetupDialog = ({ onSuccess, onSkip }: BiometricSetupDialogProps) => {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnable = async () => {
    setIsSubmitting(true);

    try {
      // Ellenőrizd WebAuthn támogatást
      if (!window.PublicKeyCredential) {
        toast({
          title: t('auth.biometric.errorNotSupported'),
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Credential létrehozása
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Nincs aktív munkamenet',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'DingleUP!',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.email || user.id,
          displayName: user.email || 'DingleUP User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        toast({
          title: 'Biometrikus regisztráció megszakítva',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Credential mentése
      const attestationResponse = credential.response as AuthenticatorAttestationResponse;
      const { data, error } = await supabase.functions.invoke('setup-biometric', {
        body: {
          credential_id: credential.id,
          public_key: btoa(String.fromCharCode(...new Uint8Array(attestationResponse.attestationObject))),
        },
      });

      if (error) {
        console.error('[BiometricSetupDialog] Error:', error);
        toast({
          title: error.message || 'Hiba történt',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (data?.success) {
        toast({
          title: t('auth.biometric.successMessage'),
        });
        onSuccess();
      }
    } catch (err) {
      console.error('[BiometricSetupDialog] Unexpected error:', err);
      toast({
        title: 'Biometrikus regisztráció sikertelen',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a0033] to-[#2d1b69] border border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/50">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-full">
            <Fingerprint className="h-16 w-16 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 mb-2 text-center">
          {t('auth.biometric.title')}
        </h2>
        <p className="text-white/70 mb-6 text-center">
          {t('auth.biometric.description')}
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleEnable}
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg"
          >
            <Fingerprint className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Engedélyezés...' : t('auth.biometric.enableButton')}
          </Button>

          <Button
            onClick={onSkip}
            variant="ghost"
            className="w-full h-12 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="mr-2 h-5 w-5" />
            {t('auth.biometric.skipButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};
