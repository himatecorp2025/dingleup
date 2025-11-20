import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
}

export const useMessageReactions = (messageId: string) => {
  const { t } = useTranslation();
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
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      // Check if user already has a reaction on this message
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('reaction')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .single();

      if (existingReaction) {
        // If same reaction, remove it (toggle off)
        if (existingReaction.reaction === reaction) {
          await removeReaction();
          return;
        }
        
        // Different reaction, update it
        const { error } = await supabase
          .from('message_reactions')
          .update({ reaction })
          .eq('message_id', messageId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // No existing reaction, add new one
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: userId,
            reaction
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      toast.error(t('errors.reactionAddFailed'));
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
