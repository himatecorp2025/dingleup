import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          reg.update();
        }, 60000);

        return () => clearInterval(interval);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowPrompt(true);
      });

      // Listen for waiting service worker
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          setShowPrompt(true);
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
    setDismissed(true);
    setShowPrompt(false);
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Új verzió elérhető</p>
          <p className="text-xs text-muted-foreground">Frissítsd az alkalmazást a legújabb verziókhoz.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleDismiss}
          >
            Később
          </Button>
          <Button 
            size="sm" 
            onClick={handleUpdate}
          >
            Frissítés
          </Button>
        </div>
      </div>
    </div>
  );
};
