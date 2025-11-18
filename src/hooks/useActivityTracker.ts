import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformDetection } from './usePlatformDetection';

type ActivitySource = 'app_open' | 'route_view' | 'interaction' | 'gameplay' | 'purchase' | 'chat';

export const useActivityTracker = (source: ActivitySource = 'route_view') => {
  const isHandheld = usePlatformDetection();
  const lastActivityRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  const markActive = () => {
    lastActivityRef.current = Date.now();
  };

  const sendPing = async () => {
    if (!isHandheld) return;

    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    
    // Was there activity in the last 5 minutes?
    if (now - lastActivityRef.current < fiveMinutesMs) {
      const bucket = Math.floor(now / fiveMinutesMs) * fiveMinutesMs;
      const bucketStart = new Date(bucket).toISOString();
      
      try {
        // CRITICAL: Get fresh session with explicit token for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          return;
        }

        await supabase.functions.invoke('log-activity-ping', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: {
            bucketStart,
            source,
            deviceClass: isHandheld ? 'mobile' : 'tablet'
          }
        });
      } catch (error) {
        // Silent fail
      }
    }
  };

  useEffect(() => {
    if (!isHandheld) return;

    // Mark initial activity
    markActive();

    // Track user interactions
    const handleInteraction = () => markActive();
    
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('scroll', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    // Check and send ping every minute
    intervalRef.current = setInterval(sendPing, 60 * 1000);

    // Send initial ping after 5 seconds
    const initialTimeout = setTimeout(sendPing, 5000);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(initialTimeout);
    };
  }, [isHandheld, source]);

  return { markActive };
};
