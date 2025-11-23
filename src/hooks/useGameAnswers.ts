import { useCallback } from 'react';
import { Question, CONTINUE_AFTER_WRONG_COST } from '@/types/game';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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
}

export const useGameAnswers = (options: UseGameAnswersOptions) => {
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
  } = options;

  const { triggerHaptic } = useHapticFeedback();

  const handleCorrectAnswer = useCallback(async (responseTime: number, answerKey: string) => {
    addResponseTime(responseTime);
    setSelectedAnswer(answerKey);
    incrementCorrectAnswers();
    triggerHaptic('success');
    await creditCorrectAnswer();
  }, [addResponseTime, incrementCorrectAnswers, triggerHaptic, creditCorrectAnswer, setSelectedAnswer]);

  const handleWrongAnswer = useCallback((responseTime: number, answerKey: string) => {
    addResponseTime(responseTime);
    setSelectedAnswer(answerKey);
    setContinueType('wrong');
    triggerHaptic('error');
    
    setTimeout(() => {
      setErrorBannerVisible(true);
      setErrorBannerMessage(`Rossz válasz! Folytatáshoz ${CONTINUE_AFTER_WRONG_COST} aranyérme szükséges.`);
    }, 500);
  }, [addResponseTime, triggerHaptic, setSelectedAnswer, setContinueType, setErrorBannerVisible, setErrorBannerMessage]);

  const handleAnswer = useCallback((answerKey: string) => {
    if (selectedAnswer || isAnimating) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerObj = currentQuestion.answers.find(a => a.key === answerKey);
    const isCorrect = selectedAnswerObj?.correct || false;

    // 2x answer logic - only if active for this question
    if (isDoubleAnswerActiveThisQuestion && !firstAttempt) {
      setFirstAttempt(answerKey);
      
      if (isCorrect) {
        // After 200ms, show correct answer in green
        setTimeout(() => {
          handleCorrectAnswer(responseTime, answerKey);
        }, 200);
      }
      return;
    }

    if (isDoubleAnswerActiveThisQuestion && firstAttempt && answerKey !== firstAttempt) {
      setSecondAttempt(answerKey);
      const firstAnswerObj = currentQuestion.answers.find(a => a.key === firstAttempt);
      
      if (isCorrect || firstAnswerObj?.correct) {
        // After 200ms, show correct answer in green
        setTimeout(() => {
          handleCorrectAnswer(responseTime, isCorrect ? answerKey : firstAttempt!);
        }, 200);
      } else {
        // After 200ms, show wrong answer
        setTimeout(() => {
          handleWrongAnswer(responseTime, answerKey);
        }, 200);
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
