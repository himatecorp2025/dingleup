import { useState, useEffect } from 'react';

export const usePlatformDetection = () => {
  const [isHandheld, setIsHandheld] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkPlatform = () => {
      // Combined detection: viewport width + pointer type
      const isNarrowViewport = window.matchMedia('(max-width: 1024px)').matches;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      
      // Standalone (PWA) detection
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      
      setIsHandheld(isNarrowViewport && hasCoarsePointer);
      setIsStandalone(isPWA);
    };

    checkPlatform();

    // Listen for changes
    const viewportMedia = window.matchMedia('(max-width: 1024px)');
    const pointerMedia = window.matchMedia('(pointer: coarse)');
    const standaloneMedia = window.matchMedia('(display-mode: standalone)');

    const handleChange = () => checkPlatform();
    
    viewportMedia.addEventListener('change', handleChange);
    pointerMedia.addEventListener('change', handleChange);
    standaloneMedia.addEventListener('change', handleChange);

    return () => {
      viewportMedia.removeEventListener('change', handleChange);
      pointerMedia.removeEventListener('change', handleChange);
      standaloneMedia.removeEventListener('change', handleChange);
    };
  }, []);

  return { isHandheld, isStandalone };
};
