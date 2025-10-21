import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserPresence = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Set user as online
    const setOnline = async () => {
      await supabase.from('user_presence').upsert({
        user_id: userId,
        is_online: true,
        last_seen: new Date().toISOString(),
      });
    };

    // Update presence every 60 seconds
    setOnline();
    const interval = setInterval(setOnline, 60000);

    // Set offline on unmount or page close
    const setOffline = async () => {
      await supabase.from('user_presence').update({
        is_online: false,
        last_seen: new Date().toISOString(),
      }).eq('user_id', userId);
    };

    window.addEventListener('beforeunload', setOffline);

    return () => {
      clearInterval(interval);
      setOffline();
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [userId]);
};
