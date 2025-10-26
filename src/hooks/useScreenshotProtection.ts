import { useEffect, useState } from 'react';

/**
 * Hook to protect sensitive content from screenshots
 * Uses Page Visibility API to blur/hide content when user leaves page
 */
export const useScreenshotProtection = (enabled: boolean = true) => {
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      // When page becomes hidden (user switches to screenshot tool, etc.)
      if (document.hidden) {
        setIsProtected(true);
      } else {
        // Small delay before showing content again
        setTimeout(() => {
          setIsProtected(false);
        }, 100);
      }
    };

    const handleBlur = () => {
      // Additional protection when window loses focus
      setIsProtected(true);
    };

    const handleFocus = () => {
      // Restore content when window regains focus
      setTimeout(() => {
        setIsProtected(false);
      }, 100);
    };

    // Listen to visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled]);

  return isProtected;
};
