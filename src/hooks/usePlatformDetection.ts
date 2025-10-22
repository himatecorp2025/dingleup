import { useState, useEffect } from 'react';

export const usePlatformDetection = () => {
  const [isHandheld, setIsHandheld] = useState(false);

  useEffect(() => {
    const checkPlatform = () => {
      // Combined detection: viewport width + pointer type
      const isNarrowViewport = window.matchMedia('(max-width: 1024px)').matches;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      
      setIsHandheld(isNarrowViewport && hasCoarsePointer);
    };

    checkPlatform();

    // Listen for changes
    const viewportMedia = window.matchMedia('(max-width: 1024px)');
    const pointerMedia = window.matchMedia('(pointer: coarse)');

    const handleChange = () => checkPlatform();
    
    viewportMedia.addEventListener('change', handleChange);
    pointerMedia.addEventListener('change', handleChange);

    return () => {
      viewportMedia.removeEventListener('change', handleChange);
      pointerMedia.removeEventListener('change', handleChange);
    };
  }, []);

  return isHandheld;
};
