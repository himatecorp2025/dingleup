import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserPresence = (userId: string | undefined) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsOnline(false);
      return;
    }

    // Initial load
    loadPresence();

    // Realtime subscription
    const channel = supabase
      .channel(`presence-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_presence',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('[useUserPresence] presence changed', payload);
        loadPresence();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadPresence = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('is_online, last_seen')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsOnline(data?.is_online || false);
    } catch (error) {
      console.error('Error loading presence:', error);
      setIsOnline(false);
    }
  };

  return { isOnline, refresh: loadPresence };
};
