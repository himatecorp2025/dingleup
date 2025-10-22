import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTypingStatus = (threadId: string | null, userId: string) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const setTyping = async (isTyping: boolean) => {
    if (!threadId) return;

    try {
      await supabase
        .from('typing_status')
        .upsert({
          thread_id: threadId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true
    setTyping(true);

    // Auto-clear after 5 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 5000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (threadId) {
        setTyping(false);
      }
    };
  }, [threadId]);

  return { handleTyping, stopTyping };
};
