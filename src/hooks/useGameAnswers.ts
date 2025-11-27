import { useCallback, useRef } from 'react';
import { Question, CONTINUE_AFTER_WRONG_COST } from '@/types/game';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useI18n } from '@/i18n';
import { useLootboxActivityTracker } from './useLootboxActivityTracker';

interface UseGameAnswersOptions {
  selectedAnswer: string | null;
  isAnimating: boolean;
  questionStartTime: number;
  questions: Question[];
  currentQuestionIndex: number;
  isDoubleAnswerActiveThisQuestion: boolean;
  firstAttempt: string | null;
  setFirstAttempt: (attempt: string | null) => void;
  setSecondAttempt: (attempt: string | null) => void;
  setSelectedAnswer: (answer: string | null) => void;
  addResponseTime: (time: number) => void;
  incrementCorrectAnswers: () => void;
  creditCorrectAnswer: () => Promise<void>;
  setContinueType: (type: 'timeout' | 'wrong' | 'out-of-lives') => void;
  setErrorBannerVisible: (visible: boolean) => void;
  setErrorBannerMessage: (message: string) => void;
  onAnswerProcessed?: () => void; // Optional callback after answer is processed
}

export const useGameAnswers = (options: UseGameAnswersOptions) => {
  const { t } = useI18n();
  const { trackActivity } = useLootboxActivityTracker();
  const consecutiveCorrectRef = useRef(0);
  const {
    selectedAnswer,
    isAnimating,
    questionStartTime,
    questions,
    currentQuestionIndex,
    isDoubleAnswerActiveThisQuestion,
    firstAttempt,
    setFirstAttempt,
    setSecondAttempt,
    setSelectedAnswer,
    addResponseTime,
    incrementCorrectAnswers,
    creditCorrectAnswer,
    setContinueType,
    setErrorBannerVisible,
    setErrorBannerMessage,
    onAnswerProcessed,
  } = options;

  const { triggerHaptic } = useHapticFeedback();

  const handleCorrectAnswer = useCallback(async (responseTime: number, answerKey: string) => {
    addResponseTime(responseTime);
    setSelectedAnswer(answerKey);
    incrementCorrectAnswers();
    triggerHaptic('success');
    
    // Track consecutive correct answers for answer streak
    consecutiveCorrectRef.current += 1;
    
    // Track answer streak if 3+ consecutive correct
    if (consecutiveCorrectRef.current >= 3) {
      trackActivity('answer_streak', {
        streak: consecutiveCorrectRef.current,
        question_index: currentQuestionIndex,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('[useGameAnswers] Error tracking answer_streak:', err));
    }
    
    // Add error handling for credit operation
    try {
      await creditCorrectAnswer();
    } catch (error) {
      console.error('[useGameAnswers] Error crediting correct answer:', error);
      // Don't block game flow - rewards will sync on next wallet refresh
    }

    // Trigger callback after answer is processed
    onAnswerProcessed?.();
  }, [addResponseTime, incrementCorrectAnswers, triggerHaptic, creditCorrectAnswer, setSelectedAnswer, onAnswerProcessed, trackActivity, currentQuestionIndex]);

  const handleWrongAnswer = useCallback((responseTime: number, answerKey: string) => {
    addResponseTime(responseTime);
    setSelectedAnswer(answerKey);
    setContinueType('wrong');
    triggerHaptic('error');
    
    // Reset streak on wrong answer
    consecutiveCorrectRef.current = 0;
    
    const timeoutId = setTimeout(() => {
      setErrorBannerVisible(true);
      setErrorBannerMessage(t('game.wrong_answer_banner_message').replace('{cost}', String(CONTINUE_AFTER_WRONG_COST)));
    }, 500);

    // Trigger callback after answer is processed
    onAnswerProcessed?.();
    
    // Return cleanup function
    return () => clearTimeout(timeoutId);
  }, [addResponseTime, triggerHaptic, setSelectedAnswer, setContinueType, setErrorBannerVisible, setErrorBannerMessage, t, onAnswerProcessed]);

  const handleAnswer = useCallback((answerKey: string) => {
    if (selectedAnswer || isAnimating) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerObj = currentQuestion.answers.find(a => a.key === answerKey);
    const isCorrect = selectedAnswerObj?.correct || false;

    // Track cleanup for timeouts
    const timeouts: NodeJS.Timeout[] = [];

    // 2x answer logic - only if active for this question
    if (isDoubleAnswerActiveThisQuestion && !firstAttempt) {
      setFirstAttempt(answerKey);
      
      if (isCorrect) {
        // After 200ms, show correct answer in green
        const timeoutId = setTimeout(() => {
          handleCorrectAnswer(responseTime, answerKey);
        }, 200);
        timeouts.push(timeoutId);
      }
      return;
    }

    if (isDoubleAnswerActiveThisQuestion && firstAttempt && answerKey !== firstAttempt) {
      setSecondAttempt(answerKey);
      const firstAnswerObj = currentQuestion.answers.find(a => a.key === firstAttempt);
      
      if (isCorrect || firstAnswerObj?.correct) {
        // After 200ms, show correct answer in green
        const timeoutId = setTimeout(() => {
          handleCorrectAnswer(responseTime, isCorrect ? answerKey : firstAttempt!);
        }, 200);
        timeouts.push(timeoutId);
      } else {
        // After 200ms, show wrong answer
        const timeoutId = setTimeout(() => {
          handleWrongAnswer(responseTime, answerKey);
        }, 200);
        timeouts.push(timeoutId);
      }
      return;
    }

    if (isCorrect) {
      handleCorrectAnswer(responseTime, answerKey);
    } else {
      handleWrongAnswer(responseTime, answerKey);
    }
  }, [
    selectedAnswer,
    isAnimating,
    questionStartTime,
    questions,
    currentQuestionIndex,
    isDoubleAnswerActiveThisQuestion,
    firstAttempt,
    setFirstAttempt,
    setSecondAttempt,
    handleCorrectAnswer,
    handleWrongAnswer,
  ]);

  return {
    handleAnswer,
    handleCorrectAnswer,
    handleWrongAnswer,
  };
};
