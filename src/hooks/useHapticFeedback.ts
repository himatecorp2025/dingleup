import { useCallback } from 'react';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Hook for triggering haptic feedback on mobile devices
 * Provides tactile feedback for critical game interactions
 */
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: HapticFeedbackType = 'light') => {
    // Check if device supports haptic feedback
    if (!('vibrate' in navigator)) return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([10, 30, 10]); // Short-pause-short pattern
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]); // Medium-pause-medium pattern
          break;
        case 'error':
          navigator.vibrate([50, 100, 50, 100, 50]); // Heavy triple buzz
          break;
        default:
          navigator.vibrate(10);
      }
    } catch (error) {
      // Silently fail if vibration not supported or permission denied
      console.debug('[HapticFeedback] Vibration not available:', error);
    }
  }, []);

  return { triggerHaptic };
};
