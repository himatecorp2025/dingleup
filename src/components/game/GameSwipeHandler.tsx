import { useEffect, useRef, ReactNode } from 'react';

interface GameSwipeHandlerProps {
  enabled: boolean;
  isAnimating: boolean;
  showExitDialog: boolean;
  swipeThreshold: number;
  translateY: number;
  onTranslateYChange: (value: number) => void;
  onTouchStartYChange: (value: number) => void;
  onSwipeUp: () => Promise<void>;
  onSwipeDown: () => Promise<void>;
  children: ReactNode;
}

export const GameSwipeHandler = ({
  enabled,
  isAnimating,
  showExitDialog,
  swipeThreshold,
  translateY,
  onTranslateYChange,
  onTouchStartYChange,
  onSwipeUp,
  onSwipeDown,
  children
}: GameSwipeHandlerProps) => {
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let rafId: number | null = null;
    let currentTranslateY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (isAnimating || showExitDialog) return;
      const startY = e.touches[0].clientY;
      touchStartYRef.current = startY;
      onTouchStartYChange(startY);
      currentTranslateY = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isAnimating || showExitDialog) return;
      
      const currentY = e.touches[0].clientY;
      const delta = currentY - touchStartYRef.current;
      
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        currentTranslateY = delta * 0.35;
        onTranslateYChange(currentTranslateY);
      });
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      if (isAnimating || showExitDialog) return;
      
      if (rafId) cancelAnimationFrame(rafId);
      
      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchStartYRef.current - touchEndY;

      if (Math.abs(delta) < swipeThreshold) {
        onTranslateYChange(0);
        return;
      }

      if (delta > 0) {
        await onSwipeUp();
      } else {
        await onSwipeDown();
      }
      
      onTranslateYChange(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isAnimating, showExitDialog, swipeThreshold, onSwipeUp, onSwipeDown, onTranslateYChange, onTouchStartYChange]);

  return <>{children}</>;
};
