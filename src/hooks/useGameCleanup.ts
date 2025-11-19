import { useEffect, useRef } from 'react';

/**
 * Hook to manage cleanup of timeouts, intervals, and async operations
 * Prevents memory leaks and ensures proper cleanup on unmount
 */
export const useGameCleanup = () => {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const abortControllersRef = useRef<Set<AbortController>>(new Set());

  const registerTimeout = (timeout: NodeJS.Timeout) => {
    timeoutsRef.current.add(timeout);
    return timeout;
  };

  const clearRegisteredTimeout = (timeout: NodeJS.Timeout) => {
    clearTimeout(timeout);
    timeoutsRef.current.delete(timeout);
  };

  const registerInterval = (interval: NodeJS.Timeout) => {
    intervalsRef.current.add(interval);
    return interval;
  };

  const clearRegisteredInterval = (interval: NodeJS.Timeout) => {
    clearInterval(interval);
    intervalsRef.current.delete(interval);
  };

  const createAbortController = () => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    return controller;
  };

  const abortController = (controller: AbortController) => {
    controller.abort();
    abortControllersRef.current.delete(controller);
  };

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();

      // Clear all intervals
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();

      // Abort all controllers
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    registerTimeout,
    clearRegisteredTimeout,
    registerInterval,
    clearRegisteredInterval,
    createAbortController,
    abortController,
  };
};
