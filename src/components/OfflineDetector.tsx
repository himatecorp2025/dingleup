import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineDetector = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast({
          title: t('common.connectionRestored'),
          description: t('common.internetAvailable'),
          duration: 3000,
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast({
        title: t('common.noInternet'),
        description: t('common.offlineFunctionsUnavailable'),
        duration: 5000,
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, t]);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">{t('common.noInternet')}</span>
    </div>
  );
};
