import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatPermissions {
  canSend: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useChatPermissions = (
  threadId: string | null,
  userId: string | undefined
): ChatPermissions => {
  const [canSend, setCanSend] = useState(true); // Default to true for better UX
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    if (!threadId || !userId) {
      setCanSend(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('thread_participants')
        .select('can_send')
        .eq('thread_id', threadId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no record exists, assume can send (for backwards compatibility)
        console.log('[useChatPermissions] No permissions record, defaulting to can send');
        setCanSend(true);
      } else {
        setCanSend(data?.can_send ?? true);
      }
    } catch (error) {
      console.error('[useChatPermissions] Error loading permissions:', error);
      setCanSend(true); // Default to allow on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();

    // Listen for permission changes
    if (!threadId || !userId) return;

    const channel = supabase
      .channel(`thread-permissions-${threadId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'thread_participants',
        filter: `thread_id=eq.${threadId}`
      }, (payload) => {
        console.log('[useChatPermissions] Permissions changed:', payload);
        loadPermissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, userId]);

  return { canSend, loading, refresh: loadPermissions };
};
