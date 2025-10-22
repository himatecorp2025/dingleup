import { useState, useEffect } from 'react';

interface PromoHistory {
  timestamps: number[];
  cooldownUntil: number;
  scheduledTodayShown: number;
  lastDate: string;
}

export const usePromoScheduler = (userId: string | undefined) => {
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkPromoTiming = () => {
      const now = Date.now();
      const today = new Date().toDateString();
      const storageKey = `promo_scheduler_${userId}`;
      
      // Load history
      const stored = localStorage.getItem(storageKey);
      let history: PromoHistory = {
        timestamps: [],
        cooldownUntil: 0,
        scheduledTodayShown: 0,
        lastDate: today
      };

      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset if new day
        if (parsed.lastDate !== today) {
          history = {
            timestamps: [],
            cooldownUntil: 0,
            scheduledTodayShown: 0,
            lastDate: today
          };
        } else {
          history = parsed;
        }
      }

      // Filter timestamps to last 24h
      const last24h = now - (24 * 60 * 60 * 1000);
      history.timestamps = history.timestamps.filter(t => t > last24h);

      // Check limits
      if (history.timestamps.length >= 5) {
        setCanShow(false);
        return;
      }

      // Check cooldown (min 2 hours)
      if (now < history.cooldownUntil) {
        setCanShow(false);
        return;
      }

      // Check if we've shown minimum 2-3 times today
      const minShowsToday = Math.min(3, 5 - history.timestamps.length);
      if (history.scheduledTodayShown >= minShowsToday && history.timestamps.length >= 2) {
        setCanShow(false);
        return;
      }

      // Time slot intelligence (show during likely active hours)
      const hour = new Date().getHours();
      const isActiveHour = (hour >= 8 && hour <= 12) || (hour >= 17 && hour <= 23);
      
      if (!isActiveHour) {
        setCanShow(false);
        return;
      }

      // Mark as shown
      history.timestamps.push(now);
      history.cooldownUntil = now + (2 * 60 * 60 * 1000); // +2 hours
      history.scheduledTodayShown += 1;
      
      localStorage.setItem(storageKey, JSON.stringify(history));
      setCanShow(true);

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'promo_scheduled', {
          userId,
          timestamp: now,
          count: history.timestamps.length
        });
      }
    };

    // Check immediately
    checkPromoTiming();

    // Re-check every minute for immediate promo triggers
    const interval = setInterval(checkPromoTiming, 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  return canShow;
};
