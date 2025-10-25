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

        // TESTING MODE: Always show on every refresh
        // TODO: Implement weekly check when testing is complete
        setShowDialog(true);
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