import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGameHelpers = (userId: string | undefined, currentQuestionIndex: number) => {
  const [help5050UsageCount, setHelp5050UsageCount] = useState(0);
  const [help2xAnswerUsageCount, setHelp2xAnswerUsageCount] = useState(0);
  const [helpAudienceUsageCount, setHelpAudienceUsageCount] = useState(0);
  const [isHelp5050ActiveThisQuestion, setIsHelp5050ActiveThisQuestion] = useState(false);
  const [isDoubleAnswerActiveThisQuestion, setIsDoubleAnswerActiveThisQuestion] = useState(false);
  const [isAudienceActiveThisQuestion, setIsAudienceActiveThisQuestion] = useState(false);
  const [usedQuestionSwap, setUsedQuestionSwap] = useState(false);
  const [removedAnswer, setRemovedAnswer] = useState<string | null>(null);
  const [audienceVotes, setAudienceVotes] = useState<Record<string, number>>({});

  const logHelpUsage = useCallback(async (helpType: 'third' | 'skip' | 'audience' | '2x_answer') => {
    if (!userId) return;
    
    try {
      await supabase.from('game_help_usage').insert({
        user_id: userId,
        category: 'mixed',
        help_type: helpType,
        question_index: currentQuestionIndex
      });
    } catch (error) {
      // Silent fail - non-critical logging
    }
  }, [userId, currentQuestionIndex]);

  const resetQuestionHelpers = useCallback(() => {
    setIsHelp5050ActiveThisQuestion(false);
    setIsDoubleAnswerActiveThisQuestion(false);
    setIsAudienceActiveThisQuestion(false);
    setUsedQuestionSwap(false);
    setRemovedAnswer(null);
    setAudienceVotes({});
  }, []);

  return {
    help5050UsageCount,
    setHelp5050UsageCount,
    help2xAnswerUsageCount,
    setHelp2xAnswerUsageCount,
    helpAudienceUsageCount,
    setHelpAudienceUsageCount,
    isHelp5050ActiveThisQuestion,
    setIsHelp5050ActiveThisQuestion,
    isDoubleAnswerActiveThisQuestion,
    setIsDoubleAnswerActiveThisQuestion,
    isAudienceActiveThisQuestion,
    setIsAudienceActiveThisQuestion,
    usedQuestionSwap,
    setUsedQuestionSwap,
    removedAnswer,
    setRemovedAnswer,
    audienceVotes,
    setAudienceVotes,
    logHelpUsage,
    resetQuestionHelpers,
  };
};
