import { useEffect, useRef } from 'react';

interface UseFullscreenOptions {
  /**
   * Enable fullscreen mode on mount
   * @default true
   */
  enabled?: boolean;
  /**
   * Auto re-enter fullscreen if user exits (e.g., by swiping)
   * @default true
   */
  autoReenter?: boolean;
  /**
   * Callback when fullscreen state changes
   */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

/**
 * Hook to manage fullscreen mode on mobile devices
 * 
 * Automatically requests fullscreen on mount and manages fullscreen state.
 * Supports both standard Fullscreen API (Android Chrome) and iOS Safari fallbacks.
 * 
 * iOS Safari limitations:
 * - Does not support Fullscreen API directly
 * - Relies on PWA manifest.json display: fullscreen
 * - Requires meta tags: apple-mobile-web-app-capable, viewport-fit=cover
 * 
 * Android Chrome:
 * - Full Fullscreen API support
 * - Status bar automatically hidden when fullscreen
 * 
 * @param options - Configuration options
 */
export const useFullscreen = (options: UseFullscreenOptions = {}) => {
  const {
    enabled = true,
    autoReenter = true,
    onFullscreenChange,
  } = options;

  const isFullscreenRequestedRef = useRef(false);
  const reenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Check if we're in a browser that supports Fullscreen API
    const supportsFullscreen = 
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen;

    // Check if already in fullscreen (e.g., PWA standalone mode)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // iOS Safari detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    const requestFullscreen = async () => {
      // Skip if already requested or in standalone mode
      if (isFullscreenRequestedRef.current || isStandalone) {
        return;
      }

      // iOS Safari doesn't support Fullscreen API
      // Fullscreen is achieved via PWA installation + meta tags
      if (isIOS) {
        console.log('[Fullscreen] iOS detected - fullscreen via PWA manifest');
        isFullscreenRequestedRef.current = true;
        return;
      }

      // Android Chrome and other browsers - use Fullscreen API
      if (supportsFullscreen) {
        try {
          const docElem = document.documentElement;
          
          if (docElem.requestFullscreen) {
            await docElem.requestFullscreen();
          } else if ((docElem as any).webkitRequestFullscreen) {
            await (docElem as any).webkitRequestFullscreen();
          } else if ((docElem as any).mozRequestFullScreen) {
            await (docElem as any).mozRequestFullScreen();
          } else if ((docElem as any).msRequestFullscreen) {
            await (docElem as any).msRequestFullscreen();
          }
          
          isFullscreenRequestedRef.current = true;
          console.log('[Fullscreen] Fullscreen mode activated');
        } catch (error) {
          console.warn('[Fullscreen] Failed to enter fullscreen:', error);
        }
      }
    };

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      const isFullscreen = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement ||
        isStandalone
      );

      onFullscreenChange?.(isFullscreen);

      // Auto re-enter fullscreen if user exits and autoReenter is enabled
      if (!isFullscreen && autoReenter && isFullscreenRequestedRef.current && !isIOS) {
        console.log('[Fullscreen] User exited fullscreen - re-entering in 500ms');
        
        // Clear any existing timeout
        if (reenterTimeoutRef.current) {
          clearTimeout(reenterTimeoutRef.current);
        }
        
        // Re-enter after brief delay
        reenterTimeoutRef.current = setTimeout(() => {
          requestFullscreen();
        }, 500);
      }
    };

    // Request fullscreen on mount
    requestFullscreen();

    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      if (reenterTimeoutRef.current) {
        clearTimeout(reenterTimeoutRef.current);
      }
    };
  }, [enabled, autoReenter, onFullscreenChange]);
};
