import { useState, useCallback } from 'react';
import { GameCategory, Question } from '@/types/game';

type GameState = 'playing' | 'finished' | 'out-of-lives';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const incrementCorrectAnswers = useCallback(() => {
    setCorrectAnswers(prev => prev + 1);
  }, []);

  const addResponseTime = useCallback((time: number) => {
    setResponseTimes(prev => [...prev, time]);
  }, []);

  const addCoins = useCallback((amount: number) => {
    setCoinsEarned(prev => prev + amount);
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev + 1);
  }, []);

  const resetGameState = useCallback(() => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setCoinsEarned(0);
    setResponseTimes([]);
  }, []);

  return {
    gameState,
    setGameState,
    questions,
    setQuestions,
    currentQuestionIndex,
    correctAnswers,
    coinsEarned,
    responseTimes,
    incrementCorrectAnswers,
    addResponseTime,
    addCoins,
    nextQuestion,
    resetGameState,
  };
};
