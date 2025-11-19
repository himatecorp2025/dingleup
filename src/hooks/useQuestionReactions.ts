import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseQuestionReactionsResult {
  liked: boolean;
  disliked: boolean;
  likeCount: number;
  dislikeCount: number;
  toggleLike: () => Promise<void>;
  toggleDislike: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface QuestionReactionStatus {
  liked: boolean;
  disliked: boolean;
  questionLikeCount: number;
  questionDislikeCount: number;
}

export function useQuestionReactions(questionId: string): UseQuestionReactionsResult {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial reaction status
  const fetchReactionStatus = useCallback(async () => {
    if (!questionId || questionId.trim() === '') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke(
        'get-question-reaction-status',
        {
          body: { questionId },
        }
      );

      if (fetchError) throw fetchError;

      const status = data as QuestionReactionStatus;
      setLiked(status.liked);
      setDisliked(status.disliked);
      setLikeCount(status.questionLikeCount);
      setDislikeCount(status.questionDislikeCount);
    } catch (err) {
      console.error('[useQuestionReactions] Fetch error:', err);
      setError('Failed to load reaction status');
      // Don't throw - just set error state
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchReactionStatus();
  }, [fetchReactionStatus]);

  // Toggle LIKE
  const toggleLike = useCallback(async () => {
    if (!questionId || questionId.trim() === '') {
      console.warn('[useQuestionReactions] Cannot toggle like - invalid questionId');
      return;
    }

    // Optimistic update
    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;

    try {
      // Calculate optimistic state
      let newLiked = !liked;
      let newDisliked = disliked;
      let newLikeCount = likeCount;
      let newDislikeCount = dislikeCount;

      if (liked) {
        // Toggle off LIKE
        newLiked = false;
        newLikeCount = Math.max(0, likeCount - 1);
      } else {
        // Toggle on LIKE
        newLiked = true;
        newLikeCount = likeCount + 1;
        
        // Remove DISLIKE if exists
        if (disliked) {
          newDisliked = false;
          newDislikeCount = Math.max(0, dislikeCount - 1);
        }
      }

      // Apply optimistic update
      setLiked(newLiked);
      setDisliked(newDisliked);
      setLikeCount(newLikeCount);
      setDislikeCount(newDislikeCount);

      // Call API
      const { data, error: toggleError } = await supabase.functions.invoke(
        'toggle-question-reaction',
        {
          body: { questionId, reactionType: 'like' },
        }
      );

      if (toggleError) throw toggleError;

      // Update with server response
      const response = data as QuestionReactionStatus;
      setLiked(response.liked);
      setDisliked(response.disliked);
      setLikeCount(response.questionLikeCount);
      setDislikeCount(response.questionDislikeCount);

    } catch (err) {
      console.error('[useQuestionReactions] Toggle like error:', err);
      // Rollback optimistic update
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikeCount(prevLikeCount);
      setDislikeCount(prevDislikeCount);
      setError('Failed to update like');
    }
  }, [questionId, liked, disliked, likeCount, dislikeCount]);

  // Toggle DISLIKE
  const toggleDislike = useCallback(async () => {
    if (!questionId || questionId.trim() === '') {
      console.warn('[useQuestionReactions] Cannot toggle dislike - invalid questionId');
      return;
    }

    // Optimistic update
    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;

    try {
      // Calculate optimistic state
      let newLiked = liked;
      let newDisliked = !disliked;
      let newLikeCount = likeCount;
      let newDislikeCount = dislikeCount;

      if (disliked) {
        // Toggle off DISLIKE
        newDisliked = false;
        newDislikeCount = Math.max(0, dislikeCount - 1);
      } else {
        // Toggle on DISLIKE
        newDisliked = true;
        newDislikeCount = dislikeCount + 1;
        
        // Remove LIKE if exists
        if (liked) {
          newLiked = false;
          newLikeCount = Math.max(0, likeCount - 1);
        }
      }

      // Apply optimistic update
      setLiked(newLiked);
      setDisliked(newDisliked);
      setLikeCount(newLikeCount);
      setDislikeCount(newDislikeCount);

      // Call API
      const { data, error: toggleError } = await supabase.functions.invoke(
        'toggle-question-reaction',
        {
          body: { questionId, reactionType: 'dislike' },
        }
      );

      if (toggleError) throw toggleError;

      // Update with server response
      const response = data as QuestionReactionStatus;
      setLiked(response.liked);
      setDisliked(response.disliked);
      setLikeCount(response.questionLikeCount);
      setDislikeCount(response.questionDislikeCount);

    } catch (err) {
      console.error('[useQuestionReactions] Toggle dislike error:', err);
      // Rollback optimistic update
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikeCount(prevLikeCount);
      setDislikeCount(prevDislikeCount);
      setError('Failed to update dislike');
    }
  }, [questionId, liked, disliked, likeCount, dislikeCount]);

  return {
    liked,
    disliked,
    likeCount,
    dislikeCount,
    toggleLike,
    toggleDislike,
    loading,
    error,
  };
}