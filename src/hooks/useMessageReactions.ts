import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

export const useMessageReactions = (messageId: string) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    loadReactions();

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=eq.${messageId}`
      }, () => {
        loadReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;
      setReactions(data || []);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const addReaction = async (reaction: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          reaction
        });

      if (error) throw error;
    } catch (error: any) {
      if (error.code === '23505') {
        // Already reacted, remove it
        await removeReaction();
      } else {
        toast.error('Hiba a reakció hozzáadásakor');
      }
    }
  };

  const removeReaction = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  return { reactions, addReaction };
};
