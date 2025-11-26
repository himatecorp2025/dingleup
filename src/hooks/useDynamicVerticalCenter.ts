import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDynamicVerticalCenterReturn {
  overlayRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  transformStyle: React.CSSProperties;
}

/**
 * Dynamically centers content vertically within an overlay container
 * using pixel-perfect measurements with ResizeObserver
 */
export const useDynamicVerticalCenter = (): UseDynamicVerticalCenterReturn => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState<number>(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastContentHeightRef = useRef<number>(0);

  const calculateCenter = useCallback(() => {
    if (!overlayRef.current || !contentRef.current) {
      // DOM not ready - retry after 100ms
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = window.setTimeout(calculateCenter, 100);
      return;
    }

    try {
      // Measure actual bounding boxes of the BLACK overlay area and content
      const overlayRect = overlayRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      if (overlayRect.height === 0 || contentRect.height === 0) {
        // Elements not yet rendered - retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = window.setTimeout(calculateCenter, 100);
        return;
      }

      // Calculate center Y positions in viewport coordinates
      const overlayCenterY = overlayRect.top + overlayRect.height / 2;
      const contentCenterY = contentRect.top + contentRect.height / 2;

      // Calculate offset needed to align content center to overlay center
      const offsetY = overlayCenterY - contentCenterY;
      
      // Set translateY in pixels
      setTranslateY(offsetY);
      lastContentHeightRef.current = contentRect.height;
      
      if (import.meta.env.DEV) {
        console.log('[useDynamicVerticalCenter] Recalculated:', {
          overlayHeight: overlayRect.height,
          contentHeight: contentRect.height,
          overlayCenterY,
          contentCenterY,
          offsetY,
        });
      }
    } catch (error) {
      console.error('[useDynamicVerticalCenter] Error:', error);
    }
  }, []);

  useEffect(() => {
    // Initial calculation
    calculateCenter();

    // Setup ResizeObserver for automatic recalculation on size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateCenter();
    });

    if (overlayRef.current) {
      resizeObserver.observe(overlayRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Recalculate on viewport changes
    const handleResize = () => {
      calculateCenter();
    };
    window.addEventListener('resize', handleResize);

    // Recalculate on orientation change (mobile)
    const handleOrientationChange = () => {
      setTimeout(calculateCenter, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [calculateCenter]);

  // MutationObserver for DOM content changes (e.g., text changes)
  useEffect(() => {
    if (!contentRef.current) return;

    const mutationObserver = new MutationObserver(() => {
      // Content changed - recalculate after a brief delay to allow layout
      setTimeout(calculateCenter, 50);
    });

    mutationObserver.observe(contentRef.current, {
      childList: true,
      characterData: true,
      subtree: true
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [calculateCenter]);

  return {
    overlayRef,
    contentRef,
    transformStyle: {
      transform: `translateY(${translateY}px)`,
      position: 'relative' as const
    }
  };
};
