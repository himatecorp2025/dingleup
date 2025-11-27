import { useEffect, useRef } from 'react';
import { useLootboxActivityTracker } from './useLootboxActivityTracker';

export const useLoginLootboxTracker = (isAuthenticated: boolean) => {
  const { trackActivity } = useLootboxActivityTracker();
  const hasTrackedLogin = useRef(false);

  useEffect(() => {
    const trackLoginActivity = async () => {
      if (isAuthenticated && !hasTrackedLogin.current) {
        hasTrackedLogin.current = true;
        
        // Track daily first login activity for lootbox drop
        await trackActivity('daily_first_login', {
          timestamp: new Date().toISOString()
        });
      }
    };

    trackLoginActivity();
  }, [isAuthenticated, trackActivity]);
};
