import { useState, useCallback, useRef } from 'react';

/**
 * useDebounce hook to prevent rapid successive function calls
 * Returns [debouncedFn, isDebouncing]
 */
export const useDebounce = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 500
): [T, boolean] => {
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback(
    ((...args: Parameters<T>) => {
      // If already debouncing, ignore this call
      if (isDebouncing) {
        return Promise.reject(new Error('Function is debouncing'));
      }

      // Set debouncing state
      setIsDebouncing(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Execute the function immediately
      const result = fn(...args);

      // Reset debouncing state after delay
      timeoutRef.current = setTimeout(() => {
        setIsDebouncing(false);
        timeoutRef.current = null;
      }, delay);

      return result;
    }) as T,
    [fn, delay, isDebouncing]
  );

  return [debouncedFn, isDebouncing];
};
