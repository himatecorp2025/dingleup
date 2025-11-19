import { useState, useEffect, useRef, useCallback } from 'react';

interface UseGameTimerOptions {
  initialTime: number;
  onTimeout: () => void;
  enabled: boolean;
}

/**
 * Secure game timer with proper cleanup and race condition prevention
 */
export const useGameTimer = ({ initialTime, onTimeout, enabled }: UseGameTimerOptions) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const hasTimedOutRef = useRef(false);

  // Keep timeout callback ref updated
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset timer when initialTime changes
  useEffect(() => {
    setTimeLeft(initialTime);
    hasTimedOutRef.current = false;
  }, [initialTime]);

  // Timer logic
  useEffect(() => {
    if (!enabled) {
      // Clear timer if disabled
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Trigger timeout callback when reaching 0
          if (newTime === 0 && !hasTimedOutRef.current) {
            hasTimedOutRef.current = true;
            // Use setTimeout to prevent state update during render
            setTimeout(() => onTimeoutRef.current(), 0);
          }
          
          return newTime;
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft, enabled]);

  const resetTimer = useCallback((newTime?: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(newTime ?? initialTime);
    hasTimedOutRef.current = false;
  }, [initialTime]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    timeLeft,
    resetTimer,
    pauseTimer,
  };
};
