import { useState, useEffect } from 'react';

export const useWeeklyWinners = (userId: string | undefined) => {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkShouldShow = async () => {
      setLoading(true);
      try {
        // Check device type - only show on mobile/tablet
        const isMobileOrTablet = window.innerWidth <= 1024;
        if (!isMobileOrTablet) {
          setShowDialog(false);
          setLoading(false);
          return;
        }

        // Check if user has already seen the weekly winners dialog this week
        const lastShownKey = `weekly-winners-last-shown-${userId}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (!lastShown || now - parseInt(lastShown) > oneWeek) {
          setShowDialog(true);
          localStorage.setItem(lastShownKey, now.toString());
        } else {
          setShowDialog(false);
        }
      } catch (error) {
        console.error('[WEEKLY-WINNERS] Error checking:', error);
        setShowDialog(false);
      } finally {
        setLoading(false);
      }
    };

    checkShouldShow();
  }, [userId]);

  const handleClose = () => {
    setShowDialog(false);
  };

  return {
    showDialog,
    loading,
    handleClose
  };
};