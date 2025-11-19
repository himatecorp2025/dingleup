import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuestionLikeStatus {
  liked: boolean;
  likeCount: number;
  loading: boolean;
}

export const useQuestionLike = (questionId: string | null) => {
  const [status, setStatus] = useState<QuestionLikeStatus>({
    liked: false,
    likeCount: 0,
    loading: true,
  });

  // Fetch initial like status and setup realtime subscription
  useEffect(() => {
    if (!questionId) {
      setStatus({ liked: false, likeCount: 0, loading: false });
      return;
    }

    const fetchLikeStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setStatus({ liked: false, likeCount: 0, loading: false });
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-question-like-status', {
          body: { questionId },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) throw error;

        if (data?.success) {
          setStatus({
            liked: data.liked,
            likeCount: data.question_like_count,
            loading: false,
          });
        }
      } catch (error) {
        console.error('[useQuestionLike] Fetch error:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLikeStatus();

    // Setup realtime subscription for like count updates
    const channel = supabase
      .channel(`question-likes-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'questions',
          filter: `id=eq.${questionId}`,
        },
        (payload) => {
          if (payload.new && 'like_count' in payload.new) {
            setStatus(prev => ({
              ...prev,
              likeCount: payload.new.like_count as number,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  // Toggle like
  const toggleLike = async (): Promise<boolean> => {
    if (!questionId) return false;

    const previousStatus = { ...status };
    
    // Optimistic update
    setStatus(prev => ({
      ...prev,
      liked: !prev.liked,
      likeCount: prev.liked ? Math.max(0, prev.likeCount - 1) : prev.likeCount + 1,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus(previousStatus);
        toast.error('Nem vagy bejelentkezve');
        return false;
      }
      
      const { data, error } = await supabase.functions.invoke('toggle-question-like', {
        body: { questionId },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        // Update with actual server values
        setStatus({
          liked: data.liked,
          likeCount: data.question_like_count,
          loading: false,
        });
        return data.liked;
      } else {
        throw new Error('Toggle failed');
      }
    } catch (error) {
      console.error('[useQuestionLike] Toggle error:', error);
      // Revert optimistic update
      setStatus(previousStatus);
      toast.error('Nem sikerült frissíteni a lájkot');
      return previousStatus.liked;
    }
  };

  return {
    liked: status.liked,
    likeCount: status.likeCount,
    loading: status.loading,
    toggleLike,
  };
};