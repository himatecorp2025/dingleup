import { useState, useCallback } from 'react';
import { CONTINUE_AFTER_WRONG_COST, TIMEOUT_CONTINUE_COST } from '@/types/game';

interface UseGameErrorHandlingOptions {
  questionStartTime: number;
  addResponseTime: (time: number) => void;
  setSelectedAnswer: (answer: string | null) => void;
  triggerHaptic: (type: 'success' | 'warning' | 'error') => void;
}

export const useGameErrorHandling = (options: UseGameErrorHandlingOptions) => {
  const {
    questionStartTime,
    addResponseTime,
    setSelectedAnswer,
    triggerHaptic,
  } = options;

  const [continueType, setContinueType] = useState<'timeout' | 'wrong' | 'out-of-lives'>('wrong');
  const [errorBannerVisible, setErrorBannerVisible] = useState(false);
  const [errorBannerMessage, setErrorBannerMessage] = useState('');
  const [showRescuePopup, setShowRescuePopup] = useState(false);
  const [rescueReason, setRescueReason] = useState<'NO_LIFE' | 'NO_GOLD'>('NO_GOLD');

  const handleTimeout = useCallback(() => {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    addResponseTime(responseTime);
    setSelectedAnswer('__timeout__');
    setContinueType('timeout');
    triggerHaptic('warning');
    setErrorBannerVisible(true);
    setErrorBannerMessage(`Lejárt az idő! Folytatáshoz ${TIMEOUT_CONTINUE_COST} aranyérme szükséges.`);
  }, [questionStartTime, addResponseTime, setSelectedAnswer, triggerHaptic]);

  return {
    continueType,
    setContinueType,
    errorBannerVisible,
    setErrorBannerVisible,
    errorBannerMessage,
    setErrorBannerMessage,
    showRescuePopup,
    setShowRescuePopup,
    rescueReason,
    setRescueReason,
    handleTimeout,
  };
};
