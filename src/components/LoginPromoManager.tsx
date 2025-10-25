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
    // Only show once per session on first login for non-Genius users
    if (!userId || isGenius) return;

    const lastShown = sessionStorage.getItem(SESSION_KEY);
    if (lastShown) return; // Already shown this session

    const timer = setTimeout(() => {
      setShowPromo(true);
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      if (userId) {
        trackPromoEvent(userId, 'shown', 'login_promo', { trigger: 'first_login' });
      }
    }, 2000); // 2 second delay after login
    
    return () => clearTimeout(timer);
  }, [userId, isGenius]);

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
