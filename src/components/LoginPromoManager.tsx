import { useEffect, useState } from 'react';
import { GeniusPromoDialog } from './GeniusPromoDialog';
import { trackPromoEvent } from '@/lib/analytics';

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
        
        // Track promo shown
        trackPromoEvent(userId, 'shown', 'login_promo', {
          trigger: 'login',
          times_shown_before: 0
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isGenius, userId]);

  return (
    <GeniusPromoDialog
      open={showPromo}
      onClose={() => {
        setShowPromo(false);
        if (userId) {
          trackPromoEvent(userId, 'closed', 'login_promo');
        }
      }}
      onSubscribe={() => {
        console.log('[LoginPromo] Subscribe clicked');
        if (userId) {
          trackPromoEvent(userId, 'accepted', 'login_promo');
        }
      }}
      onLater={() => {
        console.log('[LoginPromo] Later clicked');
        setShowPromo(false);
        if (userId) {
          trackPromoEvent(userId, 'dismissed', 'login_promo');
        }
      }}
    />
  );
};
