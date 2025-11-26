import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLikePromptOptions {
  currentQuestionIndex: number;
  questionId: string | null;
}

export const useLikePrompt = ({ currentQuestionIndex, questionId }: UseLikePromptOptions) => {
  const [isLikePromptOpen, setIsLikePromptOpen] = useState(false);

  const checkAndShowLikePrompt = useCallback(async () => {
    // Check after any question (1-15)
    if (currentQuestionIndex < 1 || currentQuestionIndex > 15) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-like-prompt-eligibility', {
        body: { questionIndex: currentQuestionIndex }
      });

      if (error) {
        console.error('[useLikePrompt] Error checking eligibility:', error);
        return;
      }

      if (data?.eligible) {
        setIsLikePromptOpen(true);
      }
    } catch (error) {
      console.error('[useLikePrompt] Error in checkAndShowLikePrompt:', error);
    }
  }, [currentQuestionIndex]);

  const recordPromptView = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('record-like-prompt-view', {
        body: {}
      });

      if (error) {
        console.error('[useLikePrompt] Error recording prompt view:', error);
      }
    } catch (error) {
      console.error('[useLikePrompt] Error in recordPromptView:', error);
    }
  }, []);

  const handleCloseLikePrompt = useCallback(() => {
    setIsLikePromptOpen(false);
    // Record view when closing (whether liked or not)
    recordPromptView();
  }, [recordPromptView]);

  const handleLikeFromPrompt = useCallback(async (onLikeCallback: () => Promise<boolean>) => {
    // Execute the like action and get result
    const wasSuccessful = await onLikeCallback();
    
    // Only credit coins if the like was successful (not already liked)
    if (wasSuccessful && questionId) {
      try {
        const { data, error } = await supabase.functions.invoke('credit-like-popup-reward', {
          body: { questionId }
        });

        if (error) {
          console.error('[useLikePrompt] Error crediting coin reward:', error);
        } else if (data?.success) {
          console.log('[useLikePrompt] Successfully credited +10 coins');
        }
      } catch (error) {
        console.error('[useLikePrompt] Error in coin reward:', error);
      }
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
