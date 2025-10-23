import { useEffect, useState } from 'react';
import { GeniusPromoDialog } from './GeniusPromoDialog';

interface LoginPromoManagerProps {
  isGenius: boolean;
  userId: string | null;
}

const SESSION_KEY = 'last_login_promo_shown';

export const LoginPromoManager = ({ isGenius, userId }: LoginPromoManagerProps) => {
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    // Only show for normal (non-Genius) users
    if (isGenius || !userId) {
      return;
    }

    // Check if already shown in this session
    const lastShown = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();
    
    // Show once per session (cleared on browser close)
    if (!lastShown) {
      // Small delay to ensure other modals (age-gate, etc.) go first
      const timer = setTimeout(() => {
        setShowPromo(true);
        sessionStorage.setItem(SESSION_KEY, now.toString());
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isGenius, userId]);

  return (
    <GeniusPromoDialog
      open={showPromo}
      onClose={() => setShowPromo(false)}
      onSubscribe={() => {
        console.log('[LoginPromo] Subscribe clicked');
      }}
      onLater={() => {
        console.log('[LoginPromo] Later clicked');
        setShowPromo(false);
      }}
    />
  );
};
