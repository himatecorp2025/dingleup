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
    // TEST MODE: Always show immediately on mount/login (no session limit, works for all users)
    const timer = setTimeout(() => {
      setShowPromo(true);
      if (userId) {
        trackPromoEvent(userId, 'shown', 'login_promo', { trigger: 'login_test' });
      }
    }, 0);
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
