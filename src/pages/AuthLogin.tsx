import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock, Fingerprint, ArrowLeft } from 'lucide-react';

export default function AuthLogin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      toast({
        title: t('auth.login.errorInvalidCredentials'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('login-with-email-pin', {
        body: { email, pin },
      });

      if (error) {
        console.error('[AuthLogin] Error:', error);
        toast({
          title: t('auth.login.errorInvalidCredentials'),
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (data?.success && data?.device_id) {
        // Device ID mentése localStorage-ba
        localStorage.setItem('dingleup_device_id', data.device_id);

        // Auto-register hook fog működni a device_id-val
        toast({
          title: t('auth.login.successMessage'),
        });

        // Navigálj a dashboardra
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('[AuthLogin] Unexpected error:', err);
      toast({
        title: 'Váratlan hiba történt',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!window.PublicKeyCredential) {
        toast({
          title: t('auth.biometric.errorNotSupported'),
          variant: 'destructive',
        });
        return;
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        timeout: 60000,
        userVerification: 'required',
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        toast({
          title: 'Biometrikus bejelentkezés még nem teljes',
          description: 'Hamarosan elérhető!',
        });
      }
    } catch (err) {
      console.error('[AuthLogin] Biometric error:', err);
      toast({
        title: 'Biometrikus bejelentkezés sikertelen',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Back button */}
        <Button
          onClick={() => navigate('/account-choice')}
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('auth.login.backButton')}
        </Button>

        {/* Logo */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 drop-shadow-lg">
            DingleUP!
          </h1>
          <h2 className="text-2xl font-bold text-white">
            {t('auth.login.title')}
          </h2>
        </div>

        {/* Login form */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('auth.login.emailLabel')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-white/10 border-white/20 text-white"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="pin" className="text-white flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('auth.login.pinLabel')}
              </Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="mt-1 bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest"
                required
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email || pin.length !== 6}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg"
            >
              {isSubmitting ? 'Bejelentkezés...' : t('auth.login.submitButton')}
            </Button>
          </form>

          {/* Biometric option */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/70">
                  {t('auth.login.orBiometric')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleBiometricLogin}
              variant="outline"
              className="w-full h-12 mt-4 border-white/20 text-white hover:bg-white/10"
            >
              <Fingerprint className="mr-2 h-5 w-5" />
              {t('auth.login.biometricButton')}
            </Button>
          </div>

          {/* Reset PIN */}
          <Button
            type="button"
            variant="link"
            className="w-full mt-4 text-white/70 hover:text-white"
          >
            {t('auth.login.resetPinButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
