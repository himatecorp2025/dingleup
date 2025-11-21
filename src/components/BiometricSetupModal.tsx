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

  const handleEnableBiometric = async () => {
    if (!isSupported) {
      toast({
        title: 'Nem támogatott',
        description: 'Ez az eszköz nem támogatja a biometrikus azonosítást.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setError(null);
      await registerBiometric(username, userId);
      
      toast({
        title: 'Sikeres beállítás',
        description: 'A biometrikus belépés sikeresen engedélyezve!',
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      if (newAttemptCount >= 2) {
        // After 2 failed attempts, close modal and continue with normal login
        toast({
          title: 'Biometrikus beállítás sikertelen',
          description: 'Folytathatod a normál bejelentkezéssel. Később a profilodban is beállíthatod.',
          variant: 'destructive',
        });
        onClose();
      } else {
        // Allow retry
        setError('A biometrikus azonosítást nem sikerült beállítani. Kérlek, próbáld újra!');
      }
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Átugorva',
      description: 'Később a profilodban engedélyezheted a biometrikus belépést.',
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
            Engedélyezed a biometrikus belépést?
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Ha engedélyezed, a DingleUP! a készüléked Face ID, Touch ID, Ujjlenyomat vagy Windows Hello azonosítóját fogja használni a gyorsabb belépéshez.
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
            Próbálkozás: {attemptCount + 1}/3
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
                <span className="animate-pulse">Beállítás...</span>
              </>
            ) : (
              'Biometrikus belépés engedélyezése'
            )}
          </Button>
          
          <Button
            onClick={handleSkip}
            variant="ghost"
            disabled={isProcessing}
            className="w-full"
          >
            Később beállítom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
