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
      // Measure actual heights in pixels based on real DOM layout
      const overlayRect = overlayRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const overlayHeight = overlayRect.height;
      const contentHeight = contentRect.height;

      if (overlayHeight === 0 || contentHeight === 0) {
        // Elements not yet rendered - retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = window.setTimeout(calculateCenter, 100);
        return;
      }

      // Measure line height to determine line count
      const styles = window.getComputedStyle(contentRef.current);
      const lineHeightPx = parseFloat(styles.lineHeight);
      const approxLines = Math.round(contentHeight / lineHeightPx);
      
      // Determine if 1-line or 2-line
      const is1Line = approxLines <= 1;
      const is2Line = approxLines === 2;
      
      // Calculate mathematical center for both cases
      let offsetY = (overlayHeight / 2) - (contentHeight / 2);
      
      // Optional fine-tuning (can be adjusted if needed)
      if (is1Line) {
        // 1-line: use pure mathematical center
        // offsetY remains as calculated
      } else if (is2Line) {
        // 2-line: use pure mathematical center, optionally add +1-2px if needed
        // offsetY remains as calculated (or add small adjustment if testing shows it's needed)
      }
      
      // Set translateY in pixels
      setTranslateY(offsetY);
      lastContentHeightRef.current = contentHeight;
      
      if (import.meta.env.DEV) {
        console.log('[useDynamicVerticalCenter] Recalculated:', {
          overlayHeight,
          contentHeight,
          lineHeightPx,
          approxLines,
          lineCount: is1Line ? 1 : is2Line ? 2 : 3,
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
