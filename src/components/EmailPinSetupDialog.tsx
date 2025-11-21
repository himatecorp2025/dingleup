import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Lock } from 'lucide-react';

interface EmailPinSetupDialogProps {
  onSuccess: () => void;
}

export const EmailPinSetupDialog = ({ onSuccess }: EmailPinSetupDialogProps) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validálás
    if (!/^\d{6}$/.test(pin)) {
      toast({
        title: t('auth.emailPin.errorInvalidPin'),
        variant: 'destructive',
      });
      return;
    }

    if (pin !== pinConfirm) {
      toast({
        title: t('auth.emailPin.errorPinMismatch'),
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: t('auth.emailPin.errorInvalidEmail'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-email-pin', {
        body: { email, pin },
      });

      if (error) {
        console.error('[EmailPinSetupDialog] Error:', error);
        toast({
          title: error.message || t('auth.emailPin.errorGeneric'),
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: t('auth.emailPin.successMessage'),
        });
        onSuccess();
      }
    } catch (err) {
      console.error('[EmailPinSetupDialog] Unexpected error:', err);
      toast({
        title: t('auth.emailPin.errorUnexpected'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a0033] to-[#2d1b69] border border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/50">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 mb-2 text-center">
          {t('auth.emailPin.title')}
        </h2>
        <p className="text-white/70 mb-6 text-center text-sm">
          {t('auth.emailPin.description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-white flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('auth.emailPin.emailLabel')}
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
              {t('auth.emailPin.pinLabel')}
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

          <div>
            <Label htmlFor="pinConfirm" className="text-white flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('auth.emailPin.pinConfirmLabel')}
            </Label>
            <Input
              id="pinConfirm"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
              className="mt-1 bg-white/10 border-white/20 text-white text-center text-2xl tracking-widest"
              required
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !email || pin.length !== 6 || pinConfirm.length !== 6}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg"
          >
            {isSubmitting ? t('auth.emailPin.submitting') : t('auth.emailPin.submitButton')}
          </Button>
        </form>
      </div>
    </div>
  );
};
