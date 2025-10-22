import { useState, useEffect } from 'react';

export const useGeniusPromo = (
  userId: string | undefined,
  isPremium: boolean,
  hasOtherDialogs: boolean,
  dailyGiftJustClaimed: boolean = false
) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!userId || isPremium || hasOtherDialogs) {
      setShouldShow(false);
      return;
    }

    const checkAndShow = () => {
      const now = Date.now();
      const today = new Date().toISOString().split('T')[0];
      const dailyFirstShownKey = `subPromoShownDate`;
      const dailyFirstShown = localStorage.getItem(dailyFirstShownKey);
      
      // PRIORITY: Daily first show after Daily Gift
      if (dailyGiftJustClaimed && dailyFirstShown !== today) {
        setShouldShow(true);
        localStorage.setItem(dailyFirstShownKey, today);
        
        // Track in promo data
        const promoDataKey = `genius_promo_data_${userId}`;
        const storedData = localStorage.getItem(promoDataKey);
        let promoData = storedData ? JSON.parse(storedData) : { date: today, count: 0, lastShown: 0, cooldownUntil: 0 };
        if (promoData.date !== today) {
          promoData = { date: today, count: 0, lastShown: 0, cooldownUntil: 0 };
        }
        promoData.count += 1;
        promoData.lastShown = now;
        promoData.cooldownUntil = now + (2 * 60 * 60 * 1000);
        localStorage.setItem(promoDataKey, JSON.stringify(promoData));
        
        trackEvent('popup_impression', 'daily_first_sub');
        return;
      }

      // If daily first already shown today, don't show again as "mandatory"
      if (dailyFirstShown === today) {
        return;
      }
      
      // Check first eligible time (30-60 minutes after first login)
      const firstEligibleKey = `genius_promo_first_eligible_${userId}`;
      let firstEligibleTime = localStorage.getItem(firstEligibleKey);
      
      if (!firstEligibleTime) {
        // Calculate random delay: 30 + random(0-30) minutes
        const jitterMinutes = 30 + Math.floor(Math.random() * 31);
        const eligibleAt = now + (jitterMinutes * 60 * 1000);
        localStorage.setItem(firstEligibleKey, eligibleAt.toString());
        firstEligibleTime = eligibleAt.toString();
      }
      
      // Don't show if first eligible time hasn't passed
      if (now < parseInt(firstEligibleTime)) {
        return;
      }
      
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

    // Show after 30 seconds (or immediately if daily gift just claimed)
    const timer = setTimeout(() => {
      checkAndShow();
    }, dailyGiftJustClaimed ? 0 : 30000);

    return () => clearTimeout(timer);
  }, [userId, isPremium, hasOtherDialogs, dailyGiftJustClaimed]);

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
