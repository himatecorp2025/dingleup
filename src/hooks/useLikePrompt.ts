import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLikePromptOptions {
  currentQuestionIndex: number;
  questionId: string | null;
}

export const useLikePrompt = ({ currentQuestionIndex, questionId }: UseLikePromptOptions) => {
  const [isLikePromptOpen, setIsLikePromptOpen] = useState(false);

  const checkAndShowLikePrompt = useCallback(async () => {
    // Only check after questions 5, 6, 7, 8, 9, 10 (0-indexed: 5-10)
    const eligibleQuestions = [5, 6, 7, 8, 9, 10];
    if (!eligibleQuestions.includes(currentQuestionIndex)) {
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

  const handleLikeFromPrompt = useCallback((onLikeCallback: () => void) => {
    // Execute the like action
    onLikeCallback();
    // Record view
    recordPromptView();
    // Close popup
    setIsLikePromptOpen(false);
  }, [recordPromptView]);

  return {
    isLikePromptOpen,
    checkAndShowLikePrompt,
    handleCloseLikePrompt,
    handleLikeFromPrompt,
  };
};
