import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePresenceHeartbeat = (userId: string | undefined, enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!userId || !enabled) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from('user_presence')
          .upsert({
            user_id: userId,
            is_online: true,
            last_seen: new Date().toISOString()
          });
      } catch (error) {
        console.error('[usePresenceHeartbeat] Error updating presence:', error);
      }
    };

    // Initial update
    updatePresence();

    // Update every 15 seconds
    intervalRef.current = setInterval(updatePresence, 15000);

    // Set offline on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Set offline status
      supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          is_online: false,
          last_seen: new Date().toISOString()
        });
    };
  }, [userId, enabled]);
};
