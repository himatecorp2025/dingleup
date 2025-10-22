import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'active' | 'blocked';

export const useFriendshipStatus = (userId: string | undefined, targetUserId: string) => {
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadStatus();

    // Realtime subscription (bármely friendship változás)
    const channel = supabase
      .channel(`friendship-status-${targetUserId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friendships'
      }, (payload) => {
        console.log('[useFriendshipStatus] friendships changed', payload);
        loadStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, targetUserId]);

  const loadStatus = async () => {
    if (!userId) return;

    try {
      const [userA, userB] = userId < targetUserId 
        ? [userId, targetUserId] 
        : [targetUserId, userId];

      const { data: friendship } = await supabase
        .from('friendships')
        .select('status, requested_by')
        .eq('user_id_a', userA)
        .eq('user_id_b', userB)
        .single();

      if (!friendship) {
        setStatus('none');
      } else if (friendship.status === 'active') {
        setStatus('active');
      } else if (friendship.status === 'blocked') {
        setStatus('blocked');
      } else if (friendship.status === 'pending') {
        setStatus(friendship.requested_by === userId ? 'pending_sent' : 'pending_received');
      } else {
        setStatus('none');
      }
    } catch (error) {
      console.error('Error loading friendship status:', error);
      setStatus('none');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-friend-request', {
        body: { userId: targetUserId }
      });
      if (error) throw error;
      await loadStatus();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  return { status, loading, sendRequest, refresh: loadStatus };
};
