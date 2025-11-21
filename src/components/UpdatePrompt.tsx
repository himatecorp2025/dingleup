import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';

export const UpdatePrompt = () => {
  const { t } = useI18n();
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    // Check if user dismissed update in last 24 hours
    const dismissedUntil = localStorage.getItem('update_dismissed_until');
    if (dismissedUntil) {
      return Date.now() < parseInt(dismissedUntil);
    }
    return false;
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Check for updates every 30 minutes (not 60 seconds)
        const interval = setInterval(() => {
          reg.update();
        }, 30 * 60 * 1000);

        return () => clearInterval(interval);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Only show if not dismissed
        const dismissedUntil = localStorage.getItem('update_dismissed_until');
        if (!dismissedUntil || Date.now() >= parseInt(dismissedUntil)) {
          setShowPrompt(true);
        }
      });

      // Listen for waiting service worker
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          const dismissedUntil = localStorage.getItem('update_dismissed_until');
          if (!dismissedUntil || Date.now() >= parseInt(dismissedUntil)) {
            setShowPrompt(true);
          }
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('update_dismissed_until', dismissUntil.toString());
    setDismissed(true);
    setShowPrompt(false);
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{t('update_prompt.title')}</p>
          <p className="text-xs text-muted-foreground">{t('update_prompt.description')}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDismiss}
          >
            {t('update_prompt.later')}
          </Button>
          <Button 
            size="sm" 
            onClick={handleUpdate}
          >
            {t('update_prompt.update')}
          </Button>
        </div>
      </div>
    </div>
  );
};
