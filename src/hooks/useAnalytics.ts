import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  trackPageView,
  trackPageExit,
  trackAppSession,
  clearSession,
} from '@/lib/analytics';

/**
 * Hook to track user analytics across the application
 * Automatically tracks:
 * - Page views and exits
 * - App open/close/visibility
 * - Session duration
 */
export const useAnalytics = () => {
  const location = useLocation();
  const previousRouteRef = useRef<string>('');
  const pageStartTimeRef = useRef<number>(Date.now());
  const appStartTimeRef = useRef<number>(Date.now());
  const userIdRef = useRef<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userIdRef.current = session.user.id;
        
        // Track app opened
        await trackAppSession(session.user.id, 'app_opened');
      }
    };
    
    getUserId();

    // Track app closed on unmount/refresh
    const handleBeforeUnload = async () => {
      if (userIdRef.current) {
        const sessionDuration = Math.floor((Date.now() - appStartTimeRef.current) / 1000);
        await trackAppSession(userIdRef.current, 'app_closed', sessionDuration);
        clearSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!userIdRef.current) return;

      if (document.hidden) {
        await trackAppSession(userIdRef.current, 'tab_hidden');
      } else {
        await trackAppSession(userIdRef.current, 'tab_visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Track page views and exits
  useEffect(() => {
    const trackPage = async () => {
      if (!userIdRef.current) return;

      // Track previous page exit
      if (previousRouteRef.current) {
        const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        await trackPageExit(userIdRef.current, previousRouteRef.current, timeOnPage);
      }

      // Track new page view
      await trackPageView(
        userIdRef.current,
        location.pathname,
        previousRouteRef.current || undefined
      );

      // Update refs
      previousRouteRef.current = location.pathname;
      pageStartTimeRef.current = Date.now();
    };

    trackPage();
  }, [location.pathname]);

  return {
    userId: userIdRef.current,
  };
};