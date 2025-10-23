import { useEffect } from 'react';

/**
 * iOS viewport fix for keyboard handling
 * Updates --vh CSS variable based on visualViewport
 */
export const useIOSViewport = () => {
  useEffect(() => {
    // Check if visualViewport is supported (modern iOS/Safari)
    if (typeof window.visualViewport === 'undefined') {
      // Fallback: use window.innerHeight
      const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      setVh();
      window.addEventListener('resize', setVh);
      return () => window.removeEventListener('resize', setVh);
    }

    // Modern approach with visualViewport
    const updateVh = () => {
      const vh = window.visualViewport!.height * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVh();
    window.visualViewport!.addEventListener('resize', updateVh);
    window.visualViewport!.addEventListener('scroll', updateVh);

    return () => {
      window.visualViewport!.removeEventListener('resize', updateVh);
      window.visualViewport!.removeEventListener('scroll', updateVh);
    };
  }, []);
};
