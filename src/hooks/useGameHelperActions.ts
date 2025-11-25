import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Question, getSkipCost } from '@/types/game';

interface UseGameHelperActionsOptions {
  profile: any;
  refreshProfile: () => Promise<void>;
  logHelpUsage: (helpType: 'third' | 'skip' | 'audience' | '2x_answer') => Promise<void>;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  help5050UsageCount: number;
  help2xAnswerUsageCount: number;
  helpAudienceUsageCount: number;
  isHelp5050ActiveThisQuestion: boolean;
  isDoubleAnswerActiveThisQuestion: boolean;
  isAudienceActiveThisQuestion: boolean;
  usedQuestionSwap: boolean;
  setRemovedAnswer: (answer: string | null) => void;
  setIsHelp5050ActiveThisQuestion: (active: boolean) => void;
  setHelp5050UsageCount: (count: number) => void;
  setIsDoubleAnswerActiveThisQuestion: (active: boolean) => void;
  setHelp2xAnswerUsageCount: (count: number) => void;
  setFirstAttempt: (attempt: string | null) => void;
  setSecondAttempt: (attempt: string | null) => void;
  setAudienceVotes: (votes: Record<string, number>) => void;
  setIsAudienceActiveThisQuestion: (active: boolean) => void;
  setHelpAudienceUsageCount: (count: number) => void;
  setQuestions: (questions: Question[]) => void;
  resetTimer: (time: number) => void;
  setQuestionStartTime: (time: number) => void;
  setUsedQuestionSwap: (used: boolean) => void;
  ALL_QUESTIONS: Question[];
}

