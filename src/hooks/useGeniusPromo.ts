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
      const lastPromoDate = localStorage.getItem(`genius_promo_date_${userId}`);
      const now = Date.now();

      // Reset counter if it's a new day
      if (lastPromoDate) {
        const lastDate = new Date(parseInt(lastPromoDate));
        const today = new Date();
        if (lastDate.toDateString() !== today.toDateString()) {
          localStorage.setItem(`genius_promo_count_${userId}`, '0');
        }
      }

      // Check if we can show promo (max 5 per day)
      const currentCount = parseInt(localStorage.getItem(`genius_promo_count_${userId}`) || '0');
      
      if (currentCount >= 5) {
        return;
      }

      const lastShown = parseInt(localStorage.getItem(`genius_promo_last_${userId}`) || '0');
      const timeSinceLastPromo = now - lastShown;

      // Show immediately if never shown, otherwise after 2 minutes
      const minInterval = 2 * 60 * 1000; // 2 minutes

      if (lastShown === 0 || timeSinceLastPromo > minInterval) {
        setShouldShow(true);
        localStorage.setItem(`genius_promo_last_${userId}`, now.toString());
        localStorage.setItem(`genius_promo_count_${userId}`, (currentCount + 1).toString());
        localStorage.setItem(`genius_promo_date_${userId}`, now.toString());
      }
    };

    // Show after 30 seconds (give user time to see dashboard first)
    const timer = setTimeout(() => {
      checkAndShow();
    }, 30000);

    return () => clearTimeout(timer);
  }, [userId, isPremium, hasOtherDialogs]);

  const closePromo = () => setShouldShow(false);

  return { shouldShow, closePromo };
};
