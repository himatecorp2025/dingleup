import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, X, AlertCircle } from 'lucide-react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';

interface BiometricSetupModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  userId?: string; // Optional - will be fetched from session if not provided
  onSuccess?: () => void;
}

export function BiometricSetupModal({
  open,
  onClose,
  username,
  userId,
  onSuccess,
}: BiometricSetupModalProps) {
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { registerBiometric, isProcessing, isSupported } = useWebAuthn();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleEnableBiometric = async () => {
    if (!isSupported) {
      toast({
        title: "A biometrikus hitelesítés nem támogatott",
        description: t('biometric.not_supported_description'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setError(null);
      await registerBiometric(username, userId);
      
      toast({
        title: "Biometrikus bejelentkezés aktiválva!",
        description: t('biometric.success_description'),
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      if (newAttemptCount >= 2) {
        // After 2 failed attempts, close modal and continue with normal login
        toast({
          title: "Biometrikus beállítás sikertelen",
          description: t('biometric.setup_failed_description'),
          variant: 'destructive',
        });
        onClose();
      } else {
        // Allow retry
        setError(t('biometric.setup_error_retry'));
      }
    }
  };

  const handleSkip = () => {
    toast({
      title: "Biometrikus hitelesítés kihagyva",
      description: t('biometric.skipped_description'),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-background via-background/95 to-primary/5 border-primary/20">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
            <Fingerprint className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {t('biometric.enable_title')}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {t('biometric.enable_description')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {attemptCount > 0 && attemptCount < 2 && (
          <p className="text-center text-sm text-muted-foreground">
            {t('biometric.attempt_count').replace('{current}', String(attemptCount + 1)).replace('{total}', '3')}
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleEnableBiometric}
            disabled={isProcessing || !isSupported}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <span className="animate-pulse">{t('biometric.setting_up')}</span>
              </>
            ) : (
              t('biometric.enable_button')
            )}
          </Button>
          
          <Button
            onClick={handleSkip}
            variant="ghost"
            disabled={isProcessing}
            className="w-full"
          >
            {t('biometric.later_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
