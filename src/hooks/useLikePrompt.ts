import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLikePromptOptions {
  currentQuestionIndex: number;
  questionId: string | null;
  gameSessionId: string | null;
}

export const useLikePrompt = ({ currentQuestionIndex, questionId, gameSessionId }: UseLikePromptOptions) => {
  const [isLikePromptOpen, setIsLikePromptOpen] = useState(false);

  const checkAndShowLikePrompt = useCallback(async () => {
    // Check after any question (1-15)
    if (currentQuestionIndex < 1 || currentQuestionIndex > 15) {
      return;
    }

    // CRITICAL: Don't show popup if questionId is missing
    if (!questionId) {
      console.warn('[useLikePrompt] Cannot show popup - questionId is null');
      return;
    }

    // Don't check if no gameSessionId (can't track per-session)
    if (!gameSessionId) {
      console.warn('[useLikePrompt] Cannot check eligibility - gameSessionId is null');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-like-prompt-eligibility', {
        body: { 
          questionIndex: currentQuestionIndex,
          gameSessionId 
        }
      });

      if (error) {
        console.error('[useLikePrompt] Error checking eligibility:', error);
        return;
      }

      if (data?.eligible) {
        console.log(`[useLikePrompt] Eligible to show - session ${gameSessionId}, question ${currentQuestionIndex}`);
        setIsLikePromptOpen(true);
      }
    } catch (error) {
      console.error('[useLikePrompt] Error in checkAndShowLikePrompt:', error);
    }
  }, [currentQuestionIndex, questionId, gameSessionId]);

  const recordPromptView = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('record-like-prompt-view', {
        body: { gameSessionId }
      });

      if (error) {
        console.error('[useLikePrompt] Error recording prompt view:', error);
      } else {
        console.log(`[useLikePrompt] Recorded view for session ${gameSessionId}`);
      }
    } catch (error) {
      console.error('[useLikePrompt] Error in recordPromptView:', error);
    }
  }, [gameSessionId]);

  const handleCloseLikePrompt = useCallback(() => {
    setIsLikePromptOpen(false);
    // Record view when closing (whether liked or not)
    recordPromptView();
  }, [recordPromptView]);

  const handleLikeFromPrompt = useCallback(async (onLikeCallback: () => Promise<boolean>) => {
    // Validate questionId exists before proceeding
    if (!questionId) {
      console.error('[useLikePrompt] No questionId available');
      recordPromptView();
      setIsLikePromptOpen(false);
      return;
    }

    // Execute the like action and get result
    const wasSuccessful = await onLikeCallback();
    
    // Only credit coins and life if the like was successful (new like, not already liked)
    if (wasSuccessful) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('[useLikePrompt] No active session');
          return;
        }

        const { data, error } = await supabase.functions.invoke('credit-like-popup-reward', {
          body: { questionId },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) {
          console.error('[useLikePrompt] Error crediting rewards:', error);
        } else if (data?.success) {
          console.log('[useLikePrompt] Successfully credited +10 gold and +1 life');
        }
      } catch (error) {
        console.error('[useLikePrompt] Error in reward crediting:', error);
      }
    } else {
      console.log('[useLikePrompt] Like was not successful, no reward credited');
    }
    
    // Record view
    recordPromptView();
    // Close popup
    setIsLikePromptOpen(false);
  }, [recordPromptView, questionId]);

  return {
    isLikePromptOpen,
    checkAndShowLikePrompt,
    handleCloseLikePrompt,
    handleLikeFromPrompt,
  };
};
