import { useState, useEffect } from 'react';

export const useGeniusPromo = (
  userId: string | undefined,
  isPremium: boolean,
  hasOtherDialogs: boolean
) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!userId || isPremium || hasOtherDialogs) {
      setShouldShow(false);
      return;
    }

    const checkAndShow = () => {
      const now = Date.now();
      const today = new Date().toDateString();
      
      // Get today's data
      const promoDataKey = `genius_promo_data_${userId}`;
      const storedData = localStorage.getItem(promoDataKey);
      
      let promoData = {
        date: today,
        count: 0,
        lastShown: 0,
        cooldownUntil: 0
      };

      if (storedData) {
        const parsed = JSON.parse(storedData);
        // Reset if it's a new day
        if (parsed.date !== today) {
          promoData = { date: today, count: 0, lastShown: 0, cooldownUntil: 0 };
        } else {
          promoData = parsed;
        }
      }

      // Check max 5 per day
      if (promoData.count >= 5) {
        return;
      }

      // Check 2 hour cooldown
      if (now < promoData.cooldownUntil) {
        return;
      }

      // Show the promo
      setShouldShow(true);
      
      // Update data
      promoData.count += 1;
      promoData.lastShown = now;
      promoData.cooldownUntil = now + (2 * 60 * 60 * 1000); // +2 hours
      
      localStorage.setItem(promoDataKey, JSON.stringify(promoData));

      // Track impression
      trackEvent('popup_impression', 'sub_promo');
    };

    // Show after 30 seconds
    const timer = setTimeout(() => {
      checkAndShow();
    }, 30000);

    return () => clearTimeout(timer);
  }, [userId, isPremium, hasOtherDialogs]);

  const closePromo = () => {
    setShouldShow(false);
    trackEvent('popup_close', 'sub_promo');
  };

  const handleSubscribe = () => {
    trackEvent('popup_cta_click', 'sub_promo', 'subscribe');
  };

  const handleLater = () => {
    trackEvent('popup_cta_click', 'sub_promo', 'later');
    closePromo();
  };

  return { shouldShow, closePromo, handleSubscribe, handleLater };
};

// Analytics helper
const trackEvent = (event: string, type: string, action?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      type,
      action,
      timestamp: new Date().toISOString()
    });
  }
  
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${event}`, { type, action });
  }
};