export const useGameHelperActions = (options: UseGameHelperActionsOptions) => {
  const {
    profile,
    refreshProfile,
    logHelpUsage,
    questions,
    currentQuestionIndex,
    selectedAnswer,
    help5050UsageCount,
    help2xAnswerUsageCount,
    helpAudienceUsageCount,
    isHelp5050ActiveThisQuestion,
    isDoubleAnswerActiveThisQuestion,
    isAudienceActiveThisQuestion,
    usedQuestionSwap,
    setRemovedAnswer,
    setIsHelp5050ActiveThisQuestion,
    setHelp5050UsageCount,
    setIsDoubleAnswerActiveThisQuestion,
    setHelp2xAnswerUsageCount,
    setFirstAttempt,
    setSecondAttempt,
    setAudienceVotes,
    setIsAudienceActiveThisQuestion,
    setHelpAudienceUsageCount,
    setQuestions,
    resetTimer,
    setQuestionStartTime,
    setUsedQuestionSwap,
    ALL_QUESTIONS,
  } = options;

  const useHelp5050 = useCallback(async () => {
    if (selectedAnswer || isHelp5050ActiveThisQuestion) return;
    
    if (help5050UsageCount >= 2) return;
    
    const cost = help5050UsageCount === 0 ? 0 : 15;
    
    try {
      if (help5050UsageCount === 0 && profile?.help_third_active) {
        const currentQuestion = questions[currentQuestionIndex];
        const thirdAnswerKey = currentQuestion.third;
        
        setRemovedAnswer(thirdAnswerKey);
        setIsHelp5050ActiveThisQuestion(true);
        setHelp5050UsageCount(1);
        
        await supabase.rpc('use_help', { p_help_type: 'third' });
        await refreshProfile();
        await logHelpUsage('third');
        return;
      }
      
      if (help5050UsageCount === 1) {
        if (!profile || profile.coins < cost) {
          toast.error(`Nincs elég aranyérméd! ${cost} aranyérme szükséges.`);
          return;
        }
        
        const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
        if (success) {
          await refreshProfile();
          const currentQuestion = questions[currentQuestionIndex];
          const thirdAnswerKey = currentQuestion.third;
          
          setRemovedAnswer(thirdAnswerKey);
          setIsHelp5050ActiveThisQuestion(true);
          setHelp5050UsageCount(2);
          await logHelpUsage('third');
        }
      }
    } catch (error) {
      console.error('[useGameHelperActions] Error in useHelp5050:', error);
      toast.error('Hiba történt a segítség aktiválásakor!');
    }
  }, [
    selectedAnswer, isHelp5050ActiveThisQuestion, help5050UsageCount, profile,
    questions, currentQuestionIndex, setRemovedAnswer, setIsHelp5050ActiveThisQuestion,
    setHelp5050UsageCount, refreshProfile, logHelpUsage
  ]);

  const useHelp2xAnswer = useCallback(async () => {
    if (selectedAnswer || isDoubleAnswerActiveThisQuestion) return;
    
    if (help2xAnswerUsageCount >= 2) return;
    
    const cost = help2xAnswerUsageCount === 0 ? 0 : 20;
    
    try {
      if (help2xAnswerUsageCount === 0 && profile?.help_2x_answer_active) {
        setIsDoubleAnswerActiveThisQuestion(true);
        setHelp2xAnswerUsageCount(1);
        setFirstAttempt(null);
        setSecondAttempt(null);
        
        await supabase.rpc('use_help', { p_help_type: '2x_answer' });
        await refreshProfile();
        await logHelpUsage('2x_answer');
        return;
      }
      
      if (help2xAnswerUsageCount === 1) {
        if (!profile || profile.coins < cost) {
          toast.error(`Nincs elég aranyérméd! ${cost} aranyérme szükséges.`);
          return;
        }
        
        const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
        if (success) {
          await refreshProfile();
          setIsDoubleAnswerActiveThisQuestion(true);
          setHelp2xAnswerUsageCount(2);
          setFirstAttempt(null);
          setSecondAttempt(null);
          await logHelpUsage('2x_answer');
        }
      }
    } catch (error) {
      console.error('[useGameHelperActions] Error in useHelp2xAnswer:', error);
      toast.error('Hiba történt a segítség aktiválásakor!');
    }
  }, [
    selectedAnswer, isDoubleAnswerActiveThisQuestion, help2xAnswerUsageCount,
    profile, setIsDoubleAnswerActiveThisQuestion, setHelp2xAnswerUsageCount,
    setFirstAttempt, setSecondAttempt, refreshProfile, logHelpUsage
  ]);

  const useHelpAudience = useCallback(async () => {
    if (selectedAnswer || isAudienceActiveThisQuestion) return;
    
    if (helpAudienceUsageCount >= 2) return;
    
    const cost = helpAudienceUsageCount === 0 ? 0 : 25;
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const correctKey = currentQuestion.answers.find(a => a.correct)?.key || 'A';
      
      const correctVote = 65 + Math.floor(Math.random() * 20);
      const remaining = 100 - correctVote;
      
      const wrongKeys = currentQuestion.answers.filter(a => !a.correct).map(a => a.key);
      const votes: Record<string, number> = {};
      
      if (wrongKeys.length === 2) {
        const first = Math.floor(Math.random() * (remaining - 1)) + 1;
        const second = remaining - first;
        votes[wrongKeys[0]] = Math.min(first, second);
        votes[wrongKeys[1]] = Math.max(first, second);
      }
      votes[correctKey] = correctVote;
      
      if (helpAudienceUsageCount === 0 && profile?.help_audience_active) {
        setAudienceVotes(votes);
        setIsAudienceActiveThisQuestion(true);
        setHelpAudienceUsageCount(1);
        
        await supabase.rpc('use_help', { p_help_type: 'audience' });
        await refreshProfile();
        await logHelpUsage('audience');
        return;
      }
      
      if (helpAudienceUsageCount === 1) {
        if (!profile || profile.coins < cost) {
          toast.error(`Nincs elég aranyérméd! ${cost} aranyérme szükséges.`);
          return;
        }
        
        const { data: success } = await supabase.rpc('spend_coins', { amount: cost });
        if (success) {
          await refreshProfile();
          setAudienceVotes(votes);
          setIsAudienceActiveThisQuestion(true);
          setHelpAudienceUsageCount(2);
          await logHelpUsage('audience');
        }
      }
    } catch (error) {
      console.error('[useGameHelperActions] Error in useHelpAudience:', error);
      toast.error('Hiba történt a segítség aktiválásakor!');
    }
  }, [
    selectedAnswer, isAudienceActiveThisQuestion, helpAudienceUsageCount,
    profile, questions, currentQuestionIndex, setAudienceVotes,
    setIsAudienceActiveThisQuestion, setHelpAudienceUsageCount,
    refreshProfile, logHelpUsage
  ]);

  const useQuestionSwap = useCallback(async () => {
    if (usedQuestionSwap || selectedAnswer) return;
    
    const skipCost = getSkipCost(currentQuestionIndex);
    
    if (!profile || profile.coins < skipCost) {
      toast.error(`Nincs elég aranyérméd a kérdés átugrásához! ${skipCost} aranyérme szükséges.`);
      return;
    }
    
    const success = await supabase.rpc('spend_coins', { amount: skipCost });
    if (!success.data) return;
    
    const currentIds = questions.map(q => q.id);
    const availableQuestions = ALL_QUESTIONS.filter(q => !currentIds.includes(q.id));
    
    if (availableQuestions.length === 0) return;
    
    const newQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = newQuestion;
    setQuestions(updatedQuestions);
    
    await logHelpUsage('skip');
    
    resetTimer(10);
    setRemovedAnswer(null);
    setAudienceVotes({});
    setFirstAttempt(null);
    setQuestionStartTime(Date.now());
    setUsedQuestionSwap(true);
    
    await refreshProfile();
  }, [
    usedQuestionSwap, selectedAnswer, currentQuestionIndex, profile,
    questions, ALL_QUESTIONS, setQuestions, logHelpUsage, resetTimer,
    setRemovedAnswer, setAudienceVotes, setFirstAttempt,
    setQuestionStartTime, setUsedQuestionSwap, refreshProfile
  ]);

  return {
    useHelp5050,
    useHelp2xAnswer,
    useHelpAudience,
    useQuestionSwap,
  };
};
